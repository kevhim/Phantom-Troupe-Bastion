# Frontend V2 — Navigation, Component Inventory and States

**Stack:** React + TypeScript + Vite + React Router + TanStack Query + TailwindCSS + React Flow + Recharts + lucide-react, mobile-responsive but optimized for 1366–1440px laptop. Colors: ink/slate backgrounds, restrained purple brand, teal verified, amber pending, red failure. No fake telemetry or simulated blockchain receipts in production screen.

## SIX shared shell components
1. `AppSidebar` — eight routes and actor role.
2. `GlobalTopbar` — wallet/chain ID, UTC clock, connected node/network state.
3. `EnvironmentModeStrip` — `LOCAL TESTNET`, `SIMULATED / MIRAGE`, `UNVERIFIED` clearly indicated.
4. `GlobalIncidentBanner` — real incidents and pending revocation, reason and timestamps.
5. `ApprovalDrawer` — quick overview + link to true independent signer status, never button-based financial permission.
6. `AuditFooter` — firmware, commit revision, code hash, version, last verified receipt.

## EIGHT ROUTES, 66 page widgets (72 conceptual UI blocks total)

### /overview — Command Overview (9)
1. `SmartAccountIdentity` chain/account/EntryPoint/owner role.
2. `BalanceSummary` token and gas.
3. `SpendToday` on-chain UTC day cap/spent.
4. `AgentSessionTile` delegated session key/expiry/revoke.
5. `HardwareSignerHealth` ESP32 firmware/last seen/lock state, claims only from source.
6. `TrustPosture` evidence-linked soft risk state.
7. `PaymentActivity` real UserOp timeline.
8. `PendingApprovals` queue and approaching expiry.
9. `LiveDependencyPanel` A API, B gateway, UNO Q, RPC, bundler readiness.

### /agent — Agent Workbench (8)
1. `RequestComposer` constrained token/vendor/amount.
2. `ReasoningAndTools` redacted tool trace; scripted/LLM flag.
3. `ParsedCanonicalIntent` exact recipient, value, selector, chain.
4. `AdvisoryPolicyPrecheck` preview NOT final permission.
5. `UserOpLifecycle` created/signing/submitted/included/executed/reverted.
6. `TransactionReceiptCard` actual blockchain links.
7. `SafeAttackLab` test-only direct submission under stolen agent key.
8. `TaskHistory` recent requests, statuses and failures.

### /wallet — Smart Account & Policies (10)
1. `ContractIdentity` entrypoint version/account chain and verification source.
2. `AllowlistedTargets` full addresses.
3. `AllowedSelectors` decoded function signatures.
4. `RecipientPolicy` verified addresses.
5. `MaxPerTx` amount and units.
6. `DailyAllowance` on-chain state/time reset.
7. `SessionKeyRegistry` active/revoked/expired.
8. `ApprovalTierRegistry` junior/senior/owner authority, on-chain ceilings.
9. `OnChainPolicyDiff` proposed vs confirmed changes.
10. `SessionRevokePanel` owner/revoker allowed actions and progress.

### /approvals — Physical Signing & Human Review (10)
1. `ExceptionQueue` requests grouped by urgency.
2. `CanonicalIntentSummary` the exact typed fields/hashes.
3. `HardwareOLEDPreview` **secondary read-only** copy, never trusted as physical display.
4. `ReviewPagesChecklist` confirm complete recipient pagination/amount/chain.
5. `RFIDRoleState` weak credential indicator and on-chain tier cap.
6. `PhysicalButtonStatus` event source direct ESP32 signed/attested with timestamp.
7. `DeviceSignatureStatus` signer address and EIP-712 verification.
8. `OwnerCoSignature` independent wallet on B **required for every out-of-agent-policy exception in strict W3-02 mode**; high-tier changes include extra admin review.
9. `NonceExpiryAndPolicyVersion` replay protection and life cycle.
10. `ApprovalReceipt` confirmed on-chain outcome or error.

### /security — SOC & Containment (8)
1. `RiskStateBanner` TRUSTED/SUSPICIOUS/CRITICAL with caveats.
2. `ThreatSignalMatrix` camera/PIR/agent events, source confidence.
3. `IncidentFeed` selected event trace.
4. `PhysicalNetworkTopology` actual online nodes and ownership.
5. `EmergencyStateMachine` PANIC_LOCAL / SIGNER_HALTED / REVOKE_SUBMITTED / CONFIRMED / UNAVAILABLE.
6. `DirectRPCStatus` ESP32 RPC connectivity and gas balance.
7. `AttackTimeline` stolen-key/unauthorized call tests.
8. `PrivacyIndicator` consent and recording state.

### /hardware — Devices & Wiring (8)
1. `LaptopAllocationDiagram` A includes ESP32#2 + OLED#2, B includes signer ESP32#1 + OLED#1 and UNO Q, C remains standby.
2. `DeviceRegister` USB identity, board revision and firmware version.
3. `SignerPinMap` RC522 SPI, OLED I2C, GPIO32 panic, GPIO33 approve.
4. `GatewayAndCOMOwnership` serial owner and safety.
5. `OLEDPagePreview` clearly labeled replica only.
6. `TelemetryAndHeartbeats` confidence and delay.
7. `ESP8266AlarmPanel` remote alert state.
8. `SelfTestConsole` nonfinancial tests only; prohibit remote synthetic button presses.

### /evidence — Forensic and Contract Evidence (7)
1. `TransactionEvidence` userOpHash, transaction hash, actual execution status.
2. `ApprovalEvidence` exact signed struct hash, signer tier and nonce.
3. `HardwareEventTimeline` signed/observed source distinction.
4. `AuditChainVerifier` hash chain local checks.
5. `AnchoredCheckpointStatus` independently held commitment vs none.
6. `IncidentExport` sanitized JSON/Markdown bundle (PDF optional).
7. `TamperTestLab` copy logfile, mutate, compare against checkpoint.

### /settings — Environments, Roles and Safety (6)
1. `ChainConnectivityConfig` RPC, chain ID, bundler (read-only by default).
2. `EnvironmentReadiness` pinned versions and smoke checks.
3. `RoleAndSessionPreferences` app authorization distinct from on-chain.
4. `ConsentAndRetention` cameras and logs.
5. `SimulationConfig` explicitly labeled fixtures, not live assets.
6. `BuildAndSchemaVersions` commit/protocol/ABI hashes.

**TOTAL = 9+8+10+10+8+8+7+6 = 66 page widgets; 6 shared shell widgets; 72 planned conceptual components.** This is a design inventory, not 72 mandatory React source files. Use accessible reusable primitives and implement P0 pages first: Agent/Wallet/Approvals, then Overview/Security/Hardware, then Evidence/Settings.

## Component folder breakdown
```
apps/web/src/
  app/          router, permissions, layout
  pages/        overview/, agent/, wallet/, approvals/, security/, hardware/, evidence/, settings/
  components/   shell/, payments/, policy/, approvals/, security/, hardware/, evidence/, shared/
  features/     userops/, policy/, approvals/, hardware-events/, incidents/, audit/
  hooks/        REST/websocket/event reconciliation
  api/          typed client (no private keys)
  stores/       transient UI only, NO wallet secret
  types/        API and EIP712 schema types
  styles/       tokens, typographic scale, accessible color
  tests/        page and e2e flows
```

## UI invariants
- Show full-chain transaction execution only after verified outcome, not `eth_sendUserOperation` result alone.
- Separate `wallet policy`, `application preview`, `hardware confirmed`, `device signature`, `owner signature`, and `on-chain accepted` events.
- Never offer a UI "override smart contract" toggle. LAB scenarios use fake tokens and show bypass of local AI guard **not** bypass of policy.
- Offline ESP32/RPC is amber or red with last reliable heartbeat timestamp; cannot mark "revoke confirmed" from local panic.
- Avoid showing shortened recipient as sole source of truth; allow click/copy of full value. Supervisor must verify ESP32 physical OLED separately.
- Mirage only appears under explicitly marked lab mode and synthetic dataset.
