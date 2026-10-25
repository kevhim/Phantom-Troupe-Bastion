# Bundler Service Rules

This service provides an ERC-4337 v0.6 compliant Bundler RPC daemon on Laptop B (`http://localhost:3000`).

## Core Responsibilities
- Implements standard JSON-RPC methods: `eth_sendUserOperation`, `eth_getUserOperationReceipt`, `eth_estimateUserOperationGas`, `eth_supportedEntryPoints`.
- Validates UserOperation structure, packing, and signature matching against canonical `@account-abstraction/contracts@0.6.0` EntryPoint.
- Submits bundled transactions via `entryPoint.handleOps([userOp], beneficiary)` on local Anvil (Chain ID 31337).
- Extracts and indexes `UserOperationEvent` logs and exposes deterministic UserOp receipts with real Anvil transaction hashes.
