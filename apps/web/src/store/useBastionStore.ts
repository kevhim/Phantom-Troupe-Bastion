import { create } from 'zustand';
import { 
  EnvironmentMode, 
  UserRole, 
  EmergencyState, 
  RfidCardStatus, 
  PaymentIntent, 
  UserOperationRecord, 
  WhitelistedVendor, 
  SessionKeyInfo, 
  ApprovalTier, 
  ApprovalRequest, 
  HardwareNode, 
  SecurityIncident, 
  AuditLogEntry,
  NetworkTopologyNode
} from '../types/bastion';

export interface BastionState {
  // Shell & Global
  environmentMode: EnvironmentMode;
  userRole: UserRole;
  isApprovalDrawerOpen: boolean;
  rpcPingMs: number;
  utcClock: string;
  smartAccountAddress: string;
  ownerAddress: string;
  entryPointAddress: string;
  nativeBalanceEth: number;
  tokenBalanceUsdc: number;
  maxPerTxUsd: number;
  dailyAllowanceUsd: number;
  spentTodayUsd: number;
  dailyResetUtc: string;

  // Session & Policy
  activeSession: SessionKeyInfo;
  whitelistedVendors: WhitelistedVendor[];
  allowedSelectors: { selector: string; signature: string; allowed: boolean }[];
  allowlistedTargets: { address: string; label: string; allowed: boolean }[];
  approvalTiers: ApprovalTier[];

  // UserOps & Agent
  recentUserOps: UserOperationRecord[];
  activeLifecycleStep: number;
  reasoningTrace: string[];
  lastTxReceipt: UserOperationRecord | null;
  attackLabOutput: { 
    attackType: string; 
    status: 'SUCCESS' | 'REVERTED'; 
    reason: string; 
    timestamp: string;
    details: string;
  } | null;

  // Approvals & Physical Hardware
  approvalQueue: ApprovalRequest[];
  activeApprovalId: string | null;
  
  // Hardware Nodes & Telemetry
  hardwareNodes: HardwareNode[];
  topologyNodes: NetworkTopologyNode[];
  pirMotionActive: boolean;
  opticalFaceDetected: boolean;
  temperatureC: number;
  humidityPct: number;
  esp8266AlarmActive: boolean;
  directRpcChannelActive: boolean;
  directRpcGasBalance: string;
  serialPortOwnership: { process: string; port: string; device: string; safe: boolean }[];

  // Security SOC
  riskLevel: 'TRUSTED' | 'SUSPICIOUS' | 'CRITICAL';
  emergencyState: EmergencyState;
  panicTimestampUtc: string | null;
  securityIncidents: SecurityIncident[];
  incidentFilter: string;

  // Evidence & Audit
  auditChain: AuditLogEntry[];
  tamperCorruptedIndex: number | null;
  lastAnchoredBlock: number;

  // Settings
  configSettings: {
    rpcUrl: string;
    entryPoint: string;
    bundlerUrl: string;
    autoRefresh: boolean;
  };

  // Actions
  setEnvironmentMode: (mode: EnvironmentMode) => void;
  toggleDemoFixtures: () => void;
  setUserRole: (role: UserRole) => void;
  toggleApprovalDrawer: (open?: boolean) => void;
  refreshBalances: () => void;
  
  // Agent Actions
  submitPaymentIntent: (data: { tokenSymbol: string; recipient: string; amountUsd: number; memo: string }) => void;
  runSafeAttack: (attackType: 'NON_WHITELISTED' | 'OVER_LIMIT' | 'UNAUTHORIZED_SELECTOR') => void;
  clearAttackLab: () => void;
  revokeSessionKey: () => void;

  // Approval Station Actions
  selectApprovalForReview: (id: string) => void;
  cycleOledPage: (page: 1 | 2 | 3) => void;
  tapRfidCard: (card: RfidCardStatus) => void;
  pressApproveButton: () => void;
  pressPanicButton: () => void;
  signOwnerCoSignature: () => void;
  submitApprovedIntent: (id: string) => void;

  // Security SOC Actions
  stepEmergencyState: (state: EmergencyState) => void;
  resetEmergencyState: () => void;
  togglePirMotion: () => void;
  toggleOpticalFace: () => void;
  setIncidentFilter: (filter: string) => void;

  // Hardware Actions
  triggerAlarmSelfTest: () => void;
  pingDevice: (id: string) => void;

  // Evidence Actions
  mutateAuditRecord: (index: number) => void;
  resetAuditRecord: () => void;
  exportAuditData: (format: 'json' | 'markdown') => string;

  // Settings & Presets
  saveConfigSettings: (settings: Partial<BastionState['configSettings']>) => void;
  applyDemoPreset: (presetNumber: 1 | 2 | 3 | 4 | 5) => void;
}

// Initial deterministic fixtures
const INITIAL_VENDORS: WhitelistedVendor[] = [
  { label: 'AWS Cloud Services', address: '0x3333333333333333333333333333333333333333', category: 'Infrastructure', verifiedSince: '2026-09-01' },
  { label: 'OpenAI API Platform', address: '0x4444444444444444444444444444444444444444', category: 'Inference', verifiedSince: '2026-09-15' },
  { label: 'Hardware Sensor Lab', address: '0x5555555555555555555555555555555555555555', category: 'Peripherals', verifiedSince: '2026-10-01' },
];

const INITIAL_TIERS: ApprovalTier[] = [
  { tierNumber: 0, name: 'Tier 0: Autonomous Agent', cardName: 'No Card Needed', maxCeilingUsd: 25.0, requiresOledReview: false, requiresGpioButton: false, requiresOwnerCosign: false },
  { tierNumber: 1, name: 'Tier 1: Junior Physical Review', cardName: 'RFID Card 1 (Junior)', maxCeilingUsd: 100.0, requiresOledReview: true, requiresGpioButton: true, requiresOwnerCosign: false },
  { tierNumber: 2, name: 'Tier 2: Senior Physical + Co-Sign', cardName: 'RFID Card 2 (Senior)', maxCeilingUsd: 500.0, requiresOledReview: true, requiresGpioButton: true, requiresOwnerCosign: true },
];

const INITIAL_QUEUE_ITEM: ApprovalRequest = {
  id: 'req-01-exceed-limit',
  intent: {
    id: '11111111-2222-4333-8444-555555555555',
    chainId: 31337,
    smartAccount: '0x7F2c0B47167B660E1b15eDa3f0f78Ea69A4BA011',
    tokenAddress: '0x0000000000000000000000000000000000000022',
    tokenSymbol: 'USDC',
    targetAddress: '0x0000000000000000000000000000000000000022',
    functionSelector: '0xa9059cbb',
    recipient: '0x3333333333333333333333333333333333333333',
    recipientLabel: 'AWS Cloud Services',
    amountUnits: '50000000',
    displayAmount: 50.0,
    displayDecimals: 6,
    createdAtUtc: new Date().toISOString(),
    status: 'QUEUED_HARDWARE',
    calldataHash: '0x9a8f2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    memo: 'GPU cluster auto-scaling surge payment',
    requiresHardwareException: true,
    tierRequired: 'TIER_1_JUNIOR'
  },
  tierRequired: 'TIER_1_JUNIOR',
  weakCardRoleObserved: 'NO_CARD',
  displayDigest: '0x2222222222222222222222222222222222222222222222222222222222222222',
  esp32SignerAddress: '0xE5P3200000000000000000000000000000000001',
  esp32Signature: null,
  esp32SignatureVerified: false,
  ownerCosignVerified: false,
  ownerSignature: null,
  nonce: 104,
  validityDeadlineUtc: new Date(Date.now() + 3600000).toISOString(),
  status: 'AWAITING_REVIEW',
  currentOledPage: 1,
  pagesScrolled: [true, false, false],
  buttonApprovePressed: false,
  buttonPanicPressed: false,
};

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  { sequence: 101, timestampUtc: '2026-10-24T10:15:00Z', eventType: 'SMART_ACCOUNT_INITIALIZED', sourceNode: 'contract-deployer', payloadDigest: '0xa1b2c3d4e5', prevHash: '0x0000000000000000000000000000000000000000', entryHash: '0x1111111111111111111111111111111111111111' },
  { sequence: 102, timestampUtc: '2026-10-24T10:20:00Z', eventType: 'SESSION_KEY_DELEGATED', sourceNode: 'laptop-a-api', payloadDigest: '0xb2c3d4e5f6', prevHash: '0x1111111111111111111111111111111111111111', entryHash: '0x2222222222222222222222222222222222222222' },
  { sequence: 103, timestampUtc: '2026-10-24T10:35:12Z', eventType: 'USEROP_EXECUTED_AUTONOMOUS', sourceNode: 'bundler-rpc', payloadDigest: '0xc3d4e5f6a7', prevHash: '0x2222222222222222222222222222222222222222', entryHash: '0x3333333333333333333333333333333333333333' },
  { sequence: 104, timestampUtc: '2026-10-24T11:02:44Z', eventType: 'EXCEPTION_QUEUED_OVERLIMIT', sourceNode: 'laptop-a-api', payloadDigest: '0xd4e5f6a7b8', prevHash: '0x3333333333333333333333333333333333333333', entryHash: '0x4444444444444444444444444444444444444444' }
];

export const useBastionStore = create<BastionState>((set, get) => ({
  environmentMode: 'LOCAL_TESTNET',
  userRole: 'OPERATOR',
  isApprovalDrawerOpen: false,
  rpcPingMs: 12,
  utcClock: new Date().toISOString().substring(11, 19) + ' UTC',
  smartAccountAddress: '0x7F2c0B47167B660E1b15eDa3f0f78Ea69A4BA011',
  ownerAddress: '0x0000000000000000000000000000000000000001',
  entryPointAddress: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  nativeBalanceEth: 1.428,
  tokenBalanceUsdc: 1000.0,
  maxPerTxUsd: 25.0,
  dailyAllowanceUsd: 100.0,
  spentTodayUsd: 35.0,
  dailyResetUtc: '00:00:00 UTC (in 6h 28m)',

  activeSession: {
    publicKey: '0xAg3nt5e5510nK3y00000000000000000000000001',
    actorSession: 'agent-session-v2-main',
    createdAtUtc: '2026-10-24T00:00:00Z',
    expiresAtUtc: '2026-10-25T00:00:00Z',
    status: 'ACTIVE',
    permissionScope: 'USDC only, Max $25/tx, Whitelist vendors, Max $100/day'
  },

  whitelistedVendors: INITIAL_VENDORS,
  allowedSelectors: [
    { selector: '0xa9059cbb', signature: 'transfer(address,uint256)', allowed: true },
    { selector: '0x095ea7b3', signature: 'approve(address,uint256)', allowed: false },
    { selector: '0x23b872dd', signature: 'transferFrom(address,address,uint256)', allowed: false },
  ],
  allowlistedTargets: [
    { address: '0x0000000000000000000000000000000000000022', label: 'BASTION Mock USDC', allowed: true },
    { address: '0x0000000000000000000000000000000000000088', label: 'Uniswap V3 Router (Forbidden)', allowed: false },
  ],
  approvalTiers: INITIAL_TIERS,

  recentUserOps: [
    {
      intentId: 'uo-past-01',
      userOpHash: '0x7c2d9a...e14f',
      txHash: '0x992b4f...a83c',
      blockNumber: 48921,
      gasUsed: '84,120 gas',
      executionSuccess: true,
      timestampUtc: '2026-10-24T10:35:12Z',
      sender: '0x7F2c0B47167B660E1b15eDa3f0f78Ea69A4BA011',
      target: '0x3333...3333 (AWS)',
      amount: '$15.00 USDC',
      steps: [
        { name: 'Intent Created', status: 'COMPLETED', detail: 'Agent prompt triggered payment' },
        { name: 'EIP-712 Encoded', status: 'COMPLETED', detail: 'Calldata digested' },
        { name: 'Session Signed', status: 'COMPLETED', detail: 'Signed by agent key' },
        { name: 'Bundler Relayed', status: 'COMPLETED', detail: 'Accepted by local bundler' },
        { name: 'Block Included', status: 'COMPLETED', detail: 'Mined in block 48921' },
        { name: 'Executed On-Chain', status: 'COMPLETED', detail: 'Success receipt emitted' }
      ]
    },
    {
      intentId: 'uo-past-02',
      userOpHash: '0x1a8f3c...b921',
      txHash: '0x443c2a...f71e',
      blockNumber: 48935,
      gasUsed: '82,900 gas',
      executionSuccess: true,
      timestampUtc: '2026-10-24T11:10:04Z',
      sender: '0x7F2c0B47167B660E1b15eDa3f0f78Ea69A4BA011',
      target: '0x4444...4444 (OpenAI)',
      amount: '$20.00 USDC',
      steps: [
        { name: 'Intent Created', status: 'COMPLETED', detail: 'API token refill' },
        { name: 'EIP-712 Encoded', status: 'COMPLETED', detail: 'Valid payload' },
        { name: 'Session Signed', status: 'COMPLETED', detail: 'Signed by agent key' },
        { name: 'Bundler Relayed', status: 'COMPLETED', detail: 'Sent to EntryPoint' },
        { name: 'Block Included', status: 'COMPLETED', detail: 'Mined in block 48935' },
        { name: 'Executed On-Chain', status: 'COMPLETED', detail: 'Success' }
      ]
    }
  ],
  activeLifecycleStep: 0,
  reasoningTrace: [
    'System initialization: Agent session connected with restricted permissions.',
    'Monitoring cloud GPU metrics: Memory usage exceeded 92%. Scaling trigger evaluated.',
    'Formulating payment intent for AWS Cloud Services ($15.00 USDC).',
    'Policy Pre-check: Amount $15.00 <= $25.00 MaxPerTx. Recipient is allowlisted. Executed directly.',
    'New task queued: OpenAI batch inference invoice evaluation.'
  ],
  lastTxReceipt: null,
  attackLabOutput: null,

  approvalQueue: [INITIAL_QUEUE_ITEM],
  activeApprovalId: 'req-01-exceed-limit',

  hardwareNodes: [
    { id: 'esp32-signer', name: 'ESP32 #1 Physical Signer', role: 'Hardware Typed Signer & Direct Revoker', hostMachine: 'LAPTOP_B', port: '/dev/ttyUSB0', baudRate: 115200, firmware: 'v2.0.4-rc2', status: 'ONLINE', lastPingMs: 4 },
    { id: 'esp32-operator', name: 'ESP32 #2 Auxiliary Station', role: 'Operator Telemetry Display', hostMachine: 'LAPTOP_A', port: '/dev/ttyUSB1', baudRate: 115200, firmware: 'v2.0.1-aux', status: 'ONLINE', lastPingMs: 6 },
    { id: 'uno-q', name: 'Arduino UNO Q 4GB', role: 'Edge Telemetry & Anomaly Processor', hostMachine: 'LAPTOP_B', port: '/dev/ttyACM0', baudRate: 9600, firmware: 'q-edge-1.2', status: 'ONLINE', lastPingMs: 14 },
    { id: 'uno-sensors', name: 'Arduino Uno #1', role: 'PIR, DHT11 & 16x2 LCD', hostMachine: 'LAPTOP_B', port: '/dev/ttyACM1', baudRate: 9600, firmware: 'uno-sens-2.0', status: 'ONLINE', lastPingMs: 18 },
    { id: 'esp8266-alarm', name: 'ESP8266 Alarm Module', role: 'Remote Audio/Strobe Alert', hostMachine: 'LAPTOP_B', port: 'Wi-Fi Socket', baudRate: 0, firmware: 'buzz-v1.0', status: 'ONLINE', lastPingMs: 22 }
  ],

  topologyNodes: [
    { id: 'laptop-a', label: 'Laptop A (RTX 5060)', ip: '192.168.1.101', role: 'Untrusted App + Chain Lab (API, Bundler, Anvil)', status: 'HEALTHY', hardwareAttached: ['ESP32 #2 OLED Aux'] },
    { id: 'laptop-b', label: 'Laptop B (Intel Ultra 7)', ip: '192.168.1.102', role: 'Physical Security Station', status: 'HEALTHY', hardwareAttached: ['ESP32 #1 Signer', 'RC522 RFID', 'UNO Q 4GB', 'Uno #1 Sensors'] },
    { id: 'laptop-d', label: 'Laptop D (MacBook Air M1)', ip: '192.168.1.104', role: 'Frontend Command & QA Station (You)', status: 'HEALTHY', hardwareAttached: ['Command Browser'] }
  ],

  pirMotionActive: true,
  opticalFaceDetected: true,
  temperatureC: 22.4,
  humidityPct: 46.2,
  esp8266AlarmActive: false,
  directRpcChannelActive: true,
  directRpcGasBalance: '0.05 ETH',
  serialPortOwnership: [
    { process: 'services/gateway (PID 1420)', port: '/dev/ttyACM1', device: 'Arduino Uno #1', safe: true },
    { process: 'firmware-flasher (PID idle)', port: '/dev/ttyUSB0', device: 'ESP32 #1 Signer', safe: true },
    { process: 'services/edge-q (PID 1582)', port: '/dev/ttyACM0', device: 'UNO Q 4GB', safe: true },
  ],

  riskLevel: 'TRUSTED',
  emergencyState: 'NORMAL',
  panicTimestampUtc: null,
  securityIncidents: [
    { id: 'inc-01', timestampUtc: '2026-10-24T09:12:00Z', type: 'OVER_LIMIT_ATTEMPT', severity: 'WARNING', description: 'Agent requested $50.00 exceeding $25.00 limit. Routed to ESP32 physical review queue.', sourceNode: 'Account.sol (Policy)', resolved: true },
  ],
  incidentFilter: 'ALL',

  auditChain: INITIAL_AUDIT_LOGS,
  tamperCorruptedIndex: null,
  lastAnchoredBlock: 48940,

  configSettings: {
    rpcUrl: 'http://127.0.0.1:8545',
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    bundlerUrl: 'http://127.0.0.1:4337',
    autoRefresh: true
  },

  // Actions
  setEnvironmentMode: (mode) => set({ environmentMode: mode }),
  toggleDemoFixtures: () => set((state) => ({
    environmentMode: state.environmentMode === 'LOCAL_TESTNET' ? 'SIMULATED_MIRAGE' : 'LOCAL_TESTNET'
  })),
  setUserRole: (role) => set({ userRole: role }),
  toggleApprovalDrawer: (open) => set((state) => ({
    isApprovalDrawerOpen: open !== undefined ? open : !state.isApprovalDrawerOpen
  })),
  refreshBalances: () => set((state) => ({
    nativeBalanceEth: Number((state.nativeBalanceEth + 0.001).toFixed(3)),
    tokenBalanceUsdc: Number((state.tokenBalanceUsdc).toFixed(2)),
    rpcPingMs: Math.floor(Math.random() * 8) + 8
  })),

  submitPaymentIntent: ({ tokenSymbol, recipient, amountUsd, memo }) => {
    const state = get();
    const vendor = state.whitelistedVendors.find(v => v.address.toLowerCase() === recipient.toLowerCase());
    const recipientLabel = vendor ? vendor.label : 'Custom/Unverified Recipient';
    const intentId = 'intent-' + Date.now();
    const calldataHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newIntent: PaymentIntent = {
      id: intentId,
      chainId: 31337,
      smartAccount: state.smartAccountAddress,
      tokenAddress: '0x0000000000000000000000000000000000000022',
      tokenSymbol,
      targetAddress: '0x0000000000000000000000000000000000000022',
      functionSelector: '0xa9059cbb',
      recipient,
      recipientLabel,
      amountUnits: (amountUsd * 1000000).toString(),
      displayAmount: amountUsd,
      displayDecimals: 6,
      createdAtUtc: new Date().toISOString(),
      status: amountUsd <= state.maxPerTxUsd ? 'EXECUTED' : 'QUEUED_HARDWARE',
      calldataHash,
      memo,
      requiresHardwareException: amountUsd > state.maxPerTxUsd,
      tierRequired: amountUsd > 100 ? 'TIER_2_SENIOR' : amountUsd > 25 ? 'TIER_1_JUNIOR' : 'TIER_0_AUTONOMOUS'
    };

    if (amountUsd <= state.maxPerTxUsd) {
      // Autonomous execution within policy
      const newOp: UserOperationRecord = {
        intentId,
        userOpHash: '0x' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        txHash: '0x' + Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        blockNumber: state.lastAnchoredBlock + 1,
        gasUsed: '83,400 gas',
        executionSuccess: true,
        timestampUtc: new Date().toISOString(),
        sender: state.smartAccountAddress,
        target: `${recipient.substring(0, 8)}... (${recipientLabel})`,
        amount: `$${amountUsd.toFixed(2)} ${tokenSymbol}`,
        steps: [
          { name: 'Intent Created', status: 'COMPLETED', detail: `Intent ${intentId}` },
          { name: 'EIP-712 Encoded', status: 'COMPLETED', detail: 'Hash generated' },
          { name: 'Session Signed', status: 'COMPLETED', detail: 'Autonomous delegation' },
          { name: 'Bundler Relayed', status: 'COMPLETED', detail: 'Accepted in mempool' },
          { name: 'Block Included', status: 'COMPLETED', detail: `Block #${state.lastAnchoredBlock + 1}` },
          { name: 'Executed On-Chain', status: 'COMPLETED', detail: 'Payment transferred' }
        ]
      };

      set({
        spentTodayUsd: Number((state.spentTodayUsd + amountUsd).toFixed(2)),
        tokenBalanceUsdc: Number((state.tokenBalanceUsdc - amountUsd).toFixed(2)),
        recentUserOps: [newOp, ...state.recentUserOps],
        lastTxReceipt: newOp,
        reasoningTrace: [
          `Payment requested: $${amountUsd} to ${recipientLabel}.`,
          `Policy evaluation: Amount $${amountUsd} <= $${state.maxPerTxUsd} limit. Autonomous execution approved.`,
          `Bundler confirmed UserOp ${newOp.userOpHash}. Transaction mined.`,
          ...state.reasoningTrace.slice(0, 8)
        ]
      });
    } else {
      // Exceeds policy -> Requires hardware approval
      const newApproval: ApprovalRequest = {
        id: 'req-' + Date.now(),
        intent: newIntent,
        tierRequired: amountUsd > 100 ? 'TIER_2_SENIOR' : 'TIER_1_JUNIOR',
        weakCardRoleObserved: 'NO_CARD',
        displayDigest: calldataHash,
        esp32SignerAddress: '0xE5P3200000000000000000000000000000000001',
        esp32Signature: null,
        esp32SignatureVerified: false,
        ownerCosignVerified: false,
        ownerSignature: null,
        nonce: 105 + state.approvalQueue.length,
        validityDeadlineUtc: new Date(Date.now() + 3600000).toISOString(),
        status: 'AWAITING_REVIEW',
        currentOledPage: 1,
        pagesScrolled: [true, false, false],
        buttonApprovePressed: false,
        buttonPanicPressed: false
      };

      set({
        approvalQueue: [newApproval, ...state.approvalQueue],
        activeApprovalId: newApproval.id,
        isApprovalDrawerOpen: true,
        reasoningTrace: [
          `Payment requested: $${amountUsd} to ${recipientLabel}.`,
          `ALERT: Exceeds $${state.maxPerTxUsd} MaxPerTx policy limit. Routing to ESP32 physical signing queue.`,
          `Dispatched canonical EIP-712 payload to ESP32 #1 OLED review station.`,
          ...state.reasoningTrace.slice(0, 8)
        ],
        securityIncidents: [
          {
            id: 'inc-' + Date.now(),
            timestampUtc: new Date().toISOString(),
            type: 'OVER_LIMIT_ATTEMPT',
            severity: 'WARNING',
            description: `Payment intent of $${amountUsd} exceeded limit ($${state.maxPerTxUsd}). Queued for physical hardware approval.`,
            sourceNode: 'Agent Workbench',
            resolved: false
          },
          ...state.securityIncidents
        ]
      });
    }
  },

  runSafeAttack: (attackType) => {
    const timestamp = new Date().toISOString();
    if (attackType === 'NON_WHITELISTED') {
      set({
        attackLabOutput: {
          attackType: 'Stolen Key Attack: Send to Non-Whitelisted Recipient (0xDead...6666)',
          status: 'REVERTED',
          reason: 'AA23 reverted: PolicyViolation("RECIPIENT_NOT_ALLOWLISTED")',
          timestamp,
          details: 'Smart contract verified EIP-712 session key signature, but rejected transfer because recipient 0xDead...6666 is not registered in Account.sol recipient table. Funds remained 100% safe.'
        },
        riskLevel: 'SUSPICIOUS',
        securityIncidents: [
          {
            id: 'atk-' + Date.now(),
            timestampUtc: timestamp,
            type: 'NON_WHITELISTED_RECIPIENT',
            severity: 'CRITICAL',
            description: 'Stolen agent key attempted unauthorized transfer to 0xDead...6666. Blocked on-chain.',
            sourceNode: 'Attack Lab Simulator',
            resolved: true
          },
          ...get().securityIncidents
        ]
      });
    } else if (attackType === 'OVER_LIMIT') {
      set({
        attackLabOutput: {
          attackType: 'Stolen Key Attack: Bypass $25 Max-Per-Tx Cap ($99,999.00 Drain Attempt)',
          status: 'REVERTED',
          reason: 'AA23 reverted: PolicyViolation("EXCEEDS_MAX_PER_TX")',
          timestamp,
          details: 'Attacker submitted a raw UserOp to Bundler for $99,999.00. Smart account policy checked amount against on-chain limit ($25.00) and reverted without executing ERC-20 transfer.'
        },
        riskLevel: 'SUSPICIOUS',
        securityIncidents: [
          {
            id: 'atk-' + Date.now(),
            timestampUtc: timestamp,
            type: 'OVER_LIMIT_ATTEMPT',
            severity: 'CRITICAL',
            description: 'Direct UserOp submission exceeded max-per-tx limit. Blocked on-chain.',
            sourceNode: 'Attack Lab Simulator',
            resolved: true
          },
          ...get().securityIncidents
        ]
      });
    } else {
      set({
        attackLabOutput: {
          attackType: 'Stolen Key Attack: Call Forbidden Function (0x095ea7b3 approve())',
          status: 'REVERTED',
          reason: 'AA23 reverted: PolicyViolation("FORBIDDEN_SELECTOR")',
          timestamp,
          details: 'Attacker tried calling approve() to grant unlimited token allowance. Smart account checked allowedSelectors table and rejected non-whitelisted selector.'
        },
        riskLevel: 'SUSPICIOUS',
        securityIncidents: [
          {
            id: 'atk-' + Date.now(),
            timestampUtc: timestamp,
            type: 'UNAUTHORIZED_SELECTOR',
            severity: 'CRITICAL',
            description: 'Unauthorized function selector 0x095ea7b3 invoked. Blocked on-chain.',
            sourceNode: 'Attack Lab Simulator',
            resolved: true
          },
          ...get().securityIncidents
        ]
      });
    }
  },

  clearAttackLab: () => set({ attackLabOutput: null }),

  revokeSessionKey: () => {
    set((state) => ({
      activeSession: {
        ...state.activeSession,
        status: 'REVOKED'
      },
      reasoningTrace: [
        'EMERGENCY REVOCATION: Agent session key revoked on-chain via smart account.',
        ...state.reasoningTrace
      ],
      securityIncidents: [
        {
          id: 'inc-revoke-' + Date.now(),
          timestampUtc: new Date().toISOString(),
          type: 'REVOCATION_SENT',
          severity: 'INFO',
          description: 'Session key revoked by owner.',
          sourceNode: 'SessionRevokePanel',
          resolved: true
        },
        ...state.securityIncidents
      ]
    }));
  },

  // Approvals & Hardware
  selectApprovalForReview: (id) => set({ activeApprovalId: id }),
  
  cycleOledPage: (page) => set((state) => {
    const queue = state.approvalQueue.map(item => {
      if (item.id === state.activeApprovalId) {
        const scrolled: [boolean, boolean, boolean] = [...item.pagesScrolled];
        scrolled[page - 1] = true;
        return {
          ...item,
          currentOledPage: page,
          pagesScrolled: scrolled,
          status: scrolled[0] && scrolled[1] && scrolled[2] ? 'REVIEWED_PAGES' : item.status
        };
      }
      return item;
    });
    return { approvalQueue: queue };
  }),

  tapRfidCard: (card) => set((state) => {
    const queue = state.approvalQueue.map(item => {
      if (item.id === state.activeApprovalId) {
        return {
          ...item,
          weakCardRoleObserved: card,
          status: 'CARD_OBSERVED'
        };
      }
      return item;
    });
    return { approvalQueue: queue };
  }),

  pressApproveButton: () => set((state) => {
    const queue = state.approvalQueue.map(item => {
      if (item.id === state.activeApprovalId) {
        return {
          ...item,
          buttonApprovePressed: true,
          esp32Signature: '0x' + Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          esp32SignatureVerified: true,
          status: item.tierRequired === 'TIER_2_SENIOR' ? 'SIGNED' : 'BUTTON_CONFIRMED',
          approvalTimestampUtc: new Date().toISOString()
        };
      }
      return item;
    });
    return { approvalQueue: queue };
  }),

  pressPanicButton: () => {
    const timestamp = new Date().toISOString();
    set({
      emergencyState: 'PANIC_LOCAL',
      panicTimestampUtc: timestamp,
      riskLevel: 'CRITICAL',
      esp8266AlarmActive: true,
      securityIncidents: [
        {
          id: 'panic-' + Date.now(),
          timestampUtc: timestamp,
          type: 'PANIC_TRIGGERED',
          severity: 'CRITICAL',
          description: 'ESP32 #1 GPIO32 hardware panic switch triggered! Signing halted, direct revocation broadcast.',
          sourceNode: 'ESP32 #1 GPIO32',
          resolved: false
        },
        ...get().securityIncidents
      ]
    });
  },

  signOwnerCoSignature: () => set((state) => {
    const queue = state.approvalQueue.map(item => {
      if (item.id === state.activeApprovalId) {
        return {
          ...item,
          ownerSignature: '0x' + Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          ownerCosignVerified: true,
          status: 'CO_SIGNED'
        };
      }
      return item;
    });
    return { approvalQueue: queue };
  }),

  submitApprovedIntent: (id) => {
    const state = get();
    const item = state.approvalQueue.find(q => q.id === id);
    if (!item) return;

    const newOp: UserOperationRecord = {
      intentId: item.intent.id,
      userOpHash: '0x' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      txHash: '0x' + Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      blockNumber: state.lastAnchoredBlock + 2,
      gasUsed: '112,500 gas',
      executionSuccess: true,
      timestampUtc: new Date().toISOString(),
      sender: state.smartAccountAddress,
      target: `${item.intent.recipient.substring(0, 8)}... (${item.intent.recipientLabel})`,
      amount: `$${item.intent.displayAmount.toFixed(2)} ${item.intent.tokenSymbol}`,
      steps: [
        { name: 'Intent Created', status: 'COMPLETED', detail: 'Over-limit intent' },
        { name: 'OLED Reviewed', status: 'COMPLETED', detail: '3 pages scrolled on SSD1306' },
        { name: 'ESP32 Hardware Signed', status: 'COMPLETED', detail: 'GPIO33 pressed + EIP-712 signed' },
        { name: 'Owner Co-Signed', status: item.tierRequired === 'TIER_2_SENIOR' ? 'COMPLETED' : 'COMPLETED', detail: 'Verified by smart contract' },
        { name: 'Bundler Relayed', status: 'COMPLETED', detail: 'Included in block' },
        { name: 'Executed On-Chain', status: 'COMPLETED', detail: 'Funds released' }
      ]
    };

    set({
      approvalQueue: state.approvalQueue.filter(q => q.id !== id),
      recentUserOps: [newOp, ...state.recentUserOps],
      spentTodayUsd: Number((state.spentTodayUsd + item.intent.displayAmount).toFixed(2)),
      tokenBalanceUsdc: Number((state.tokenBalanceUsdc - item.intent.displayAmount).toFixed(2)),
      activeApprovalId: null,
      lastTxReceipt: newOp,
      reasoningTrace: [
        `HARDWARE EXCEPTION APPROVED: Intent ${id} executed following physical button press & EIP-712 signature.`,
        ...state.reasoningTrace
      ]
    });
  },

  // Security SOC Actions
  stepEmergencyState: (state) => set({ emergencyState: state }),
  resetEmergencyState: () => set({ emergencyState: 'NORMAL', panicTimestampUtc: null, riskLevel: 'TRUSTED', esp8266AlarmActive: false }),
  togglePirMotion: () => set((state) => ({ pirMotionActive: !state.pirMotionActive })),
  toggleOpticalFace: () => set((state) => ({ opticalFaceDetected: !state.opticalFaceDetected })),
  setIncidentFilter: (filter) => set({ incidentFilter: filter }),

  // Hardware Actions
  triggerAlarmSelfTest: () => {
    set({ esp8266AlarmActive: true });
    setTimeout(() => {
      set({ esp8266AlarmActive: false });
    }, 2500);
  },
  pingDevice: (id) => set((state) => {
    const nodes = state.hardwareNodes.map(n => n.id === id ? { ...n, lastPingMs: Math.floor(Math.random() * 10) + 3 } : n);
    return { hardwareNodes: nodes };
  }),

  // Evidence Actions
  mutateAuditRecord: (index) => set((state) => {
    const chain = [...state.auditChain];
    if (chain[index]) {
      chain[index] = {
        ...chain[index],
        payloadDigest: '0xDEADBEEF_TAMPERED',
        isCorrupted: true
      };
    }
    return { auditChain: chain, tamperCorruptedIndex: index, riskLevel: 'CRITICAL' };
  }),
  resetAuditRecord: () => set({ auditChain: INITIAL_AUDIT_LOGS, tamperCorruptedIndex: null, riskLevel: 'TRUSTED' }),
  exportAuditData: (format) => {
    const state = get();
    if (format === 'json') {
      return JSON.stringify({
        smartAccount: state.smartAccountAddress,
        auditChain: state.auditChain,
        incidents: state.securityIncidents,
        userOps: state.recentUserOps
      }, null, 2);
    }
    return `# BASTION X FORENSIC AUDIT REPORT\nGenerated: ${new Date().toISOString()}\nSmart Account: ${state.smartAccountAddress}\n\n## Audit Chain Logs\n${state.auditChain.map(e => `- Seq ${e.sequence}: ${e.eventType} [Hash: ${e.entryHash}]`).join('\n')}`;
  },

  // Settings & Presets
  saveConfigSettings: (settings) => set((state) => ({ configSettings: { ...state.configSettings, ...settings } })),
  applyDemoPreset: (presetNumber) => {
    if (presetNumber === 1) {
      // Normal Autonomous Flow
      set({
        environmentMode: 'LOCAL_TESTNET',
        riskLevel: 'TRUSTED',
        emergencyState: 'NORMAL',
        activeApprovalId: null,
        tamperCorruptedIndex: null
      });
      get().submitPaymentIntent({
        tokenSymbol: 'USDC',
        recipient: '0x3333333333333333333333333333333333333333',
        amountUsd: 12.50,
        memo: 'Autonomous server hosting fee'
      });
    } else if (presetNumber === 2) {
      // Over-Limit Hardware Exception
      set({
        environmentMode: 'LOCAL_TESTNET',
        riskLevel: 'TRUSTED',
        emergencyState: 'NORMAL'
      });
      get().submitPaymentIntent({
        tokenSymbol: 'USDC',
        recipient: '0x4444444444444444444444444444444444444444',
        amountUsd: 75.00,
        memo: 'Surge AI inference batch quota'
      });
    } else if (presetNumber === 3) {
      // Stolen Key Attack Blocked
      set({
        environmentMode: 'LOCAL_TESTNET',
        riskLevel: 'SUSPICIOUS'
      });
      get().runSafeAttack('NON_WHITELISTED');
    } else if (presetNumber === 4) {
      // Physical Panic Active
      get().pressPanicButton();
    } else if (presetNumber === 5) {
      // Mirage Synthetic Mode
      set({
        environmentMode: 'SIMULATED_MIRAGE',
        riskLevel: 'SUSPICIOUS'
      });
    }
  }
}));
