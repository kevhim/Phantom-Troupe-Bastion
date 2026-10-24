# Bastion X v2.3 — Data Storage, Database Schema & API Reference (Phases 3 + 7)

## 1. Architectural Boundaries & Data Ownership

| Domain | Authority / Storage Location | Contents & Authority |
|---|---|---|
| **On-Chain (Canonical Financial Authority)** | Intel Laptop B (Anvil :8545) | `BastionAccount.sol`, `RiskCircuitBreaker.sol`, `GuardianRecovery.sol`, `QuotaPaymaster.sol`. Enforces W3-02 spending caps, allowed recipients/contracts/selectors, dual-authorized exception validation, session expiry, nonce tracking, and autonomic latching. |
| **Local Projection & State Database** | RTX 5060 Laptop A (`services/api/bastion_projection.db`) | SQLite database tracking payment intents, UserOperations, transaction receipts, hardware events, incident records, approval requests, and chained audit logs. **Never stores private wallet keys, seed phrases, or raw biometric data.** |
| **Security Flight Recorder** | Laptop A SQLite + Checkpoints (`C:\bastion_audit_checkpoints` / `artifacts/checkpoints`) | Cryptographically chained SHA-256 event log with sequence numbers, previous hashes, and independent exported checkpoint files for cross-laptop verification. |
| **Physical Signer (Hardware Authority)** | Single ESP32 on Laptop B | Dual OLED display, RC522 RFID reader, physical approve/panic buttons. Houses dedicated hardware key; displays parsed PaymentIntent on trusted OLED #1; never stores transaction history database. |

---

## 2. Transaction Lifecycle & State Machine

All payments strictly follow the ERC-4337 state machine:

```
[Agent Intent] 
       │
       ▼
    DRAFT ─────────(Out-of-Policy)────────► PENDING_HARDWARE_APPROVAL
       │                                              │
(In-Policy)                                   (Physical Cosign)
       │                                              │
       ▼                                              ▼
    SIGNED ◄──────────────────────────────────────────┘
       │
       ▼
   SUBMITTED (to Bundler eth_sendUserOperation)
       │
       ├──► BUNDLER_REJECTED (e.g. invalid signature, AA21/AA24)
       │
       ├──► INCLUDED_SUCCESS (Receipt confirmed, execution_success = true)
       │
       ├──► INCLUDED_REVERTED (Receipt confirmed, execution_success = false / on-chain revert)
       │
       └──► UNKNOWN (Timeout or RPC failure awaiting receipt)
```

**Rule:** A payment is **NEVER** marked successful from an API submission or Bundler acknowledgment alone. It requires an on-chain receipt from `eth_getUserOperationReceipt` with confirmed execution status.

---

## 3. Database Schema (`services/api/src/database.py`)

### 3.1 `payment_intents`
Tracks payment requests created by the agent or queued for review.
- `id` (Integer, PK): Autoincrement internal ID.
- `order_id` (String, Unique Index): Unique merchant/system order identifier (`ORD-...`).
- `session_id` (String): Agent session ID authorizing the intent.
- `recipient` (String): Destination address for transfer.
- `amount` (Float): Amount in human-readable units (e.g., 20.0 bUSD).
- `amount_raw` (String): Raw unit integer representation (e.g., `20000000` for 6 decimals).
- `token_address` (String): ERC-20 token address (`MockToken`).
- `target_contract` (String): Target contract executed by smart account.
- `function_selector` (String): Calldata selector (e.g. `0xa9059cbb`).
- `status` (String): `DRAFT`, `PENDING_HARDWARE_APPROVAL`, `SIGNED`, `SUBMITTED`, `INCLUDED_SUCCESS`, `INCLUDED_REVERTED`, `BUNDLER_REJECTED`, `REVOKED`.
- `requires_approval` (Boolean): True if amount exceeds cap or recipient is unapproved.
- `rejection_reason` (String, Nullable): Reason for failure if reverted or rejected.
- `created_at` (DateTime): UTC timestamp.
- `updated_at` (DateTime): UTC timestamp.

### 3.2 `user_operations`
Tracks real ERC-4337 UserOperations submitted to the bundler and mined on-chain.
- `id` (Integer, PK): Autoincrement internal ID.
- `user_op_hash` (String, Unique Index): 32-byte hex hash calculated by EntryPoint.
- `order_id` (String, Index): Foreign link to `payment_intents.order_id`.
- `sender` (String): Smart account address.
- `nonce` (Integer): Smart account execution nonce.
- `call_data` (Text): Full hex calldata passed to smart account.
- `bundler_status` (String): `SUBMITTED`, `INCLUDED_SUCCESS`, `INCLUDED_REVERTED`, `BUNDLER_REJECTED`, `UNKNOWN`.
- `tx_hash` (String, Index, Nullable): Mined on-chain Ethereum transaction hash.
- `block_number` (Integer, Nullable): Block where transaction was included.
- `execution_success` (Boolean): True only if receipt indicates success without internal revert.
- `revert_reason` (Text, Nullable): Revert string or bundler error.
- `gas_used` (Integer, Nullable): Actual gas used.
- `created_at` (DateTime): UTC timestamp.

### 3.3 `agent_sessions`
Tracks active, revoked, or frozen agent keys and daily spending allowances.
- `id` (Integer, PK): Autoincrement internal ID.
- `session_id` (String, Unique Index): 32-byte hex identifier.
- `agent_address` (String): Public address of the session key.
- `daily_cap` (Float): Daily spending cap in bUSD (default: 100.0).
- `max_per_tx` (Float): Maximum single-transaction cap (default: 50.0).
- `daily_spent` (Float): Current accumulated daily spend in projection.
- `is_revoked` (Boolean): True if session revoked on-chain or via panic button.
- `revoked_at` (DateTime, Nullable): Timestamp of revocation.
- `revocation_tx` (String, Nullable): On-chain tx hash of `revokeSession()`.
- `is_frozen` (Boolean): True if frozen by `RiskCircuitBreaker`.
- `expires_at` (DateTime): UTC expiration timestamp.
- `created_at` (DateTime): UTC creation timestamp.

### 3.4 `hardware_events`
Stores hardware inputs from Laptop B with replay protection via digest hashing.
- `id` (Integer, PK): Autoincrement internal ID.
- `event_id` (String, Unique Index): Unique UUID.
- `node_id` (String): Source identifier (e.g. `laptop-b-esp32`, `laptop-b-uno1`).
- `event_type` (String): `PANIC_TRIGGERED`, `APPROVAL_GRANTED`, `APPROVAL_REJECTED`, `CARD_SCANNED`, `HEARTBEAT`.
- `source_counter` (Integer): Hardware monotonically increasing message counter.
- `digest` (String, Unique Index): `SHA256(node_id:source_counter:event_type:timestamp)`.
- `payload_json` (Text): Redacted event payload.
- `observed_at` (DateTime): Ingestion timestamp.

### 3.5 `approval_requests`
Tracks out-of-policy exceptions requiring hardware cosigning.
- `id` (Integer, PK): Autoincrement internal ID.
- `request_id` (String, Unique Index): UUID.
- `order_id` (String, Index): Linked payment intent.
- `tier` (Integer): Approval tier (1 = Junior Staff, 2 = Senior Admin).
- `display_digest` (String): SHA-256 hash displayed on OLED #1.
- `hardware_signature` (Text, Nullable): Cryptographic signature from ESP32.
- `owner_cosignature` (Text, Nullable): Optional owner cosignature for high-tier exceptions.
- `status` (String): `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, `EXECUTED`.
- `created_at` (DateTime): Creation timestamp.
- `resolved_at` (DateTime, Nullable): Resolution timestamp.

### 3.6 `incidents`
Records security anomalies, panic events, and circuit breaker freezes.
- `id` (Integer, PK): Autoincrement internal ID.
- `incident_id` (String, Unique Index): Incident code (e.g. `INC-PANIC-1719230400`).
- `trigger` (String): `PHYSICAL_PANIC_BUTTON`, `CIRCUIT_BREAKER_VELOCITY`, `POLICY_VIOLATION`.
- `state` (String): `OPEN`, `RESOLVED`, `CONTAINED`.
- `revocation_tx` (String, Nullable): Ethereum tx hash confirming on-chain session revocation.
- `confirmed_block` (Integer, Nullable): Block confirming revocation.
- `details_json` (Text): Incident metadata and diagnostics.
- `opened_at` (DateTime): Inception timestamp.
- `closed_at` (DateTime, Nullable): Remediation timestamp.

### 3.7 `audit_entries`
Persistent append-only SHA-256 chained audit entries.
- `id` (Integer, PK): Autoincrement internal ID.
- `sequence` (Integer, Unique Index): Monotonically increasing sequence number (0, 1, 2, ...).
- `event_id` (String, Unique Index): UUID of the event.
- `event_source` (String): Originating subsystem (`blockchain`, `agent`, `hardware`, `supervisor`).
- `correlation_id` (String): Order ID or session ID grouping related operations.
- `event_type` (String): Event class.
- `sanitized_payload_json` (Text): Data with private keys and sensitive fields redacted.
- `prev_hash` (String): 64-hex char SHA-256 hash of previous entry (or 64 zeros for genesis).
- `entry_hash` (String, Unique Index): `SHA256(sequence + event_id + prev_hash + payload + timestamp)`.
- `timestamp` (Float): Unix timestamp of occurrence.
- `created_utc` (DateTime): Database insertion time.

### 3.8 `integrity_checkpoints`
Periodic snapshots of the hash chain exported to an independent file/drive for Laptop B.
- `id` (Integer, PK): Autoincrement internal ID.
- `checkpoint_id` (String, Unique Index): Checkpoint code (`CHK-...`).
- `sequence_tip` (Integer): Latest sequence number covered.
- `tip_event_hash` (String): Hash of the latest audit entry.
- `event_count` (Integer): Total entries validated.
- `node_id` (String): Node generating the checkpoint (`laptop-a-rtx5060`).
- `export_path` (String, Nullable): Path where JSON checkpoint was written.
- `verified` (Boolean): True if re-verification succeeded.
- `created_utc` (DateTime): Snapshot timestamp.

---

## 4. REST API Endpoint Reference for Frontend Agent

Base URL: `http://localhost:8000` (or `http://127.0.0.1:8000`)

### 4.1 System & Overview

#### `GET /health` and `GET /api/v2/health`
Checks API, database, Anvil RPC, Bundler, and hardware connectivity.
```json
// Response 200 OK
{
  "status": "ONLINE",
  "service": "Bastion X v2.3 API",
  "node": "Laptop A (RTX 5060)",
  "database": "CONNECTED",
  "blockchain_rpc": "CONNECTED",
  "bundler": "CONNECTED"
}
```

#### `GET /api/v2/overview`
Provides real-time consolidated dashboard state directly querying smart contracts on Anvil.
```json
// Response 200 OK
{
  "wallet_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "token_balance": 1000.0,
  "daily_spent": 20.0,
  "daily_limit": 100.0,
  "per_tx_limit": 50.0,
  "remaining_daily_budget": 80.0,
  "circuit_breaker_status": "NORMAL",
  "is_revoked": false,
  "is_frozen": false,
  "agent_session": {
    "session_id": "0x0000...0001",
    "is_valid": true,
    "is_revoked": false,
    "is_frozen": false,
    "daily_spent": 20.0,
    "remaining_budget": 80.0
  },
  "hardware": {
    "esp32_connected": true,
    "rfid_connected": true,
    "watchdog_uno2_connected": true
  },
  "recent_payments": [ ... ],
  "recent_incidents": [ ... ]
}
```

---

### 4.2 Payments & UserOperations

#### `POST /api/v2/payments/request`
Initiates an agent payment. In-policy requests submit a real UserOperation via Bundler. Out-of-policy requests are queued for hardware approval.
```json
// Request
{
  "recipient": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  "amount": 20.0,
  "order_id": "ORD-1719230000"
}

// Response 200 OK (In-Policy Success)
{
  "order_id": "ORD-1719230000",
  "status": "INCLUDED_SUCCESS",
  "tx_hash": "0xabc123...456",
  "user_op_hash": "0xdef456...789",
  "block_number": 42,
  "amount": 20.0,
  "recipient": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  "error": null
}

// Response 200 OK (Out-of-Policy: Queued for Hardware Cosign)
{
  "order_id": "ORD-1719230001",
  "status": "PENDING_HARDWARE_APPROVAL",
  "requires_approval": true,
  "reason": "Transaction amount 60.0 bUSD exceeds single tx cap 50.0 bUSD",
  "approval_request_id": "REQ-d3b07384"
}
```

#### `GET /api/v2/payments/history`
Returns list of indexed payment intents and execution receipts.
```json
// Query: ?limit=20
// Response 200 OK
[
  {
    "order_id": "ORD-1719230000",
    "recipient": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    "amount": 20.0,
    "status": "INCLUDED_SUCCESS",
    "requires_approval": false,
    "created_at": "2026-10-25T01:30:00Z",
    "user_operation": {
      "user_op_hash": "0xdef...",
      "bundler_status": "INCLUDED_SUCCESS",
      "tx_hash": "0xabc...",
      "block_number": 42,
      "execution_success": true
    }
  }
]
```

#### `GET /api/v2/payments/{order_id}`
Returns details for a specific payment intent and its associated UserOperation.

---

### 4.3 Hardware & Approvals

#### `POST /api/v2/approvals/request`
Explicitly requests hardware review for an order.
```json
// Request
{
  "order_id": "ORD-1719230001",
  "tier": 1
}

// Response 200 OK
{
  "status": "QUEUED_FOR_REVIEW",
  "request_id": "REQ-4a5f6e",
  "order_id": "ORD-1719230001",
  "display_digest": "0x78a1bc...",
  "instructions": "Tap authorized RFID tag and press physical green APPROVE button on ESP32."
}
```

#### `POST /api/v2/approvals/execute`
Submits hardware-approved exception on-chain via dual-authorization path.
```json
// Request
{
  "order_id": "ORD-1719230001",
  "hardware_signature": "0x...",
  "owner_cosignature": "0x..."
}

// Response 200 OK
{
  "order_id": "ORD-1719230001",
  "status": "EXECUTED_ON_CHAIN",
  "tx_hash": "0x...",
  "block_number": 43
}
```

#### `POST /api/v2/hardware/event`
Ingests hardware events from Laptop B supervisor. Uses SHA-256 digest validation to prevent replay attacks.
```json
// Request
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "node_id": "laptop-b-esp32",
  "event_type": "BUTTON_PRESSED",
  "source_counter": 12,
  "payload": { "button": "APPROVE" },
  "timestamp": 1719230500.0
}

// Response 200 OK
{ "status": "RECORDED", "event_id": "550e8400-e29b-41d4-a716-446655440000" }

// Response 409 Conflict (On Replay / Duplicate Digest)
{ "detail": "Replay detected: duplicate hardware event digest" }
```

#### `POST /api/v2/hardware/panic`
Physical red panic button trigger. Executes on-chain `revokeSession()` directly, revokes agent privileges, logs incident, and updates audit chain.
```json
// Request
{
  "source": "ESP32_PHYSICAL_PANIC_BUTTON",
  "reason": "Operator detected unauthorized agent prompt injection"
}

// Response 200 OK
{
  "status": "PANIC_LATCHED",
  "session_revoked": true,
  "revocation_tx_hash": "0x987654...321",
  "revocation_block": 44,
  "incident_id": "INC-PANIC-1719230550"
}
```

---

### 4.4 Cryptographic Evidence & Flight Recorder

#### `GET /api/v2/evidence/audit-chain`
Fetches and verifies the SHA-256 hash-chained audit trail from SQLite.
```json
// Response 200 OK
{
  "chain_valid": true,
  "total_records": 15,
  "genesis_hash": "0000000000000000000000000000000000000000000000000000000000000000",
  "tip_hash": "a1b2c3d4...",
  "records": [
    {
      "sequence": 0,
      "event_id": "...",
      "event_type": "PAYMENT_INTENT_CREATED",
      "prev_hash": "0000000000000000000000000000000000000000000000000000000000000000",
      "entry_hash": "e3b0c442...",
      "created_utc": "2026-10-25T01:30:00Z"
    }
  ]
}
```

#### `POST /api/v2/evidence/checkpoint`
Creates an immutable integrity checkpoint and exports a standalone JSON snapshot to `C:\bastion_audit_checkpoints` for Laptop B verification.
```json
// Response 200 OK
{
  "checkpoint_id": "CHK-1719230600",
  "sequence_tip": 14,
  "tip_event_hash": "a1b2c3d4...",
  "event_count": 15,
  "export_path": "C:\\bastion_audit_checkpoints\\checkpoint_14_a1b2c3d4.json",
  "verified": true
}
```

#### `GET /api/v2/evidence/export`
Exports a fully redacted incident forensic report (JSON format). Strips API keys, internal credentials, and hashes prompts.
```json
// Query: ?incident_id=INC-PANIC-1719230550
// Response 200 OK
{
  "incident_id": "INC-PANIC-1719230550",
  "generated_utc": "2026-10-25T01:35:00Z",
  "chain_verification": { "valid": true, "total_events": 16 },
  "sanitized_events": [ ... ]
}
```

---

### 4.5 Circuit Breaker Controls

#### `GET /api/v2/circuit-breaker/state`
Returns the real-time on-chain state of `RiskCircuitBreaker.sol`.
```json
// Response 200 OK
{
  "is_frozen": false,
  "status": "NORMAL",
  "latch_state": "ACTIVE"
}
```

#### `POST /api/v2/circuit-breaker/unfreeze`
Admin emergency recovery to unfreeze an automatically latched circuit breaker.
```json
// Response 200 OK
{
  "status": "UNFROZEN",
  "tx_hash": "0x555...",
  "block_number": 45
}
```
