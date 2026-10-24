export type EnvironmentMode = 'LOCAL_TESTNET' | 'SIMULATED_MIRAGE' | 'OFFLINE_DISCONNECTED';

export type UserRole = 'OPERATOR' | 'SUPERVISOR';

export type IntentStatus = 'CREATED' | 'POLICY_CHECK' | 'QUEUED_HARDWARE' | 'SUBMITTED' | 'EXECUTED' | 'REVERTED' | 'REVOKED';

export type EmergencyState = 
  | 'NORMAL' 
  | 'PANIC_LOCAL' 
  | 'REVOKE_SIGNED' 
  | 'REVOKE_SUBMITTED' 
  | 'REVOKE_CONFIRMED' 
  | 'REVOKE_UNAVAILABLE';

export type RfidCardStatus = 'NO_CARD' | 'CARD_1_JUNIOR' | 'CARD_2_SENIOR';

export interface PaymentIntent {
  id: string;
  chainId: number;
  smartAccount: string;
  tokenAddress: string;
  tokenSymbol: string;
  targetAddress: string;
  functionSelector: string;
  recipient: string;
  recipientLabel: string;
  amountUnits: string;
  displayAmount: number;
  displayDecimals: number;
  createdAtUtc: string;
  status: IntentStatus;
  calldataHash: string;
  memo: string;
  requiresHardwareException: boolean;
  tierRequired: 'TIER_0_AUTONOMOUS' | 'TIER_1_JUNIOR' | 'TIER_2_SENIOR';
}

export interface UserOperationLifecycleStep {
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  detail: string;
  timestamp?: string;
}

export interface UserOperationRecord {
  intentId: string;
  userOpHash: string;
  txHash: string;
  blockNumber: number;
  gasUsed: string;
  executionSuccess: boolean;
  errorCode?: string;
  timestampUtc: string;
  sender: string;
  target: string;
  amount: string;
  steps: UserOperationLifecycleStep[];
}

export interface WhitelistedVendor {
  label: string;
  address: string;
  category: string;
  verifiedSince: string;
}

export interface SessionKeyInfo {
  publicKey: string;
  actorSession: string;
  createdAtUtc: string;
  expiresAtUtc: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  permissionScope: string;
}

export interface ApprovalTier {
  tierNumber: number;
  name: string;
  cardName: string;
  maxCeilingUsd: number;
  requiresOledReview: boolean;
  requiresGpioButton: boolean;
  requiresOwnerCosign: boolean;
}

export type ApprovalStatus = 'AWAITING_REVIEW' | 'REVIEWED_PAGES' | 'CARD_OBSERVED' | 'BUTTON_CONFIRMED' | 'SIGNED' | 'CO_SIGNED' | 'EXECUTED' | 'EXPIRED' | string;

export interface ApprovalRequest {
  id: string;
  intent: PaymentIntent;
  tierRequired: 'TIER_1_JUNIOR' | 'TIER_2_SENIOR';
  weakCardRoleObserved: RfidCardStatus;
  displayDigest: string;
  esp32SignerAddress: string;
  esp32Signature: string | null;
  esp32SignatureVerified: boolean;
  ownerCosignVerified: boolean;
  ownerSignature: string | null;
  nonce: number;
  validityDeadlineUtc: string;
  status: ApprovalStatus;
  currentOledPage: 1 | 2 | 3;
  pagesScrolled: [boolean, boolean, boolean];
  buttonApprovePressed: boolean;
  buttonPanicPressed: boolean;
  approvalTimestampUtc?: string;
}

export interface HardwareNode {
  id: string;
  name: string;
  role: string;
  hostMachine: 'LAPTOP_A' | 'LAPTOP_B' | 'LAPTOP_C' | 'LAPTOP_D';
  port: string;
  baudRate: number;
  firmware: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  lastPingMs: number;
}

export interface SecurityIncident {
  id: string;
  timestampUtc: string;
  type: 'PANIC_TRIGGERED' | 'UNAUTHORIZED_SELECTOR' | 'NON_WHITELISTED_RECIPIENT' | 'OVER_LIMIT_ATTEMPT' | 'TAMPER_DETECTED' | 'REVOCATION_SENT';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  description: string;
  sourceNode: string;
  resolved: boolean;
}

export interface AuditLogEntry {
  sequence: number;
  timestampUtc: string;
  eventType: string;
  sourceNode: string;
  payloadDigest: string;
  prevHash: string;
  entryHash: string;
  isCorrupted?: boolean;
}

export interface NetworkTopologyNode {
  id: string;
  label: string;
  ip: string;
  role: string;
  status: 'HEALTHY' | 'WARN' | 'DOWN';
  hardwareAttached: string[];
}
