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

export interface AttackScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  attempted_amount: number;
  expected_outcome: string;
  status: 'IDLE' | 'RUNNING' | 'CONTAINED' | 'REJECTED' | 'FAILED';
  actual_loss: number;
  rejection_reason?: string;
  tx_hash?: string;
  user_op_hash?: string;
  on_chain_result?: string;
  freeze_state?: string;
}

export interface GuardianInfo {
  address: string;
  name: string;
  voted: boolean;
  vote_timestamp?: number;
}

export interface RecoveryProposalState {
  proposal_id: string;
  status: 'NONE' | 'COLLECTING_APPROVALS' | 'TIMELOCKED' | 'EXECUTED' | 'VETOED';
  current_owner: string;
  proposed_owner: string;
  votes_collected: number;
  quorum_required: number;
  quorum_reached_at?: number;
  ready_at?: number;
  remaining_seconds?: number;
  can_execute: boolean;
}

export interface PaymasterQuota {
  agent_id: string;
  name: string;
  account_address: string;
  allocated_gas: number;
  consumed_gas: number;
  remaining_gas: number;
  deposit_busd: number;
  status: 'ACTIVE' | 'EXHAUSTED' | 'FROZEN';
}

export interface CircuitBreakerState {
  status: 'ACTIVE' | 'FROZEN_AUTOMATIC' | 'FROZEN_MANUAL' | 'RECOVERY_PENDING' | 'RECOVERED';
  last_trigger_rule?: string;
  frozen_at?: number;
  velocity_violations: number;
  burst_violations: number;
  detection_rate: number;
  false_freeze_rate: number;
  precision: number;
}
