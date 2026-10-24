# BASTION X v2.3 — Integration Contract & Shared Interface Specification

> **STATUS: FROZEN INTERFACE (PHASE 2)**  
> **Target Audience:** Solidity, Python Backend, React Frontend, and ESP32 Firmware Engineers.  
> **Chain:** Local Anvil (Chain ID `31337`, Port `8545`)  
> **Bundler:** ERC-4337 v0.6 Bundler (Port `3000`)

---

## 1. System Contract Deployment Manifest

All contracts are deployed deterministically on Laptop B (Intel Ultra 7 155H) under Anvil Chain ID `31337`.

| Contract | Active Address | ABI Schema Path | Description |
| :--- | :--- | :--- | :--- |
| **`EntryPoint`** | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` | [`schemas/contracts/EntryPoint.abi.json`](file:///d:/Desktop/Bastion/schemas/contracts/EntryPoint.abi.json) | Canonical `@account-abstraction/contracts@0.6.0` EntryPoint |
| **`BastionAccount`** | `0x0165878A594ca255338adfa4d48449f69242Eb8F` | [`schemas/contracts/BastionAccount.abi.json`](file:///d:/Desktop/Bastion/schemas/contracts/BastionAccount.abi.json) | ERC-4337 Smart Account with 6 W3-02 policies & Dual Auth |
| **`MockToken` (bUSD)** | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` | [`schemas/contracts/MockToken.abi.json`](file:///d:/Desktop/Bastion/schemas/contracts/MockToken.abi.json) | Synthetic ERC-20 payment token (6 decimals) |
| **`MockVendor`** | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` | [`contracts/out/MockVendor.sol/MockVendor.json`](file:///d:/Desktop/Bastion/contracts/out/MockVendor.sol/MockVendor.json) | Whitelisted merchant vendor contract |
| **`RiskCircuitBreaker`** | `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707` | [`schemas/contracts/RiskCircuitBreaker.abi.json`](file:///d:/Desktop/Bastion/schemas/contracts/RiskCircuitBreaker.abi.json) | Real-time velocity and burst anomaly detection engine |

Full machine-readable manifest: [`schemas/contracts/deployed_addresses.json`](file:///d:/Desktop/Bastion/schemas/contracts/deployed_addresses.json).

---

## 2. Cryptographic Role & Key Allocation

| Role | Address | Key Index / Origin | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Owner / Supervisor** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | Anvil Account #0 | Admin root key, policy updates, guardian recovery veto, exception co-signatures |
| **Agent Session Key** | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | Anvil Account #1 | Restricted session key held on Laptop A; signs autonomous `UserOperation`s |
| **Junior Signer** | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | Anvil Account #2 | Single ESP32 key activated when RFID Card 1 is scanned (Cap: 2,000 bUSD) |
| **Senior Signer** | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | Anvil Account #3 | Single ESP32 key activated when RFID Card 2 is scanned (Cap: 10,000 bUSD) |
| **Revoker Role** | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | Anvil Account #4 | Direct Wi-Fi emergency panic key on ESP32; calls `revokeSession` |
| **Bundler Relayer** | `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc` | Anvil Account #5 | Bundler EOA submitting `entryPoint.handleOps([userOp], beneficiary)` |
| **Allowed Vendor** | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` | Contract | Permitted vendor recipient for payments |

---

## 3. The Six W3-02 Policy Dimensions

Enforced strictly on-chain in `BastionAccount.executeAgentPayment`:

1. **Dimension 1 (Allowed Target):** `target == allowedTarget` (`MockToken: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`).
2. **Dimension 2 (Function Selector):** `transfer(address,uint256)` (`0xa9059cbb`).
3. **Dimension 3 (Allowed Recipient):** `recipient == allowedRecipient` (`MockVendor: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9`).
4. **Dimension 4 (Per-Transaction Cap):** `amount <= maxPerTxLimit` ($50\text{ bUSD} = 50 \times 10^6$).
5. **Dimension 5 (UTC Daily Spending Cap):** `dailySpent[sId][currentDay] + amount <= dailySpendLimit` ($100\text{ bUSD} = 100 \times 10^6$).
6. **Dimension 6 (Session Expiry):** `block.timestamp <= sessionExpiry` (30 days from deployment).

---

## 4. EIP-712 Dual-Authorization Specification

Out-of-policy payments require calling `BastionAccount.executeAuthorizedException(intent, deviceSig, ownerSig)`.

### A. EIP-712 Domain Separator
```solidity
DOMAIN_SEPARATOR = keccak256(
    abi.encode(
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
        keccak256(bytes("BastionX")),
        keccak256(bytes("2")),
        31337,
        0x0165878A594ca255338adfa4d48449f69242Eb8F
    )
);
// Evaluates to: 0x019dbbd0bc12d3b959f4905d64751301d6132acf9167a5c74f519d99d096e654
```

### B. PaymentIntent Typehash & Struct Definition
```solidity
PAYMENT_INTENT_TYPEHASH = keccak256(
    "PaymentIntent(uint256 chainId,address verifyingAccount,uint256 accountNonce,string requestId,uint256 policyVersion,string actorSession,string approvalTier,address tokenAddress,address targetContract,bytes4 functionSelector,address recipientAddress,uint256 amountBaseUnits,uint256 maxPerTxException,uint256 deadline,bytes32 calldataHash)"
);
// Evaluates to: 0x011d8825c7921a8bdba7c9f688846c4f034032d1f4d9241b2f4f1073cbcfecf5
```

### C. Signing Digest Calculation
$$\text{Digest} = \text{keccak256}\left(\texttt{\\x19\\x01} \mathbin{\Vert} \text{DOMAIN\_SEPARATOR} \mathbin{\Vert} \text{structHash}\right)$$

---

## 5. Frozen Multi-Platform Test Vector

Cross-validated across Solidity, Python, TypeScript, and ESP32 C++ firmware:

```json
{
  "chainId": 31337,
  "verifyingAccount": "0x0165878A594ca255338adfa4d48449f69242Eb8F",
  "accountNonce": 0,
  "requestId": "REQ-TEST-VECTOR-01",
  "policyVersion": 1,
  "actorSession": "SESSION-AI-AGENT-01",
  "approvalTier": "JUNIOR_EXCEPTION",
  "tokenAddress": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  "targetContract": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  "functionSelector": "0xa9059cbb",
  "recipientAddress": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  "amountBaseUnits": 250000000,
  "maxPerTxException": 250000000,
  "deadline": 1800000000,
  "calldataHash": "0xfc15ee44a101ee3440eec5d2fdc66f77c3e387140f0653767bcfa7210e74f177"
}
```

- **Domain Separator:** `0x019dbbd0bc12d3b959f4905d64751301d6132acf9167a5c74f519d99d096e654`
- **EIP-712 Signing Digest:** `0xdbd5bdf697c35a20b39c8b2eaadd3fd8dacd3221094d71378836798cfa8f3625`
- **Junior Signer:** `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
  - Signature: `0x78a4ea840130dbce56be6faeb30d47eebeabeb497fa805a8b9487538be1a48ff3c69c6563ee9a0ecdb7cff79899f8d55ca3364f9fa45778a48ef01eb37e44a031c`
- **Owner Signer:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
  - Signature: `0xa0e71eb677f547c1b504e9c7041a0e5f2e879a835b3ee0b3b4f9fca94017f8a716bc5b37265a7815cf1ffbf8a6cefc26db2c50e29bca63a566cf2be275e7a9b61b`

Full test vector file: [`schemas/signing/test_vectors.json`](file:///d:/Desktop/Bastion/schemas/signing/test_vectors.json).

---

## 6. ERC-4337 Bundler RPC Interface

The local Bundler runs on Laptop B at `http://127.0.0.1:3000`.

### Methods
1. `eth_supportedEntryPoints()`: Returns `["0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"]`.
2. `eth_estimateUserOperationGas(userOp, entryPoint)`: Returns recommended gas limits (`callGasLimit`: `0x55730`, `verificationGasLimit`: `0x493e0`, `preVerificationGas`: `0xc350`).
3. `eth_sendUserOperation(userOp, entryPoint)`: Submits bundled operation to Anvil via `entryPoint.handleOps([userOp], beneficiary)`. Returns `userOpHash`.
4. `eth_getUserOperationReceipt(userOpHash)`: Returns full ERC-4337 receipt containing execution status (`success: true/false`), gas metrics, and real Anvil transaction receipt (`transactionHash`, `blockNumber`).

---

## 7. ESP32 Hardware Review & Signing Protocol

Hardware setup strictly constrained to **single physical ESP32 on Laptop B**:
- **OLED #1 (`0x3C`):** Directly wired trusted review display. Paginates across 4 screens showing full 42-char vendor address, amount ($250\text{ bUSD}$), token, selector, chain ID, deadline, and fingerprint. **Fail-closed:** If OLED #1 is disconnected, signing is rejected.
- **OLED #2 (`0x3D`):** Auxiliary security/status display.
- **RFID RC522:** Card 1 = `JUNIOR_EXCEPTION` ($2,000 ceiling); Card 2 = `SENIOR_EXCEPTION` ($10,000 ceiling).
- **Physical Approval Button (GPIO 33):** Requires sustained physical press $\ge 1.5$s.
- **Physical Panic Button (GPIO 32):** Instant ISR interrupt triggering local freeze + direct Wi-Fi emergency JSON-RPC call `revokeSession(sId, "PANIC_BUTTON_PRESSED")` to Anvil node on Laptop B.
- **Alarm:** Driven by Arduino Uno #1 Pin D8 (5V active buzzer) connected via local USB to Laptop B Supervisor.
