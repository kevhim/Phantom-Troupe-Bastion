"""
Test Suite: Contract & Cryptographic Policy Enforcement (P0 Milestone)
Validates all 6 W3-02 wallet policies, EIP-712 domain separation,
hardware device signature verification, and dual owner co-authorization.
"""

import time
import pytest
from eth_account import Account
from web3 import Web3

from services.device_crypto.crypto_engine import (
    PaymentIntent,
    compute_calldata_hash,
    sign_payment_intent,
    recover_signer,
    verify_dual_authorization,
    JUNIOR_ROLE_CAP,
    SENIOR_ROLE_CAP,
)
from services.api.src.policies.policy_engine import AccountPolicyState


@pytest.fixture
def test_setup():
    # Deterministic test keys
    owner_acct = Account.from_key("0x1111111111111111111111111111111111111111111111111111111111111111")
    agent_acct = Account.from_key("0x2222222222222222222222222222222222222222222222222222222222222222")
    junior_acct = Account.from_key("0x3333333333333333333333333333333333333333333333333333333333333333")
    senior_acct = Account.from_key("0x4444444444444444444444444444444444444444444444444444444444444444")
    revoker_acct = Account.from_key("0x5555555555555555555555555555555555555555555555555555555555555555")
    attacker_acct = Account.from_key("0x6666666666666666666666666666666666666666666666666666666666666666")

    token_addr = Web3.to_checksum_address("0x00000000000000000000000000000000000000aa")
    wallet_addr = Web3.to_checksum_address("0x00000000000000000000000000000000000000bb")
    vendor_addr = Web3.to_checksum_address("0x00000000000000000000000000000000000000cc")
    bad_recipient = Web3.to_checksum_address("0x00000000000000000000000000000000000000dd")

    return {
        "owner": owner_acct,
        "agent": agent_acct,
        "junior": junior_acct,
        "senior": senior_acct,
        "revoker": revoker_acct,
        "attacker": attacker_acct,
        "token": token_addr,
        "wallet": wallet_addr,
        "vendor": vendor_addr,
        "bad_recipient": bad_recipient,
        "chainId": 31337,
    }


def test_valid_dual_authorized_junior_exception(test_setup):
    """Test successful dual authorization for out-of-policy payment with Junior RFID tier."""
    s = test_setup
    amount = 500 * 10**6  # 500 bUSD
    calldata_hash = compute_calldata_hash(s["vendor"], amount)
    deadline = int(time.time()) + 300

    intent = PaymentIntent(
        chainId=s["chainId"],
        verifyingAccount=s["wallet"],
        accountNonce=1,
        requestId="req-test-001",
        policyVersion=1,
        actorSession="agent-session-01",
        approvalTier="JUNIOR_EXCEPTION",
        tokenAddress=s["token"],
        targetContract=s["token"],
        functionSelector="0xa9059cbb",
        recipientAddress=s["vendor"],
        amountBaseUnits=amount,
        maxPerTxException=JUNIOR_ROLE_CAP,
        deadline=deadline,
        calldataHash=calldata_hash,
    )

    device_sig = sign_payment_intent(intent, s["junior"].key.hex())
    owner_sig = sign_payment_intent(intent, s["owner"].key.hex())

    valid, reason = verify_dual_authorization(
        intent=intent,
        device_signature_hex=device_sig,
        owner_signature_hex=owner_sig,
        expected_junior_signer=s["junior"].address,
        expected_senior_signer=s["senior"].address,
        expected_owner=s["owner"].address,
        current_timestamp=int(time.time()),
        strict_owner_mode=True,
    )
    assert valid is True
    assert reason == "Dual authorization verified"


def test_forged_device_approval_fails(test_setup):
    """Test that a forged device signature by attacker is rejected."""
    s = test_setup
    amount = 500 * 10**6
    calldata_hash = compute_calldata_hash(s["vendor"], amount)
    deadline = int(time.time()) + 300

    intent = PaymentIntent(
        chainId=s["chainId"],
        verifyingAccount=s["wallet"],
        accountNonce=1,
        requestId="req-forgery",
        policyVersion=1,
        actorSession="agent-session-01",
        approvalTier="JUNIOR_EXCEPTION",
        tokenAddress=s["token"],
        targetContract=s["token"],
        functionSelector="0xa9059cbb",
        recipientAddress=s["vendor"],
        amountBaseUnits=amount,
        maxPerTxException=JUNIOR_ROLE_CAP,
        deadline=deadline,
        calldataHash=calldata_hash,
    )

    # Attacker signs pretending to be the ESP32
    attacker_device_sig = sign_payment_intent(intent, s["attacker"].key.hex())
    owner_sig = sign_payment_intent(intent, s["owner"].key.hex())

    valid, reason = verify_dual_authorization(
        intent=intent,
        device_signature_hex=attacker_device_sig,
        owner_signature_hex=owner_sig,
        expected_junior_signer=s["junior"].address,
        expected_senior_signer=s["senior"].address,
        expected_owner=s["owner"].address,
    )
    assert valid is False
    assert "Invalid junior signer" in reason


def test_missing_owner_cosignature_fails_in_strict_mode(test_setup):
    """Test that browser approval or device approval without owner co-signature fails strict W3-02 check."""
    s = test_setup
    amount = 500 * 10**6
    calldata_hash = compute_calldata_hash(s["vendor"], amount)
    deadline = int(time.time()) + 300

    intent = PaymentIntent(
        chainId=s["chainId"],
        verifyingAccount=s["wallet"],
        accountNonce=1,
        requestId="req-no-owner",
        policyVersion=1,
        actorSession="agent-session-01",
        approvalTier="JUNIOR_EXCEPTION",
        tokenAddress=s["token"],
        targetContract=s["token"],
        functionSelector="0xa9059cbb",
        recipientAddress=s["vendor"],
        amountBaseUnits=amount,
        maxPerTxException=JUNIOR_ROLE_CAP,
        deadline=deadline,
        calldataHash=calldata_hash,
    )

    device_sig = sign_payment_intent(intent, s["junior"].key.hex())

    # No owner co-signature provided
    valid, reason = verify_dual_authorization(
        intent=intent,
        device_signature_hex=device_sig,
        owner_signature_hex=None,
        expected_junior_signer=s["junior"].address,
        expected_senior_signer=s["senior"].address,
        expected_owner=s["owner"].address,
        strict_owner_mode=True,
    )
    assert valid is False
    assert "owner co-signature" in reason


def test_junior_tier_exceeding_cap_fails(test_setup):
    """Test that a Junior card cannot authorize amounts exceeding JUNIOR_ROLE_CAP (2,000 bUSD)."""
    s = test_setup
    amount = 2500 * 10**6  # Exceeds 2,000 cap
    calldata_hash = compute_calldata_hash(s["vendor"], amount)
    deadline = int(time.time()) + 300

    intent = PaymentIntent(
        chainId=s["chainId"],
        verifyingAccount=s["wallet"],
        accountNonce=1,
        requestId="req-junior-overcap",
        policyVersion=1,
        actorSession="agent-session-01",
        approvalTier="JUNIOR_EXCEPTION",
        tokenAddress=s["token"],
        targetContract=s["token"],
        functionSelector="0xa9059cbb",
        recipientAddress=s["vendor"],
        amountBaseUnits=amount,
        maxPerTxException=amount,
        deadline=deadline,
        calldataHash=calldata_hash,
    )

    device_sig = sign_payment_intent(intent, s["junior"].key.hex())
    owner_sig = sign_payment_intent(intent, s["owner"].key.hex())

    valid, reason = verify_dual_authorization(
        intent=intent,
        device_signature_hex=device_sig,
        owner_signature_hex=owner_sig,
        expected_junior_signer=s["junior"].address,
        expected_senior_signer=s["senior"].address,
        expected_owner=s["owner"].address,
    )
    assert valid is False
    assert "exceeds Junior ceiling" in reason


def test_tampered_recipient_fails_signature_and_calldata_hash(test_setup):
    """Test that mutating the recipient address after physical review breaks both calldataHash and signature."""
    s = test_setup
    amount = 100 * 10**6
    calldata_hash = compute_calldata_hash(s["vendor"], amount)
    deadline = int(time.time()) + 300

    intent = PaymentIntent(
        chainId=s["chainId"],
        verifyingAccount=s["wallet"],
        accountNonce=1,
        requestId="req-tamper-recipient",
        policyVersion=1,
        actorSession="agent-session-01",
        approvalTier="JUNIOR_EXCEPTION",
        tokenAddress=s["token"],
        targetContract=s["token"],
        functionSelector="0xa9059cbb",
        recipientAddress=s["vendor"],
        amountBaseUnits=amount,
        maxPerTxException=JUNIOR_ROLE_CAP,
        deadline=deadline,
        calldataHash=calldata_hash,
    )

    device_sig = sign_payment_intent(intent, s["junior"].key.hex())
    owner_sig = sign_payment_intent(intent, s["owner"].key.hex())

    # Attacker modifies recipient in intent before submitting
    intent.recipientAddress = s["bad_recipient"]

    valid, reason = verify_dual_authorization(
        intent=intent,
        device_signature_hex=device_sig,
        owner_signature_hex=owner_sig,
        expected_junior_signer=s["junior"].address,
        expected_senior_signer=s["senior"].address,
        expected_owner=s["owner"].address,
    )
    assert valid is False
    assert ("Calldata hash mismatch" in reason) or ("Invalid" in reason)


def test_tampered_amount_after_signing_fails(test_setup):
    """Test that mutating the amount after physical review breaks the signature."""
    s = test_setup
    amount = 50 * 10**6
    calldata_hash = compute_calldata_hash(s["vendor"], amount)
    deadline = int(time.time()) + 300

    intent = PaymentIntent(
        chainId=s["chainId"],
        verifyingAccount=s["wallet"],
        accountNonce=1,
        requestId="req-tamper-amount",
        policyVersion=1,
        actorSession="agent-session-01",
        approvalTier="JUNIOR_EXCEPTION",
        tokenAddress=s["token"],
        targetContract=s["token"],
        functionSelector="0xa9059cbb",
        recipientAddress=s["vendor"],
        amountBaseUnits=amount,
        maxPerTxException=JUNIOR_ROLE_CAP,
        deadline=deadline,
        calldataHash=calldata_hash,
    )

    device_sig = sign_payment_intent(intent, s["junior"].key.hex())
    owner_sig = sign_payment_intent(intent, s["owner"].key.hex())

    # Inflate amount to 500
    intent.amountBaseUnits = 500 * 10**6
    # Even if calldataHash is recalculated to match new amount, the original signature will be invalid!
    intent.calldataHash = compute_calldata_hash(s["vendor"], intent.amountBaseUnits)

    valid, reason = verify_dual_authorization(
        intent=intent,
        device_signature_hex=device_sig,
        owner_signature_hex=owner_sig,
        expected_junior_signer=s["junior"].address,
        expected_senior_signer=s["senior"].address,
        expected_owner=s["owner"].address,
    )
    assert valid is False
    assert "Invalid junior signer" in reason


def test_expired_authorization_fails(test_setup):
    """Test that an intent submitted after its deadline fails verification."""
    s = test_setup
    amount = 100 * 10**6
    calldata_hash = compute_calldata_hash(s["vendor"], amount)
    deadline = 1000000000  # Way in the past

    intent = PaymentIntent(
        chainId=s["chainId"],
        verifyingAccount=s["wallet"],
        accountNonce=1,
        requestId="req-expired",
        policyVersion=1,
        actorSession="agent-session-01",
        approvalTier="JUNIOR_EXCEPTION",
        tokenAddress=s["token"],
        targetContract=s["token"],
        functionSelector="0xa9059cbb",
        recipientAddress=s["vendor"],
        amountBaseUnits=amount,
        maxPerTxException=JUNIOR_ROLE_CAP,
        deadline=deadline,
        calldataHash=calldata_hash,
    )

    device_sig = sign_payment_intent(intent, s["junior"].key.hex())
    owner_sig = sign_payment_intent(intent, s["owner"].key.hex())

    valid, reason = verify_dual_authorization(
        intent=intent,
        device_signature_hex=device_sig,
        owner_signature_hex=owner_sig,
        expected_junior_signer=s["junior"].address,
        expected_senior_signer=s["senior"].address,
        expected_owner=s["owner"].address,
        current_timestamp=int(time.time()),
    )
    assert valid is False
    assert "expired" in reason.lower()


def test_wrong_chain_id_fails(test_setup):
    """Test that a signed authorization for chain 1 cannot be replayed on local chain 31337."""
    s = test_setup
    amount = 100 * 10**6
    calldata_hash = compute_calldata_hash(s["vendor"], amount)
    deadline = int(time.time()) + 300

    # Signed for Ethereum Mainnet (chainId 1)
    intent_mainnet = PaymentIntent(
        chainId=1,
        verifyingAccount=s["wallet"],
        accountNonce=1,
        requestId="req-chain-replay",
        policyVersion=1,
        actorSession="agent-session-01",
        approvalTier="JUNIOR_EXCEPTION",
        tokenAddress=s["token"],
        targetContract=s["token"],
        functionSelector="0xa9059cbb",
        recipientAddress=s["vendor"],
        amountBaseUnits=amount,
        maxPerTxException=JUNIOR_ROLE_CAP,
        deadline=deadline,
        calldataHash=calldata_hash,
    )

    device_sig = sign_payment_intent(intent_mainnet, s["junior"].key.hex())
    owner_sig = sign_payment_intent(intent_mainnet, s["owner"].key.hex())

    # When evaluated on local test chain 31337, the domain separator differs
    intent_local = PaymentIntent(
        chainId=s["chainId"],  # 31337
        verifyingAccount=s["wallet"],
        accountNonce=1,
        requestId="req-chain-replay",
        policyVersion=1,
        actorSession="agent-session-01",
        approvalTier="JUNIOR_EXCEPTION",
        tokenAddress=s["token"],
        targetContract=s["token"],
        functionSelector="0xa9059cbb",
        recipientAddress=s["vendor"],
        amountBaseUnits=amount,
        maxPerTxException=JUNIOR_ROLE_CAP,
        deadline=deadline,
        calldataHash=calldata_hash,
    )

    valid, reason = verify_dual_authorization(
        intent=intent_local,
        device_signature_hex=device_sig,
        owner_signature_hex=owner_sig,
        expected_junior_signer=s["junior"].address,
        expected_senior_signer=s["senior"].address,
        expected_owner=s["owner"].address,
    )
    assert valid is False
    assert "Invalid junior signer" in reason


def test_six_w302_policy_dimensions_onchain_enforcement(test_setup):
    """
    Test all 6 W3-02 wallet policy dimensions in AccountPolicyState:
    1. Target contract whitelist
    2. Function selector whitelist
    3. Recipient address whitelist
    4. Per-transaction limit
    5. Daily UTC calendar limit (atomic cumulative accounting)
    6. Session expiry
    """
    s = test_setup
    now = int(time.time())

    policy = AccountPolicyState(
        wallet_address=s["wallet"],
        owner_address=s["owner"].address,
        agent_session_key=s["agent"].address,
        junior_signer=s["junior"].address,
        senior_signer=s["senior"].address,
        revoker_role=s["revoker"].address,
        allowed_target=s["token"],
        allowed_recipient=s["vendor"],
        max_per_tx=50 * 10**6,        # 50 bUSD max per tx
        daily_allowance=100 * 10**6,   # 100 bUSD daily limit
        session_expiry=now + 2 * 86400, # Valid for 2 days
    )

    # 1. Valid payment within all policies (20 bUSD)
    ok, msg = policy.validate_agent_payment(
        target=s["token"],
        selector="0xa9059cbb",
        recipient=s["vendor"],
        amount=20 * 10**6,
        timestamp=now,
        signer_address=s["agent"].address,
    )
    assert ok is True

    # 2. Policy Violation: Amount exceeds maxPerTxLimit (70 bUSD > 50 bUSD)
    ok, msg = policy.validate_agent_payment(
        target=s["token"],
        selector="0xa9059cbb",
        recipient=s["vendor"],
        amount=70 * 10**6,
        timestamp=now,
        signer_address=s["agent"].address,
    )
    assert ok is False
    assert "exceeds per-tx limit" in msg

    # 3. Policy Violation: Cumulative daily spend exceeds daily_allowance
    # Already spent 20. Spending 40 + 40 is 100 (allowed). Next 10 bUSD exceeds 100.
    ok, msg = policy.validate_agent_payment(
        target=s["token"],
        selector="0xa9059cbb",
        recipient=s["vendor"],
        amount=40 * 10**6,
        timestamp=now,
        signer_address=s["agent"].address,
    )
    assert ok is True

    ok, msg = policy.validate_agent_payment(
        target=s["token"],
        selector="0xa9059cbb",
        recipient=s["vendor"],
        amount=40 * 10**6,
        timestamp=now,
        signer_address=s["agent"].address,
    )
    assert ok is True  # total spent = 100

    # Next payment should be rejected because daily limit reached
    ok, msg = policy.validate_agent_payment(
        target=s["token"],
        selector="0xa9059cbb",
        recipient=s["vendor"],
        amount=5 * 10**6,
        timestamp=now,
        signer_address=s["agent"].address,
    )
    assert ok is False
    assert "Daily allowance exceeded" in msg

    # Next day (now + 86400) spend limit resets
    ok, msg = policy.validate_agent_payment(
        target=s["token"],
        selector="0xa9059cbb",
        recipient=s["vendor"],
        amount=30 * 10**6,
        timestamp=now + 86400,
        signer_address=s["agent"].address,
    )
    assert ok is True

    # 4. Policy Violation: Target contract not allowed
    ok, msg = policy.validate_agent_payment(
        target=s["vendor"],  # Vendor is not token contract
        selector="0xa9059cbb",
        recipient=s["vendor"],
        amount=10 * 10**6,
        timestamp=now,
        signer_address=s["agent"].address,
    )
    assert ok is False
    assert "Target contract" in msg

    # 5. Policy Violation: Function selector not allowed (e.g. approve instead of transfer)
    ok, msg = policy.validate_agent_payment(
        target=s["token"],
        selector="0x095ea7b3",  # approve(address,uint256)
        recipient=s["vendor"],
        amount=10 * 10**6,
        timestamp=now,
        signer_address=s["agent"].address,
    )
    assert ok is False
    assert "Function selector" in msg

    # 6. Policy Violation: Recipient not allowed
    ok, msg = policy.validate_agent_payment(
        target=s["token"],
        selector="0xa9059cbb",
        recipient=s["bad_recipient"],
        amount=10 * 10**6,
        timestamp=now,
        signer_address=s["agent"].address,
    )
    assert ok is False
    assert "Recipient" in msg

    # 7. Policy Violation: Session expiry (timestamp after session_expiry)
    ok, msg = policy.validate_agent_payment(
        target=s["token"],
        selector="0xa9059cbb",
        recipient=s["vendor"],
        amount=10 * 10**6,
        timestamp=now + 3 * 86400,  # 3 days later, beyond 2-day session_expiry!
        signer_address=s["agent"].address,
    )
    assert ok is False
    assert "Session expired" in msg


def test_exception_nonce_replay_rejected(test_setup):
    """Test that a signed exception authorization cannot be executed more than once (replay protection)."""
    s = test_setup
    now = int(time.time())

    policy = AccountPolicyState(
        wallet_address=s["wallet"],
        owner_address=s["owner"].address,
        agent_session_key=s["agent"].address,
        junior_signer=s["junior"].address,
        senior_signer=s["senior"].address,
        revoker_role=s["revoker"].address,
        allowed_target=s["token"],
        allowed_recipient=s["vendor"],
        max_per_tx=50 * 10**6,
        daily_allowance=100 * 10**6,
        session_expiry=now + 3600,
    )

    amount = 500 * 10**6
    calldata_hash = compute_calldata_hash(s["vendor"], amount)
    deadline = now + 300

    intent = PaymentIntent(
        chainId=s["chainId"],
        verifyingAccount=s["wallet"],
        accountNonce=42,  # Nonce 42
        requestId="req-replay-test",
        policyVersion=1,
        actorSession="agent-session-01",
        approvalTier="JUNIOR_EXCEPTION",
        tokenAddress=s["token"],
        targetContract=s["token"],
        functionSelector="0xa9059cbb",
        recipientAddress=s["vendor"],
        amountBaseUnits=amount,
        maxPerTxException=JUNIOR_ROLE_CAP,
        deadline=deadline,
        calldataHash=calldata_hash,
    )

    device_sig = sign_payment_intent(intent, s["junior"].key.hex())
    owner_sig = sign_payment_intent(intent, s["owner"].key.hex())

    # First execution succeeds
    ok, msg = policy.execute_authorized_exception(intent, device_sig, owner_sig, now)
    assert ok is True

    # Replay execution with SAME nonce fails!
    ok, msg = policy.execute_authorized_exception(intent, device_sig, owner_sig, now)
    assert ok is False
    assert "already used (replay rejected)" in msg


def test_emergency_revocation_blocks_subsequent_payments(test_setup):
    """Test that after revokerRole triggers on-chain revocation, all future agent payments are rejected."""
    s = test_setup
    now = int(time.time())

    policy = AccountPolicyState(
        wallet_address=s["wallet"],
        owner_address=s["owner"].address,
        agent_session_key=s["agent"].address,
        junior_signer=s["junior"].address,
        senior_signer=s["senior"].address,
        revoker_role=s["revoker"].address,
        allowed_target=s["token"],
        allowed_recipient=s["vendor"],
        max_per_tx=50 * 10**6,
        daily_allowance=100 * 10**6,
        session_expiry=now + 3600,
    )

    # 1. Normal payment works
    ok, _ = policy.validate_agent_payment(
        target=s["token"],
        selector="0xa9059cbb",
        recipient=s["vendor"],
        amount=10 * 10**6,
        timestamp=now,
        signer_address=s["agent"].address,
    )
    assert ok is True

    # 2. Attacker attempts to call revoke_session (unauthorized)
    ok, msg = policy.revoke_session(s["agent"].address, s["attacker"].address, "fake panic")
    assert ok is False
    assert "Unauthorized" in msg

    # 3. Legitimate revokerRole (ESP32 direct panic key) revokes session
    ok, msg = policy.revoke_session(s["agent"].address, s["revoker"].address, "ESP32_GPIO32_PANIC")
    assert ok is True
    assert "revoked on-chain" in msg

    # 4. Now, any attempt to use the agentSessionKey fails on-chain!
    ok, msg = policy.validate_agent_payment(
        target=s["token"],
        selector="0xa9059cbb",
        recipient=s["vendor"],
        amount=10 * 10**6,
        timestamp=now,
        signer_address=s["agent"].address,
    )
    assert ok is False
    assert "Session is revoked on-chain" in msg

