"""
Bastion X v2.1 — On-Chain Policy Engine Simulator
Faithfully mirrors the on-chain logic of BastionAccount.sol for testing,
bundler validation, and backend advisory prechecks.
"""

from typing import Dict, Set, Tuple, Optional
from web3 import Web3
from services.device_crypto.crypto_engine import (
    PaymentIntent,
    verify_dual_authorization,
    TRANSFER_SELECTOR,
)


class AccountPolicyState:
    def __init__(
        self,
        wallet_address: str,
        owner_address: str,
        agent_session_key: str,
        junior_signer: str,
        senior_signer: str,
        revoker_role: str,
        allowed_target: str,
        allowed_recipient: str,
        max_per_tx: int,
        daily_allowance: int,
        session_expiry: int,
        chain_id: int = 31337,
        strict_owner_mode: bool = True,
    ):
        self.wallet_address = Web3.to_checksum_address(wallet_address)
        self.owner_address = Web3.to_checksum_address(owner_address)
        self.agent_session_key = Web3.to_checksum_address(agent_session_key)
        self.junior_signer = Web3.to_checksum_address(junior_signer)
        self.senior_signer = Web3.to_checksum_address(senior_signer)
        self.revoker_role = Web3.to_checksum_address(revoker_role)

        self.allowed_target = Web3.to_checksum_address(allowed_target)
        self.allowed_selector = TRANSFER_SELECTOR.lower()
        self.allowed_recipient = Web3.to_checksum_address(allowed_recipient)
        self.max_per_tx = max_per_tx
        self.daily_allowance = daily_allowance
        self.session_expiry = session_expiry
        self.chain_id = chain_id
        self.strict_owner_mode = strict_owner_mode

        self.policy_version = 1
        self.account_nonce = 0
        self.daily_spent: Dict[str, Dict[int, int]] = {}  # session_id -> day_index -> spent
        self.revoked_sessions: Set[str] = set()
        self.paused_sessions: Set[str] = set()
        self.used_exception_nonces: Set[int] = set()

    def get_session_id(self, key: str) -> str:
        return Web3.keccak(hexstr=Web3.to_checksum_address(key)).hex()

    def validate_agent_payment(
        self,
        target: str,
        selector: str,
        recipient: str,
        amount: int,
        timestamp: int,
        signer_address: str,
    ) -> Tuple[bool, str]:
        """
        Executes standard autonomous agent payment under delegated session key.
        Strictly enforces all 6 W3-02 policy dimensions.
        """
        signer = Web3.to_checksum_address(signer_address)
        if signer != self.agent_session_key and signer != self.owner_address:
            return False, "Unauthorized signer: must be agentSessionKey or owner"

        s_id = self.get_session_id(signer)
        if s_id in self.revoked_sessions:
            return False, "Policy violation: Session is revoked on-chain"
        if s_id in self.paused_sessions:
            return False, "Policy violation: Session is paused on-chain"
        if timestamp > self.session_expiry:
            return False, f"Policy violation: Session expired at {self.session_expiry} (now: {timestamp})"

        # Dimension 1: Target Contract
        target_cs = Web3.to_checksum_address(target)
        if target_cs != self.allowed_target:
            return False, f"Policy violation: Target contract {target_cs} not in allowlist ({self.allowed_target})"

        # Dimension 2: Function Selector
        if selector.lower() != self.allowed_selector:
            return False, f"Policy violation: Function selector {selector} not allowed ({self.allowed_selector})"

        # Dimension 3: Recipient
        recipient_cs = Web3.to_checksum_address(recipient)
        if recipient_cs != self.allowed_recipient:
            return False, f"Policy violation: Recipient {recipient_cs} not in allowlist ({self.allowed_recipient})"

        # Dimension 4: Max Per-Transaction Limit
        if amount > self.max_per_tx:
            return False, f"Policy violation: Amount {amount} exceeds per-tx limit ({self.max_per_tx})"

        # Dimension 5: UTC Calendar-Day Limit (timestamp // 86400)
        day_index = timestamp // 86400
        if s_id not in self.daily_spent:
            self.daily_spent[s_id] = {}
        spent_today = self.daily_spent[s_id].get(day_index, 0)
        if spent_today + amount > self.daily_allowance:
            return False, f"Policy violation: Daily allowance exceeded (spent: {spent_today}, requested: {amount}, cap: {self.daily_allowance})"

        # Atomic state update
        self.daily_spent[s_id][day_index] = spent_today + amount
        self.account_nonce += 1
        return True, "Agent payment executed successfully within policy"

    def execute_authorized_exception(
        self,
        intent: PaymentIntent,
        device_signature_hex: str,
        owner_signature_hex: Optional[str],
        timestamp: int,
    ) -> Tuple[bool, str]:
        """
        Executes out-of-policy exception requiring hardware signature and owner co-signature.
        """
        # Replay protection: check nonce
        if intent.accountNonce in self.used_exception_nonces:
            return False, f"Exception: Nonce {intent.accountNonce} already used (replay rejected)"

        # Verifying contract & chain binding
        if Web3.to_checksum_address(intent.verifyingAccount) != self.wallet_address:
            return False, "Exception: Verifying account mismatch"
        if intent.chainId != self.chain_id:
            return False, "Exception: Chain ID mismatch"
        if intent.policyVersion != self.policy_version:
            return False, "Exception: Stale policy version"

        # Verify dual authorization (Hardware + Owner)
        valid, reason = verify_dual_authorization(
            intent=intent,
            device_signature_hex=device_signature_hex,
            owner_signature_hex=owner_signature_hex,
            expected_junior_signer=self.junior_signer,
            expected_senior_signer=self.senior_signer,
            expected_owner=self.owner_address,
            current_timestamp=timestamp,
            strict_owner_mode=self.strict_owner_mode,
        )
        if not valid:
            return False, reason

        # Atomically consume nonce
        self.used_exception_nonces.add(intent.accountNonce)
        self.account_nonce += 1
        return True, "Exception authorized and executed successfully"

    def revoke_session(self, session_key: str, caller_address: str, reason: str = "") -> Tuple[bool, str]:
        """
        On-chain revocation callable by owner OR revoker_role (e.g. ESP32 direct panic).
        """
        caller = Web3.to_checksum_address(caller_address)
        if caller != self.owner_address and caller != self.revoker_role:
            return False, "Unauthorized: Only owner or revoker role can revoke sessions"

        s_id = self.get_session_id(session_key)
        self.revoked_sessions.add(s_id)
        return True, f"Session {session_key} revoked on-chain by {caller} (reason: {reason})"
