import { create } from 'zustand';
import { 
  pingDevice, 
  getSensorTelemetry, 
  testBuzzer as bridgeTestBuzzer, 
  configureBridge 
} from '../services/hardwareBridge';

export interface VerifiedMerchant {
  id: string;
  name: string;
  address: string;
  kybVerified: boolean;
  walletSigVerified: boolean;
  merkleRootAttested: boolean;
  trusted: boolean;
}

export interface UserOperationItem {
  id: string;
  txHash: string;
  merchantName: string;
  merchantAddress: string;
  amountUsdc: number;
  status: 'SUCCESS' | 'WAITING_HARDWARE' | 'REVERTED_POLICY';
  timestamp: string;
  details?: string;
}

export interface QueuedApproval {
  id: string;
  merchantName: string;
  recipientAddress: string;
  amountUsdc: number;
  calldataDigest: string;
  invoiceId: string;
  expiresInSeconds: number;
  status: 'PENDING' | 'SIGNED' | 'EXECUTED';
}

export interface AuditLogItem {
  index: number;
  event: string;
  payloadDigest: string;
  prevHash: string;
  entryHash: string;
  tampered?: boolean;
}

export interface ActiveTxStatus {
  state: 'IDLE' | 'APPROVED_MINED' | 'WAITING_HARDWARE' | 'BLOCKED_POLICY';
  title: string;
  details: string;
  txHash?: string;
  timestamp?: string;
}

export interface BastionStoreState {
  // ─── Environment & LAN ──────────────────────────────
  envMode: 'SIMULATED' | 'LIVE_LAN';
  apiBaseUrl: string;
  rpcUrl: string;
  hardwareBridgeOnline: boolean;
  hardwareBridgePingMs: number;

  // ─── Wallet & Spending Rules ────────────────────────
  smartAccountAddress: string;
  balanceUsdc: number;
  dailySpent: number;
  dailyLimit: number;
  maxPerTx: number;
  velocityCount10m: number;
  velocityMax10m: number;
  sessionKeyStatus: 'ACTIVE' | 'REVOKED';

  // ─── Verified Merchants ─────────────────────────────
  merchants: VerifiedMerchant[];

  // ─── Live Transactions & Status ─────────────────────
  activeTxStatus: ActiveTxStatus;
  recentTransactions: UserOperationItem[];

  // ─── Hardware Signer Station (ESP32 #1) ─────────────
  approvalQueue: QueuedApproval[];
  activeApproval: QueuedApproval | null;
  oledPage: 1 | 2 | 3;
  rfidState: 'NO_CARD' | 'CARD_1_JUNIOR' | 'CARD_2_SENIOR';
  rfidError: string | null;
  gpio33Approve: boolean;
  gpio32Panic: boolean;
  deviceSignature: string | null;

  // ─── IoT Sensors & Security ─────────────────────────
  pirMotion: boolean;
  opticalCheck: boolean;
  dht11Temp: number;
  dht11Humidity: number;
  esp8266BuzzerActive: boolean;
  emergencyState: 'NORMAL' | 'PANIC_FROZEN';

  // ─── Audit Log & Tamper Check ───────────────────────
  auditLogs: AuditLogItem[];
  tamperDetected: boolean;

  // ─── Actions ────────────────────────────────────────
  setEnvMode: (mode: 'SIMULATED' | 'LIVE_LAN') => void;
  setApiBaseUrl: (url: string) => void;
  setRpcUrl: (url: string) => void;
  saveLanConfig: (api: string, rpc: string) => void;

  // Payments & Demo
  sendPayment: (merchantAddress: string, amount: number, invoiceId: string) => void;
  runDemoExample: (exampleIndex: 1 | 2 | 3) => void;

  // Hardware Signer
  setOledPage: (page: 1 | 2 | 3) => void;
  setRfidState: (rfid: 'NO_CARD' | 'CARD_1_JUNIOR' | 'CARD_2_SENIOR') => void;
  clearRfidError: () => void;
  pressGpioApprove: () => void;
  pressGpioPanic: () => void;
  resetPanic: () => void;

  // Policy & Session
  revokeSessionKey: () => void;
  restoreSessionKey: () => void;

  // IoT & Diagnostics
  pingEsp32: () => Promise<void>;
  testBuzzer: () => Promise<void>;
  pollSensors: () => Promise<void>;
  toggleAuditTamper: () => void;
}

const INITIAL_MERCHANTS: VerifiedMerchant[] = [
  {
    id: 'm-1',
    name: 'Verified Demo Cloud',
    address: '0xABCD000000000000000000000000000000001234',
    kybVerified: true,
    walletSigVerified: true,
    merkleRootAttested: true,
    trusted: true,
  },
  {
    id: 'm-2',
    name: 'Sub-Vendor Compute',
    address: '0x771A0000000000000000000000000000000088C2',
    kybVerified: true,
    walletSigVerified: true,
    merkleRootAttested: true,
    trusted: true,
  },
  {
    id: 'm-3',
    name: 'Unknown Address',
    address: '0xFAKE000000000000000000000000000000009999',
    kybVerified: false,
    walletSigVerified: false,
    merkleRootAttested: false,
    trusted: false,
  },
];

const INITIAL_TXS: UserOperationItem[] = [
  {
    id: 'tx-init-1',
    txHash: '0x7b2f91a0c49e',
    merchantName: 'Verified Demo Cloud',
    merchantAddress: '0xABCD...1234',
    amountUsdc: 15.00,
    status: 'SUCCESS',
    timestamp: '10 mins ago',
    details: 'Autonomous ERC-4337 settlement',
  },
  {
    id: 'tx-init-2',
    txHash: '0x4e8a12c9df01',
    merchantName: 'Sub-Vendor Compute',
    merchantAddress: '0x771A...88C2',
    amountUsdc: 20.00,
    status: 'SUCCESS',
    timestamp: '42 mins ago',
    details: 'Bandwidth allocation compute batch',
  },
];

const INITIAL_APPROVAL: QueuedApproval = {
  id: 'req-oled-50',
  merchantName: 'Verified Demo Cloud',
  recipientAddress: '0xABCD000000000000000000000000000000001234',
  amountUsdc: 50.00,
  calldataDigest: '0x22F10000000000000000000000000000000000000000000000000000000009B22',
  invoiceId: 'INV-2026-GPU-SCALING-994',
  expiresInSeconds: 3540,
  status: 'PENDING',
};

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  { index: 1, event: 'SMART_ACCOUNT_GENESIS', payloadDigest: '0xa1b2c3d4', prevHash: '0x00000000', entryHash: '0x991823ab' },
  { index: 2, event: 'SESSION_KEY_DELEGATED', payloadDigest: '0xb2c3d4e5', prevHash: '0x991823ab', entryHash: '0x44fa78c1' },
  { index: 3, event: 'PAYMENT_AUTONOMOUS_SETTLED', payloadDigest: '0xc3d4e5f6', prevHash: '0x44fa78c1', entryHash: '0x8892be34' },
  { index: 4, event: 'HARDWARE_SIGNER_POLLED', payloadDigest: '0xd4e5f6a7', prevHash: '0x8892be34', entryHash: '0xef02187a' },
];

export const useBastionStore = create<BastionStoreState>((set, get) => ({
  // ─── Environment & LAN ──────────────────────────────
  envMode: 'SIMULATED',
  apiBaseUrl: 'http://192.168.1.10:8000',
  rpcUrl: 'http://192.168.1.10:8545',
  hardwareBridgeOnline: true,
  hardwareBridgePingMs: 12,

  // ─── Wallet & Spending Rules ────────────────────────
  smartAccountAddress: '0x7F2c0B47167B660E1b15eDa3f0f78Ea69A4BA011',
  balanceUsdc: 1000.00,
  dailySpent: 35.00,
  dailyLimit: 100.00,
  maxPerTx: 25.00,
  velocityCount10m: 1,
  velocityMax10m: 3,
  sessionKeyStatus: 'ACTIVE',

  // ─── Verified Merchants ─────────────────────────────
  merchants: INITIAL_MERCHANTS,

  // ─── Live Transactions & Status ─────────────────────
  activeTxStatus: {
    state: 'IDLE',
    title: 'Ready for Dispatch',
    details: 'System normal. Smart account session key is active and ready to process payments.',
  },
  recentTransactions: INITIAL_TXS,

  // ─── Hardware Signer Station (ESP32 #1) ─────────────
  approvalQueue: [INITIAL_APPROVAL],
  activeApproval: INITIAL_APPROVAL,
  oledPage: 1,
  rfidState: 'NO_CARD',
  rfidError: null,
  gpio33Approve: false,
  gpio32Panic: false,
  deviceSignature: null,

  // ─── IoT Sensors & Security ─────────────────────────
  pirMotion: true,
  opticalCheck: true,
  dht11Temp: 23.4,
  dht11Humidity: 44,
  esp8266BuzzerActive: false,
  emergencyState: 'NORMAL',

  // ─── Audit Log & Tamper Check ───────────────────────
  auditLogs: INITIAL_AUDIT_LOGS,
  tamperDetected: false,

  // ─── Actions ────────────────────────────────────────
  setEnvMode: (mode) => {
    configureBridge({ mode });
    set({ envMode: mode });
  },

  setApiBaseUrl: (url) => {
    configureBridge({ apiBaseUrl: url });
    set({ apiBaseUrl: url });
  },

  setRpcUrl: (url) => {
    configureBridge({ rpcUrl: url });
    set({ rpcUrl: url });
  },

  saveLanConfig: (api, rpc) => {
    configureBridge({ apiBaseUrl: api, rpcUrl: rpc });
    set({ apiBaseUrl: api, rpcUrl: rpc });
  },

  // Payments & Demo
  sendPayment: (merchantAddress, amount, invoiceId) => {
    const state = get();
    const merchant = state.merchants.find(m => m.address.toLowerCase() === merchantAddress.toLowerCase());
    const merchantName = merchant ? merchant.name : 'Unknown Recipient';
    const isUntrusted = !merchant || !merchant.trusted;

    // 1. Check if Panic is active
    if (state.emergencyState === 'PANIC_FROZEN' || state.sessionKeyStatus === 'REVOKED') {
      set({
        activeTxStatus: {
          state: 'BLOCKED_POLICY',
          title: 'Blocked: Session Key Revoked / Hardware Panic',
          details: 'The smart account is frozen or the session key is revoked. No payments can execute.',
          timestamp: new Date().toLocaleTimeString(),
        }
      });
      return;
    }

    // 2. Check if Untrusted Merchant
    if (isUntrusted) {
      const failedItem: UserOperationItem = {
        id: 'tx-' + Date.now(),
        txHash: '0x' + Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        merchantName,
        merchantAddress: merchantAddress.substring(0, 10) + '...',
        amountUsdc: amount,
        status: 'REVERTED_POLICY',
        timestamp: 'Just now',
        details: 'Blocked: Unverified merchant address'
      };

      set({
        activeTxStatus: {
          state: 'BLOCKED_POLICY',
          title: 'Blocked by Smart Contract Policy',
          details: `AA23: UnverifiedMerchantDestination — Contract reverted payment to unverified address ${merchantAddress.substring(0, 12)}...`,
          txHash: failedItem.txHash,
          timestamp: new Date().toLocaleTimeString(),
        },
        recentTransactions: [failedItem, ...state.recentTransactions.slice(0, 4)],
      });
      return;
    }

    // 3. Check Over-Limit ($25 maxPerTx)
    if (amount > state.maxPerTx) {
      const digest = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const newApproval: QueuedApproval = {
        id: 'req-' + Date.now(),
        merchantName,
        recipientAddress: merchantAddress,
        amountUsdc: amount,
        calldataDigest: digest,
        invoiceId: invoiceId || 'INV-2026-SCALE-' + Math.floor(Math.random() * 900 + 100),
        expiresInSeconds: 3600,
        status: 'PENDING',
      };

      set({
        activeTxStatus: {
          state: 'WAITING_HARDWARE',
          title: 'Waiting for ESP32 Hardware Signature',
          details: `Amount $${amount.toFixed(2)} exceeds $${state.maxPerTx} auto-pay ceiling. Queued for physical OLED review & RFID tap.`,
          timestamp: new Date().toLocaleTimeString(),
        },
        approvalQueue: [newApproval, ...state.approvalQueue],
        activeApproval: newApproval,
        oledPage: 1,
        gpio33Approve: false,
        deviceSignature: null,
      });
      return;
    }

    // 4. Autonomous Payment Execution (<=$25)
    const newTxHash = '0x' + Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newTx: UserOperationItem = {
      id: 'tx-' + Date.now(),
      txHash: newTxHash,
      merchantName,
      merchantAddress: merchantAddress.substring(0, 10) + '...',
      amountUsdc: amount,
      status: 'SUCCESS',
      timestamp: 'Just now',
      details: 'On-chain auto-approved payment',
    };

    set({
      balanceUsdc: Math.max(0, Number((state.balanceUsdc - amount).toFixed(2))),
      dailySpent: Number((state.dailySpent + amount).toFixed(2)),
      velocityCount10m: state.velocityCount10m + 1,
      activeTxStatus: {
        state: 'APPROVED_MINED',
        title: 'Approved & Mined On-Chain',
        details: `Autonomous payment of $${amount.toFixed(2)} USDC to ${merchantName} confirmed in block. All policy checks passed.`,
        txHash: newTxHash,
        timestamp: new Date().toLocaleTimeString(),
      },
      recentTransactions: [newTx, ...state.recentTransactions.slice(0, 4)],
    });
  },

  runDemoExample: (exampleIndex) => {
    const state = get();
    if (exampleIndex === 1) {
      // Example 1: $15 Auto-Pay (Approved On-Chain)
      state.sendPayment(
        '0xABCD000000000000000000000000000000001234',
        15.00,
        'INV-2026-CLOUD-981'
      );
    } else if (exampleIndex === 2) {
      // Example 2: $50 Over-Limit (Routes to ESP32 OLED)
      state.sendPayment(
        '0xABCD000000000000000000000000000000001234',
        50.00,
        'INV-2026-GPU-CLUSTER'
      );
    } else if (exampleIndex === 3) {
      // Example 3: Unverified / Velocity Violation (Blocked by Contract)
      state.sendPayment(
        '0xFAKE000000000000000000000000000000009999',
        20.00,
        'INV-UNVERIFIED-TEST'
      );
    }
  },

  // Hardware Signer
  setOledPage: (page) => set({ oledPage: page }),

  setRfidState: (rfid) => {
    set({ rfidState: rfid, rfidError: null });
    if (rfid === 'CARD_1_JUNIOR' || rfid === 'CARD_2_SENIOR') {
      const state = get();
      if (state.activeApproval) {
        // As soon as you tap the card, it immediately approves the transaction
        state.pressGpioApprove();
      }
    }
  },

  clearRfidError: () => set({ rfidError: null }),

  pressGpioApprove: () => {
    const state = get();
    if (!state.activeApproval) return;

    // If no card was selected yet, default to tapping Card 1 (Junior) for instant approval
    const effectiveRfid = state.rfidState === 'NO_CARD' ? 'CARD_1_JUNIOR' : state.rfidState;

    if (effectiveRfid === 'CARD_1_JUNIOR' && state.activeApproval.amountUsdc > 2000) {
      set({
        rfidError: 'ROLE CEILING EXCEEDED: Amount exceeds Junior cap ($2,000). Tap Card 2 (Senior) to authorize!',
      });
      return;
    }

    const isSenior = effectiveRfid === 'CARD_2_SENIOR';
    const signature = isSenior
      ? '0x7a8b9c0d1e2f34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456781c'
      : '0x4d61895a9478f7e73e925b6ec67e0e20e83b5f00e9bcfa44458f4f107f0bb57d6f54cbe540a93149a421469e5d4cb3179261a298be01369324e930f1d6b052d01b';
    const newTxHash = '0x' + Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const completedTx: UserOperationItem = {
      id: 'tx-' + Date.now(),
      txHash: newTxHash,
      merchantName: state.activeApproval.merchantName,
      merchantAddress: state.activeApproval.recipientAddress.substring(0, 10) + '...',
      amountUsdc: state.activeApproval.amountUsdc,
      status: 'SUCCESS',
      timestamp: 'Just now',
      details: `Hardware-verified (OLED reviewed + ${isSenior ? 'Senior Card (Cap $10k)' : 'Junior Card (Cap $2k)'} tap-approved)`
    };

    set({
      rfidState: effectiveRfid,
      gpio33Approve: true,
      rfidError: null,
      deviceSignature: signature,
      balanceUsdc: Math.max(0, Number((state.balanceUsdc - state.activeApproval.amountUsdc).toFixed(2))),
      dailySpent: Number((state.dailySpent + state.activeApproval.amountUsdc).toFixed(2)),
      approvalQueue: state.approvalQueue.filter(a => a.id !== state.activeApproval?.id),
      activeApproval: null,
      activeTxStatus: {
        state: 'APPROVED_MINED',
        title: 'Instant NFC Tap Verified & Mined',
        details: `NFC card tap verified on ESP32 #1 (${isSenior ? 'Senior' : 'Junior'} tier). Transaction signed with secp256k1 and mined on-chain.`,
        txHash: newTxHash,
        timestamp: new Date().toLocaleTimeString(),
      },
      recentTransactions: [completedTx, ...state.recentTransactions.slice(0, 4)],
    });
  },

  pressGpioPanic: () => {
    set({
      gpio32Panic: true,
      emergencyState: 'PANIC_FROZEN',
      sessionKeyStatus: 'REVOKED',
      esp8266BuzzerActive: true,
      activeTxStatus: {
        state: 'BLOCKED_POLICY',
        title: 'EMERGENCY HARDWARE PANIC LATCHED',
        details: 'Physical GPIO 32 panic button triggered. Session key revoked on-chain and alarm buzzer active.',
        timestamp: new Date().toLocaleTimeString(),
      }
    });
  },

  resetPanic: () => {
    set({
      gpio32Panic: false,
      emergencyState: 'NORMAL',
      sessionKeyStatus: 'ACTIVE',
      esp8266BuzzerActive: false,
      activeTxStatus: {
        state: 'IDLE',
        title: 'Panic Cleared & Normal Operation Resumed',
        details: 'Hardware panic state reset. Session key restored to active status.',
        timestamp: new Date().toLocaleTimeString(),
      }
    });
  },

  // Policy & Session
  revokeSessionKey: () => {
    set({
      sessionKeyStatus: 'REVOKED',
      activeTxStatus: {
        state: 'BLOCKED_POLICY',
        title: 'Session Key Revoked',
        details: 'Session key manually revoked by operator. No automated transactions permitted.',
        timestamp: new Date().toLocaleTimeString(),
      }
    });
  },

  restoreSessionKey: () => {
    set({
      sessionKeyStatus: 'ACTIVE',
      activeTxStatus: {
        state: 'IDLE',
        title: 'Session Key Active',
        details: 'Agent session key reactivated with normal spending policies.',
        timestamp: new Date().toLocaleTimeString(),
      }
    });
  },

  // IoT & Diagnostics
  pingEsp32: async () => {
    const ms = await pingDevice('esp32-signer');
    set({ hardwareBridgePingMs: ms, hardwareBridgeOnline: true });
  },

  testBuzzer: async () => {
    set({ esp8266BuzzerActive: true });
    await bridgeTestBuzzer();
    setTimeout(() => {
      set({ esp8266BuzzerActive: false });
    }, 2200);
  },

  pollSensors: async () => {
    const data = await getSensorTelemetry();
    set({
      pirMotion: data.pirMotion,
      opticalCheck: data.opticalFace,
      dht11Temp: data.temperatureC,
      dht11Humidity: data.humidityPct,
    });
  },

  toggleAuditTamper: () => {
    const state = get();
    if (state.tamperDetected) {
      // Restore
      set({
        auditLogs: INITIAL_AUDIT_LOGS,
        tamperDetected: false,
      });
    } else {
      // Corrupt record 2
      const corrupted = state.auditLogs.map(log => 
        log.index === 2 
          ? { ...log, payloadDigest: '0xDEADBEEF_TAMPERED', tampered: true }
          : log
      );
      set({
        auditLogs: corrupted,
        tamperDetected: true,
      });
    }
  },
}));
