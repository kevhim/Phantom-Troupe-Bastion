export type RouteId =
  | 'overview'
  | 'agent'
  | 'wallet'
  | 'approvals'
  | 'security'
  | 'hardware'
  | 'evidence'
  | 'settings';

export type HardwareHealthState =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'DISCONNECTED'
  | 'TAMPER_SUSPECTED'
  | 'APPROVAL_LOCKED'
  | 'RECOVERY_REQUIRED';

export type RevocationState =
  | 'IDLE'
  | 'PANIC_LOCAL'
  | 'REVOKE_PREPARING'
  | 'REVOKE_SUBMITTED'
  | 'REVOKE_CONFIRMED'
  | 'REVOKE_FAILED'
  | 'REVOKE_UNAVAILABLE';

export type ApprovalStatus =
  | 'REQUESTED'
  | 'DEVICE_REVIEW'
  | 'PHYSICAL_CONFIRMATION'
  | 'DEVICE_SIGNED'
  | 'OWNER_AUTHORIZED'
  | 'SUBMITTED'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'REJECTED';

export interface CanonicalIntent {
  chainId: number;
  verifyingAccount: string;
  accountNonce: number;
  requestId: string;
  policyVersion: number;
  actorSession: string;
  approvalTier: string;
  tokenAddress: string;
  targetContract: string;
  functionSelector: string;
  recipientAddress: string;
  amountBaseUnits: number;
  maxPerTxException: number;
  deadline: number;
  calldataHash: string;
}

export interface ApprovalQueueItem {
  request_id: string;
  intent: CanonicalIntent;
  status: ApprovalStatus;
  created_at: number;
  cancellation_reason?: string | null;
  device_signature?: string;
  owner_signature?: string;
}

export interface ForensicEvent {
  event_id: string;
  schema_version: number;
  timestamp: number;
  event_source: string;
  correlation_id: string;
  event_type: string;
  sanitized_payload: Record<string, any>;
  previous_event_hash: string;
  current_event_hash: string;
}
