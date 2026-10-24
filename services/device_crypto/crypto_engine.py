"""
Bastion X v2.1 — Device Crypto Engine
Canonical EIP-712 hashing, signing, and verification matching BastionAccount.sol on-chain semantics.
"""

from dataclasses import dataclass, asdict
from typing import Optional, Tuple, Dict, Any
import time
from eth_account import Account
from eth_account.messages import encode_typed_data
from web3 import Web3
from hexbytes import HexBytes

# Pinned EIP-712 Constants matching BastionAccount.sol
EIP712_DOMAIN_NAME = "BastionX"
EIP712_DOMAIN_VERSION = "2"

PAYMENT_INTENT_TYPE_DEF = [
    {"name": "chainId", "type": "uint256"},
    {"name": "verifyingAccount", "type": "address"},
    {"name": "accountNonce", "type": "uint256"},
    {"name": "requestId", "type": "string"},
    {"name": "policyVersion", "type": "uint256"},
    {"name": "actorSession", "type": "string"},
    {"name": "approvalTier", "type": "string"},
    {"name": "tokenAddress", "type": "address"},
    {"name": "targetContract", "type": "address"},
    {"name": "functionSelector", "type": "bytes4"},
    {"name": "recipientAddress", "type": "address"},
    {"name": "amountBaseUnits", "type": "uint256"},
    {"name": "maxPerTxException", "type": "uint256"},
    {"name": "deadline", "type": "uint256"},
    {"name": "calldataHash", "type": "bytes32"},
]

TRANSFER_SELECTOR = "0xa9059cbb"
JUNIOR_ROLE_CAP = 2000 * 10**6   # 2,000 bUSD
SENIOR_ROLE_CAP = 10000 * 10**6  # 10,000 bUSD


@dataclass
class PaymentIntent:
    chainId: int
    verifyingAccount: str
    accountNonce: int
    requestId: str
    policyVersion: int
    actorSession: str
    approvalTier: str
    tokenAddress: str
    targetContract: str
    functionSelector: str
    recipientAddress: str
    amountBaseUnits: int
    maxPerTxException: int
    deadline: int
    calldataHash: str

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["verifyingAccount"] = Web3.to_checksum_address(self.verifyingAccount)
        d["tokenAddress"] = Web3.to_checksum_address(self.tokenAddress)
        d["targetContract"] = Web3.to_checksum_address(self.targetContract)
        d["recipientAddress"] = Web3.to_checksum_address(self.recipientAddress)
        return d


def compute_calldata_hash(recipient: str, amount: int) -> str:
    """Compute keccak256 of transfer(address,uint256) ABI-encoded calldata."""
    recipient_clean = Web3.to_checksum_address(recipient)[2:].lower().zfill(64)
    amount_clean = hex(amount)[2:].zfill(64)
    selector_clean = TRANSFER_SELECTOR[2:].lower()
    raw_calldata = bytes.fromhex(selector_clean + recipient_clean + amount_clean)
    return "0x" + Web3.keccak(raw_calldata).hex()


def build_eip712_structured_data(intent: PaymentIntent) -> Dict[str, Any]:
    """Constructs the canonical EIP-712 dictionary for eth_account encode_typed_data."""
    return {
        "types": {
            "EIP712Domain": [
                {"name": "name", "type": "string"},
                {"name": "version", "type": "string"},
                {"name": "chainId", "type": "uint256"},
                {"name": "verifyingContract", "type": "address"},
            ],
            "PaymentIntent": PAYMENT_INTENT_TYPE_DEF,
        },
        "domain": {
            "name": EIP712_DOMAIN_NAME,
            "version": EIP712_DOMAIN_VERSION,
            "chainId": intent.chainId,
            "verifyingContract": Web3.to_checksum_address(intent.verifyingAccount),
        },
        "primaryType": "PaymentIntent",
        "message": intent.to_dict(),
    }


def compute_eip712_digest(intent: PaymentIntent) -> bytes:
    """Calculate the 32-byte EIP-712 signing digest: keccak256(b'\\x19\\x01' + DOMAIN_SEPARATOR + structHash)."""
    structured_data = build_eip712_structured_data(intent)
    signable_message = encode_typed_data(full_message=structured_data)
    return Web3.keccak(b"\x19" + signable_message.version + signable_message.header + signable_message.body)


def sign_payment_intent(intent: PaymentIntent, private_key_hex: str) -> str:
    """Signs the canonical PaymentIntent using private key."""
    structured_data = build_eip712_structured_data(intent)
    signable_message = encode_typed_data(full_message=structured_data)
    acct = Account.from_key(private_key_hex)
    signed = acct.sign_message(signable_message)
    return signed.signature.hex()


def recover_signer(intent: PaymentIntent, signature_hex: str) -> str:
    """Recovers the address that signed the PaymentIntent."""
    structured_data = build_eip712_structured_data(intent)
    signable_message = encode_typed_data(full_message=structured_data)
    recovered = Account.recover_message(signable_message, signature=HexBytes(signature_hex))
    return Web3.to_checksum_address(recovered)


def verify_dual_authorization(
    intent: PaymentIntent,
    device_signature_hex: str,
    owner_signature_hex: Optional[str],
    expected_junior_signer: str,
    expected_senior_signer: str,
    expected_owner: str,
    current_timestamp: Optional[int] = None,
    strict_owner_mode: bool = True
) -> Tuple[bool, str]:
    """
    Validates complete dual authorization for out-of-policy payment exception:
    1. Expiry check against timestamp.
    2. Role ceiling check against RFID tier.
    3. Recover and verify ESP32 hardware signature.
    4. In strict mode: Recover and verify independent Owner co-signature.
    5. Calldata hash check against recipient & amount.
    """
    now = current_timestamp if current_timestamp is not None else int(time.time())

    # Expiry
    if now > intent.deadline:
        return False, f"Intent has expired (deadline: {intent.deadline}, now: {now})"

    # Calldata hash
    expected_hash = compute_calldata_hash(intent.recipientAddress, intent.amountBaseUnits)
    if intent.calldataHash.lower() != expected_hash.lower():
        return False, f"Calldata hash mismatch: expected {expected_hash}, got {intent.calldataHash}"

    # Recover Device Signer
    try:
        device_signer = recover_signer(intent, device_signature_hex)
    except Exception as e:
        return False, f"Malformed device signature: {str(e)}"

    tier = intent.approvalTier
    if tier == "JUNIOR_EXCEPTION":
        if device_signer != Web3.to_checksum_address(expected_junior_signer):
            return False, f"Invalid junior signer: recovered {device_signer}, expected {expected_junior_signer}"
        if intent.amountBaseUnits > JUNIOR_ROLE_CAP:
            return False, f"Amount {intent.amountBaseUnits} exceeds Junior ceiling ({JUNIOR_ROLE_CAP})"
    elif tier == "SENIOR_EXCEPTION":
        if device_signer != Web3.to_checksum_address(expected_senior_signer):
            return False, f"Invalid senior signer: recovered {device_signer}, expected {expected_senior_signer}"
        if intent.amountBaseUnits > SENIOR_ROLE_CAP:
            return False, f"Amount {intent.amountBaseUnits} exceeds Senior ceiling ({SENIOR_ROLE_CAP})"
    else:
        return False, f"Unknown approval tier: {tier}"

    # Strict W3-02 Owner Co-Signature
    if strict_owner_mode:
        if not owner_signature_hex:
            return False, "Strict W3-02 compliance requires independent owner co-signature"
        try:
            owner_signer = recover_signer(intent, owner_signature_hex)
        except Exception as e:
            return False, f"Malformed owner signature: {str(e)}"

        if owner_signer != Web3.to_checksum_address(expected_owner):
            return False, f"Invalid owner co-signer: recovered {owner_signer}, expected {expected_owner}"

    return True, "Dual authorization verified"
