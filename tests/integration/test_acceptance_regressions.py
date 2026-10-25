"""Integration boundary regression tests. Mocked RPC is NOT live-chain acceptance."""
import copy
import os
import json
from pathlib import Path
from unittest.mock import MagicMock
import pytest
from fastapi.testclient import TestClient
from web3 import Web3
from services.api.src.blockchain import BlockchainClient
from services.api.src.evidence.flight_recorder import FlightRecorder, GENESIS_HASH
from services.device_crypto.crypto_engine import PaymentIntent, compute_eip712_digest, compute_calldata_hash, recover_signer

ROOT = Path(__file__).resolve().parents[2]
EP, WALLET, TOKEN, VENDOR = ["0x" + str(i) * 40 for i in range(1, 5)]
OP = "0x" + "ab" * 32


def receipt_client():
    chain = object.__new__(BlockchainClient)
    chain.ep_contract = MagicMock(address=EP)
    chain.bastion_contract = MagicMock(address=WALLET)
    chain.token_contract = MagicMock(address=TOKEN)
    chain.ep_contract.events.UserOperationEvent.return_value.process_log.side_effect = lambda log: {"args": log["decoded"]}
    chain.token_contract.events.Transfer.return_value.process_log.side_effect = lambda log: {"args": log["decoded"]}
    return chain


def receipt(transfer=True):
    logs = []
    if transfer:
        logs.append({"address": TOKEN, "decoded": {"from": WALLET, "to": VENDOR, "value": 20_000_000}})
    logs.append({"address": EP, "decoded": {"userOpHash": bytes.fromhex(OP[2:]), "sender": WALLET, "success": True}})
    return {"status": 1, "to": EP, "logs": logs}


def test_exact_transfer_and_entrypoint_event_required():
    assert receipt_client().verify_payment_receipt(receipt(), OP, VENDOR, 20_000_000)["status"] == "INCLUDED_SUCCESS"


def test_circuit_breaker_success_without_transfer_is_not_payment():
    assert receipt_client().verify_payment_receipt(receipt(False), OP, VENDOR, 20_000_000)["status"] == "INCLUDED_NO_TRANSFER"


@pytest.mark.parametrize("field,value", [("to", TOKEN), ("from", VENDOR), ("value", 19_000_000)])
def test_wrong_transfer_rejected(field, value):
    r = receipt(); r["logs"][0]["decoded"][field] = value
    assert receipt_client().verify_payment_receipt(r, OP, VENDOR, 20_000_000)["status"] != "INCLUDED_SUCCESS"


def test_another_userop_transfer_cannot_prove_payment():
    r = receipt()
    other = {"address": EP, "decoded": {"userOpHash": bytes(32), "sender": WALLET, "success": True}}
    r["logs"].insert(1, other)
    assert receipt_client().verify_payment_receipt(r, OP, VENDOR, 20_000_000)["status"] == "INCLUDED_NO_TRANSFER"


@pytest.mark.parametrize("mutation", ["entrypoint", "sender", "hash", "revert"])
def test_receipt_binding(mutation):
    r = receipt()
    if mutation == "entrypoint": r["to"] = TOKEN
    if mutation == "sender": r["logs"][-1]["decoded"]["sender"] = TOKEN
    if mutation == "hash": r["logs"][-1]["decoded"]["userOpHash"] = bytes(32)
    if mutation == "revert": r["logs"][-1]["decoded"]["success"] = False
    assert receipt_client().verify_payment_receipt(r, OP, VENDOR, 20_000_000)["status"] != "INCLUDED_SUCCESS"


def test_frozen_vector_matches_python_and_recovers_signers():
    v = json.loads((ROOT / "schemas/signing/test_vectors.json").read_text())
    i = PaymentIntent(**v["paymentIntent"])
    assert Web3.to_hex(compute_eip712_digest(i)) == v["cryptographicOutputs"]["eip712SigningDigest"]
    assert compute_calldata_hash(i.recipientAddress, i.amountBaseUnits) == i.calldataHash
    for role in ("juniorSigner", "ownerSigner"):
        signature = v["cryptographicOutputs"][role]
        assert recover_signer(i, signature["signature"]) == signature["address"]
    altered = copy.copy(i); altered.amountBaseUnits += 1
    assert compute_eip712_digest(altered) != compute_eip712_digest(i)


def test_laptop_a_cannot_load_owner_or_revoker_keys(monkeypatch):
    monkeypatch.setenv("OWNER_PRIVATE_KEY", "must-not-be-read")
    monkeypatch.setenv("REVOKER_PRIVATE_KEY", "must-not-be-read")
    chain = BlockchainClient()
    assert not hasattr(chain, "owner_key") and not hasattr(chain, "revoker_key")
    assert chain.revoke_session_on_chain()["status"] == "REVOKE_UNAVAILABLE"
    assert chain.unfreeze_session_on_chain()["status"] == "OWNER_AUTHORIZATION_REQUIRED"


def test_empty_checkpoint_and_tampering(tmp_path):
    rec = FlightRecorder(checkpoint_storage_dir=str(tmp_path))
    cp = rec.create_checkpoint("empty", export_laptop_b=False)
    assert rec.verify_against_checkpoint(cp)[0]
    assert cp["tip_event_hash"] == GENESIS_HASH
    rec.record_event("TEST", "a", "payment", {"amount": 20})
    cp = rec.create_checkpoint("one", export_laptop_b=False)
    rec.events[0].sanitized_payload["amount"] = 500
    assert not rec.verify_against_checkpoint(cp)[0]


def test_local_checkpoint_never_claims_independence(tmp_path, monkeypatch):
    monkeypatch.delenv("SUPERVISOR_URL", raising=False)
    rec = FlightRecorder(checkpoint_storage_dir=str(tmp_path))
    cp = rec.create_checkpoint("offline")
    assert cp["independent_status"] == "UNAVAILABLE"
    with pytest.raises(ValueError): rec.create_checkpoint("../escape")


def test_checkpoint_store_rejects_overwrite_and_traversal(tmp_path):
    from services.supervisor.supervisor_service import SupervisorService
    supervisor = SupervisorService(str(tmp_path))
    cp = {"checkpoint_id": "first", "tip_event_hash": GENESIS_HASH, "event_count": 0}
    supervisor.record_independent_checkpoint(cp)
    with pytest.raises(FileExistsError): supervisor.record_independent_checkpoint(cp)
    cp["checkpoint_id"] = "../escape"
    with pytest.raises(ValueError): supervisor.record_independent_checkpoint(cp)
    assert supervisor.get_supervisor_status()["peripherals"]["esp32_signer"] == "UNVERIFIED"


@pytest.mark.asgi
def test_checkpoint_endpoint_requires_authentication(tmp_path, monkeypatch):
    from services.supervisor import supervisor_service as service
    monkeypatch.setattr(service, "supervisor", service.SupervisorService(str(tmp_path)))
    monkeypatch.setenv("CHECKPOINT_TOKEN", "unit-test-token")
    client = TestClient(service.app, backend=os.getenv("BASTION_TEST_BACKEND", "asyncio"))
    cp = {"checkpoint_id": "first", "tip_event_hash": GENESIS_HASH, "event_count": 0}
    assert client.post("/supervisor/audit/checkpoint", json=cp).status_code == 401
    headers = {"Authorization": "Bearer unit-test-token"}
    assert client.post("/supervisor/audit/checkpoint", json=cp, headers=headers).status_code == 200
    assert client.post("/supervisor/audit/checkpoint", json=cp, headers=headers).status_code == 409
    assert client.get("/supervisor/audit/checkpoint/first", headers=headers).json() == cp


@pytest.fixture
def api_client(monkeypatch):
    from services.api.src.routes import api_v2
    from services.api.src.main import app
    monkeypatch.setattr(api_v2, "flight_rec", FlightRecorder())
    chain = MagicMock()
    monkeypatch.setattr(api_v2, "blockchain_client", chain)
    return TestClient(app, backend=os.getenv("BASTION_TEST_BACKEND", "asyncio")), chain, api_v2


@pytest.mark.asgi
def test_http_panic_never_claims_physical_confirmation(api_client):
    client, chain, _ = api_client
    result = client.post("/api/v2/hardware/panic").json()
    assert result["chain_state"] == "REVOKE_UNAVAILABLE"
    assert result["tx_hash"] is None
    chain.revoke_session_on_chain.assert_not_called()


@pytest.mark.asgi
def test_chain_outage_prevents_payment(api_client):
    client, chain, _ = api_client
    chain.get_on_chain_policy.return_value = {"connected": False}
    response = client.post("/api/v2/payments/request", json={"recipient": VENDOR, "amount": 20_000_000, "order_id": "test"})
    assert response.status_code == 503
    chain.submit_agent_payment_user_op.assert_not_called()


@pytest.mark.parametrize("amount", [0, -1, 1.2, True, 10_000_000_001])
@pytest.mark.asgi
def test_invalid_amount_fails_before_chain(api_client, amount):
    client, chain, _ = api_client
    assert client.post("/api/v2/payments/request", json={"recipient": VENDOR, "amount": amount, "order_id": "test"}).status_code == 422
    chain.submit_agent_payment_user_op.assert_not_called()


@pytest.mark.asgi
def test_exception_outage_cannot_be_confirmed(api_client):
    from services.api.src.hardware.health_manager import ApprovalRequestStatus
    client, chain, module = api_client
    v = json.loads((ROOT / "schemas/signing/test_vectors.json").read_text())
    intent = v["paymentIntent"]
    module.health_mgr.active_approvals["offline"] = {"intent": intent, "status": ApprovalRequestStatus.DEVICE_REVIEW}
    chain.is_connected.return_value = False
    response = client.post("/api/v2/approvals/execute", json={"request_id": "offline", "approval_tier": intent["approvalTier"],
        "device_signature_hex": "0x", "owner_signature_hex": "0x"})
    assert response.status_code == 503
    assert module.health_mgr.active_approvals["offline"]["status"] == ApprovalRequestStatus.DEVICE_REVIEW


@pytest.mark.parametrize("method", ["anvil_setBalance", "anvil_impersonateAccount", "evm_increaseTime", "eth_sendTransaction", "eth_sign", "personal_unlockAccount"])
def test_rpc_gateway_rejects_admin_and_unlocked_signing(method):
    from services.bundler.rpc_gateway import validate
    assert validate({"jsonrpc": "2.0", "id": 1, "method": method, "params": []})["error"]["code"] == -32601


def test_rpc_gateway_allows_signed_broadcast_and_rejects_batch():
    from services.bundler.rpc_gateway import validate
    assert validate({"jsonrpc": "2.0", "id": 1, "method": "eth_sendRawTransaction", "params": ["0x"]}) is None
    assert validate([])["error"]["code"] == -32600


def test_audit_restart_and_persistence_failure(tmp_path, monkeypatch):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from services.api.src import database
    from services.api.src.evidence import flight_recorder as module
    engine = create_engine('sqlite:///' + (tmp_path/'audit.db').as_posix())
    database.Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine)
    monkeypatch.setattr(module, 'SessionLocal', factory)
    rec = FlightRecorder(auto_persist_db=True, checkpoint_storage_dir=str(tmp_path))
    rec.record_event('TEST', 'restart', 'first', {'amount': 20})
    recovered = FlightRecorder(auto_persist_db=True, checkpoint_storage_dir=str(tmp_path))
    recovered.restore()
    assert recovered.last_event_hash == rec.last_event_hash
    recovered.record_event('TEST', 'restart', 'second', {'amount': 30})
    assert recovered.verify_stored_chain()[0]
    def fail(): raise RuntimeError('disk unavailable')
    monkeypatch.setattr(module, 'SessionLocal', fail)
    with pytest.raises(RuntimeError): recovered.record_event('TEST', 'restart', 'third', {})
    assert len(recovered.events) == 2
    engine.dispose()


def test_direct_http_panic_handler_reports_only_application_stop(monkeypatch):
    from services.api.src.routes import api_v2 as module
    monkeypatch.setattr(module, 'flight_rec', FlightRecorder())
    chain = MagicMock(); monkeypatch.setattr(module, 'blockchain_client', chain)
    result = module.trigger_panic()
    assert result['chain_state'] == 'REVOKE_UNAVAILABLE' and result['tx_hash'] is None
    chain.revoke_session_on_chain.assert_not_called()


def test_direct_exception_handler_refuses_missing_chain(monkeypatch):
    from fastapi import HTTPException
    from services.api.src.routes import api_v2 as module
    from services.api.src.hardware.health_manager import HardwareHealthManager, ApprovalRequestStatus
    manager = HardwareHealthManager()
    monkeypatch.setattr(module, 'health_mgr', manager)
    chain = MagicMock(); chain.is_connected.return_value = False
    monkeypatch.setattr(module, 'blockchain_client', chain)
    intent = json.loads((ROOT/'schemas/signing/test_vectors.json').read_text())['paymentIntent']
    manager.active_approvals['offline-direct'] = {'intent': intent, 'status': ApprovalRequestStatus.DEVICE_REVIEW}
    with pytest.raises(HTTPException) as error:
        module.execute_exception_approval(module.ExceptionReviewSubmission(request_id='offline-direct',
            approval_tier=intent['approvalTier'], device_signature_hex='0x', owner_signature_hex='0x'))
    assert error.value.status_code == 503
    assert manager.active_approvals['offline-direct']['status'] == ApprovalRequestStatus.DEVICE_REVIEW
