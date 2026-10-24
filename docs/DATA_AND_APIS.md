# Data Storage and API Boundaries V2

## Where data belongs
**Chain (canonical):** smart-account policy, allowed signers/roles, spend counters, session expiry, revoked states, used exception nonces and executed transfer/events.  
**Laptop A SQLite (projection only):** payment_intents, userops, receipts, tx_status, approvals (metadata only), hardware_events, devices, incidents, checkpoints, synthetic_decoy_records.  
**Laptop B gateway ephemeral local buffer:** Uno#1 telemetry, UNO Q health, ESP8266 alarm status; never wallet authority.  
**ESP32 volatile:** one candidate PaymentIntent, review page state, button/GPIO debouncing, anti-replay in RAM; small encrypted persistent config and provisioned limited signer key if variant/provisioning supports; NO DB of sensitive financial records.  
**Laptop B owner wallet:** root admin key separate from agent and limited ESP32 exception signer.

## Proposed tables
- `payment_intents`: id, created_utc, actor_session, status, chain_id, smart_account, token, target, function_selector, recipient, amount_units, request_hash, policy_version, expiry.
- `user_operations`: intent_id, userop_hash, bundler_submit_status, tx_hash, chain_receipt_block, execution_success, error_code, indexed_utc.
- `approval_requests`: intent_id, tier_required, weak_card_role_observed, display_digest, esp32_signer_address, esp32_signature_verified, owner_cosign_verified, nonce, validity_deadline, status.
- `device_events`: node_id, source_type, source_counter, observed_utc, event_type, payload_redacted, digest, gateway_verification.
- `incidents`: id, trigger, state, physical_panic_utc, revocation_tx, revocation_confirmed_block, close_utc.
- `audit_entries`: sequence, event_digest, prev_hash, entry_hash, anchor_ref, created_utc.
- `policy_projections`: block, session, address, allowed_contracts/functions/recipients, budget_remaining, expiry, is_revoked; never writable as chain state.

## Representative REST endpoints (planned)
`GET /health`, `GET /api/overview`, `GET /api/wallet/policy`, `GET /api/wallet/receipts`, `POST /api/intents`, `POST /api/agent/submit`, `GET /api/intents/{id}`, `POST /api/approvals/{id}/request-review`, `GET /api/approvals/{id}`, `GET /api/hardware/devices`, `GET /api/incidents`, `GET /api/evidence/{id}`, `GET /ws/events`.  
**NO** `POST /approve=1` that can produce an owner exception, **NO** API that reveals hardware private key, and **NO** `POST /panic` accepted as physical panic origin.

## Networking and schema
Pydantic models with event version, UUID, source ID, request hash, nonce, UTC timestamp, counter and signature verification result; idempotency by source/event ID. Pin request/response types in `schemas/` and use `apps/web` generated TypeScript or manually synced types with tests. Audit untrusted sources explicitly and apply access controls to supervisor/owner routes.

## Cryptographic evidence
SHA-256 chaining of local event digests plus independent offline trusted checkpoint held on Laptop B or optionally on chain. Do not claim raw hash chain alone prevents rewriting. Retention short, synthetic demo data, redaction by default.
