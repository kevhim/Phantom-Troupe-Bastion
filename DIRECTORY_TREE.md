# BASTION X v2.2 — Repository Tree (Two-Laptop Distributed Architecture)

```text
.
├── .github/
│   └── workflows/
├── apps/
│   └── web/ (React 18 + TypeScript + Vite + Tailwind 8-route security console)
│       ├── package.json
│       ├── vite.config.ts
│       ├── index.html
│       └── src/
│           ├── App.tsx (8 Routes: Overview, Agent, Wallet, Approvals, SOC, Hardware, Evidence, Settings)
│           ├── types.ts
│           ├── index.css
│           └── main.tsx
├── contracts/
│   ├── src/
│   │   ├── BastionAccount.sol (ERC-4337 Smart Account with 6 W3-02 Policies + EIP-712 Dual Auth)
│   │   ├── MockToken.sol (bUSD Synthetic Payment Token, 6 Decimals)
│   │   ├── MockVendor.sol (Authorized Merchant Target)
│   │   └── IEntryPoint.sol (ERC-4337 EntryPoint interface)
│   └── script/
├── firmware/
│   ├── esp32_signer/
│   │   ├── esp32_signer.ino (Laptop B: Single ESP32 Dedicated Signer, Dual OLED Review #1 @ 0x3C & Status #2 @ 0x3D, RC522 SPI, GPIO Buttons, Panic RPC)
│   │   └── rules.md
│   ├── uno_operator/
│   │   └── uno_operator.ino (Laptop B: Uno #1 5V Active Buzzer D8, PIR, DHT11 Environmental Node; 16x2 LCD Decommissioned)
│   ├── uno_watchdog/
│   │   └── uno_watchdog.ino (Laptop A: Uno #2 Auxiliary Watchdog, Heartbeat & Fault Generator)
│   └── esp8266_alert/
│       └── esp8266_alert.ino (Archived: Historical Reference Only; Buzzer now on Uno #1 D8)
├── services/
│   ├── api/
│   │   └── src/
│   │       ├── main.py (FastAPI Server Entrypoint)
│   │       ├── routes/api_v2.py (REST endpoints: Payments, Approvals, Health, Evidence, Mirage)
│   │       ├── policies/policy_engine.py (On-Chain Policy Simulator & 6-Dimension Validator)
│   │       ├── hardware/health_manager.py (Hardware Health Matrix, Fail-Closed Latching, Revocation)
│   │       └── evidence/flight_recorder.py (SHA-256 Hash Chained Flight Recorder & PDF Exporter)
│   ├── supervisor/
│   │   └── supervisor_service.py (Laptop B: Supervisor Authorization & Independent Audit Checkpoints)
│   ├── gateway/
│   │   └── src/serial_gateway.py (Laptop B: USB Serial Gateway for ESP32 #1 and Uno #1)
│   ├── edge-q/
│   │   └── src/edge_coordinator.py (Laptop B: Arduino UNO Q 4GB Linux Edge Coordinator)
│   ├── vision/
│   │   └── src/camera_service.py (Laptop A: Webcam Optical Face & Liveness Risk Signals)
│   ├── agent/
│   │   └── src/purchasing_agent.py (Laptop A: AI Purchasing Agent Payment Intent Generator)
│   ├── device_crypto/ & device-crypto/
│   │   └── crypto_engine.py (Canonical EIP-712 Typed Data, Struct Hashing, Low-s Signing & Verification)
│   └── mirage/
│       └── mirage_engine.py (Safe Mirage Deception Honeypot, Synthetic Data Isolation)
├── tests/
│   ├── contracts/test_policy_and_signatures.py (11 tests: 6 policies, EIP-712 typing, dual auth, replay)
│   ├── firmware/test_hardware_fail_closed.py (6 tests: cable disconnects, fail-closed, recovery, panic)
│   ├── fixtures/test_flight_recorder.py (7 tests: SHA-256 chaining, tamper detection, checkpoints, PDF)
│   ├── adversarial/test_mirage_deception.py (4 tests: synthetic isolation, zero real token movement)
│   └── integration/test_api_v2_endpoints.py (6 integration tests: FastAPI v2 endpoints)
├── docs/ (Technical Architecture, Hardware Specifications and Deployment Guides)
│   ├── HARDWARE_MAP.md (Authoritative Two-Laptop Hardware & Pinout Specifications)
│   ├── CONTRACT_DESIGN.md (ERC-4337 Smart Account Specification)
│   ├── TRUSTED_SIGNER_DESIGN.md (ESP32 Signer Firmware Specification)
│   ├── SECURITY_THREAT_MODEL.md (Threat Model and Honest Security Disclosures)
│   ├── EMERGENCY_AND_MIRAGE.md
│   └── setup/
│       ├── LAPTOP_A_RTX5060.md (Complete Laptop A Deployment Guide)
│       ├── LAPTOP_B_INTEL_ULTRA7.md (Complete Laptop B Deployment Guide)
│       ├── LAPTOP_C_BACKUP.md (Standby Failover Guide)
│       └── TWO_LAPTOP_INTEGRATION.md (Network & Port Topology Specification)
├── scripts/ (Convenience PowerShell Launch and Diagnostic Scripts)
│   ├── start_laptop_a.ps1
│   ├── start_laptop_b.ps1
│   ├── check_laptop_a.ps1
│   ├── check_laptop_b.ps1
│   └── check_integration.ps1
├── schemas/ (Canonical JSON schemas and examples)
├── PROJECT_MASTER.md (Authoritative master architecture v2.2)
├── README.md (v2.2 Project Overview, Hardware Allocation & Setup)
└── rules.md (Root and nested directory behavioral rules)
```
