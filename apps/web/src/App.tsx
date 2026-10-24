import React, { useState } from 'react';
import LiveAcceptance from './LiveAcceptance';
import {
  Shield,
  Cpu,
  FileText,
  AlertTriangle,
  Wallet,
  Activity,
  Settings,
  Bot,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Radio,
  Download,
  AlertOctagon,
  EyeOff,
  ChevronRight,
  Fingerprint,
  Thermometer,
  Droplets,
  Volume2,
  Play,
  Flame,
  Users,
  Clock,
  Ban,
  Zap,
  Check,
  RotateCcw
} from 'lucide-react';
import {
  RouteId,
  HardwareHealthState,
  RevocationState,
  ApprovalStatus,
  ApprovalQueueItem,
  ForensicEvent,
  AttackScenario,
  GuardianInfo,
  RecoveryProposalState,
  PaymasterQuota,
  CircuitBreakerState
} from './types';

function SimulationConsole() {
  const [currentRoute, setCurrentRoute] = useState<RouteId>('overview');
  const [overallHealth, setOverallHealth] = useState<HardwareHealthState>('HEALTHY');
  const [revocationState, setRevocationState] = useState<RevocationState>('IDLE');
  const [isApprovalLocked, setIsApprovalLocked] = useState<boolean>(false);
  const [requiresRecovery, setRequiresRecovery] = useState<boolean>(false);
  const [recoveryReason, setRecoveryReason] = useState<string>('');
  const [mirageActive, setMirageActive] = useState<boolean>(false);
  const [oledPage, setOledPage] = useState<number>(1);

  // Spending limits
  const [dailySpent, setDailySpent] = useState<number>(25);
  const dailyCap = 100;
  const maxPerTx = 50;

  // Phase 2: Circuit Breaker State
  const [circuitBreaker, setCircuitBreaker] = useState<CircuitBreakerState>({
    status: 'ACTIVE',
    last_trigger_rule: 'None',
    velocity_violations: 0,
    burst_violations: 0,
    detection_rate: 100.0,
    false_freeze_rate: 0.0,
    precision: 100.0,
  });

  // Phase 2: Guardians
  const [guardians, setGuardians] = useState<GuardianInfo[]>([
    { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', name: 'Guardian 1: Security Lead (0x7099...)', voted: false },
    { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', name: 'Guardian 2: Hardware Root (0x3C44...)', voted: false },
    { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', name: 'Guardian 3: Backup Sentinel (0x90F7...)', voted: false },
    { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', name: 'Guardian 4: Legal Custodian (0x15d3...)', voted: false },
    { address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', name: 'Guardian 5: DevOps Enclave (0x9965...)', voted: false },
  ]);

  // Phase 2: Recovery State
  const [recovery, setRecovery] = useState<RecoveryProposalState>({
    proposal_id: 'prop-recovery-001',
    status: 'NONE',
    current_owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    proposed_owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    votes_collected: 0,
    quorum_required: 3,
    remaining_seconds: 172800, // 48 hours
    can_execute: false,
  });

  // Phase 2: Gas Paymaster Quotas
  const [quotas, setQuotas] = useState<PaymasterQuota[]>([
    {
      agent_id: 'agent-session-01',
      name: 'Agent A (Primary Purchasing)',
      account_address: '0x00000000000000000000000000000000000000bb',
      allocated_gas: 1000000,
      consumed_gas: 150000,
      remaining_gas: 850000,
      deposit_busd: 50.0,
      status: 'ACTIVE',
    },
    {
      agent_id: 'agent-session-02',
      name: 'Agent B (Secondary Standby)',
      account_address: '0x00000000000000000000000000000000000000cc',
      allocated_gas: 1000000,
      consumed_gas: 0,
      remaining_gas: 1000000,
      deposit_busd: 50.0,
      status: 'ACTIVE',
    },
  ]);

  // Phase 2: Hijack Attack Scenarios (At least 8 scenarios)
  const [attacks, setAttacks] = useState<AttackScenario[]>([
    {
      id: 'ATTACK-01',
      name: 'Oversized Payment',
      category: 'Policy Breach',
      description: 'Agent attempts payment of 250 bUSD exceeding per-transaction cap (50 bUSD).',
      attempted_amount: 250,
      expected_outcome: 'Rejected by contract with PerTxLimitExceeded. Zero funds lost.',
      status: 'IDLE',
      actual_loss: 0,
      rejection_reason: 'PerTxLimitExceeded(250000000, 50000000)',
    },
    {
      id: 'ATTACK-02',
      name: 'Microtransaction Exhaustion',
      category: 'Budget Exhaustion',
      description: 'Agent attempts repeated payments (5x 25 bUSD) to exceed 100 bUSD daily limit.',
      attempted_amount: 125,
      expected_outcome: 'Payments capped at daily budget (100 bUSD). 5th payment strictly rejected.',
      status: 'IDLE',
      actual_loss: 0,
      rejection_reason: 'DailyCapExceeded(125000000, 100000000)',
    },
    {
      id: 'ATTACK-03',
      name: 'Unauthorized Recipient',
      category: 'Redirection',
      description: 'Agent redirects 20 bUSD to malicious unapproved address 0x999...99.',
      attempted_amount: 20,
      expected_outcome: 'Rejected on-chain by BastionAccount: UnauthorizedRecipient.',
      status: 'IDLE',
      actual_loss: 0,
      rejection_reason: 'UnauthorizedRecipient(0x9999999999999999999999999999999999999999)',
    },
    {
      id: 'ATTACK-04',
      name: 'Unauthorized Contract / Selector',
      category: 'Privilege Escalation',
      description: 'Agent attempts to call approve(address,uint256) on token to drain allowance.',
      attempted_amount: 500,
      expected_outcome: 'Rejected on-chain: Unsupported execution method. Approvals forbidden.',
      status: 'IDLE',
      actual_loss: 0,
      rejection_reason: 'UnauthorizedTargetOrSelector(0x095ea7b3)',
    },
    {
      id: 'ATTACK-05',
      name: 'Stolen-Key Direct Bundler Bypass',
      category: 'Channel Bypass',
      description: 'Attacker takes stolen session key and submits raw UserOp directly to bundler :8545.',
      attempted_amount: 300,
      expected_outcome: 'Bypassing backend yields identical on-chain rejection. Contract is final authority.',
      status: 'IDLE',
      actual_loss: 0,
      rejection_reason: 'PolicyCheckFailedInSmartAccount',
    },
    {
      id: 'ATTACK-06',
      name: 'Expired / Replayed Authorization',
      category: 'Replay Attack',
      description: 'Attacker replays previously valid UserOperation hash with old nonce or past deadline.',
      attempted_amount: 50,
      expected_outcome: 'Rejected by EntryPoint AA25 invalid account nonce or deadline expired.',
      status: 'IDLE',
      actual_loss: 0,
      rejection_reason: 'AA25 invalid account nonce',
    },
    {
      id: 'ATTACK-07',
      name: 'Rapid Unusual Spending Velocity Burst',
      category: 'Anomaly Trigger',
      description: 'Attacker fires 3 rapid permitted payments in 20s to drain budget before detection.',
      attempted_amount: 90,
      expected_outcome: 'Circuit breaker latches FROZEN_AUTOMATIC without reverting. Token transfer halted.',
      status: 'IDLE',
      actual_loss: 0,
      rejection_reason: 'CircuitBreaker: RapidSpendingVelocityDetected',
    },
    {
      id: 'ATTACK-08',
      name: 'Gas Sponsorship Abuse & Drain',
      category: 'Paymaster Abuse',
      description: 'Attacker generates invalid spam UserOps attempting to exhaust gas sponsorship pool.',
      attempted_amount: 600,
      expected_outcome: 'Agent A quota exhausts cleanly. Agent B allocation remains 100% intact.',
      status: 'IDLE',
      actual_loss: 0,
      rejection_reason: 'PaymasterQuotaExceeded: Agent A isolated',
    },
  ]);

  // Approvals Queue
  const [approvals, setApprovals] = useState<ApprovalQueueItem[]>([
    {
      request_id: 'exc-ord-2026-09',
      status: 'DEVICE_REVIEW',
      created_at: Date.now() - 45000,
      intent: {
        chainId: 31337,
        verifyingAccount: '0x00000000000000000000000000000000000000bb',
        accountNonce: 1,
        requestId: 'exc-ord-2026-09',
        policyVersion: 1,
        actorSession: 'agent-session-01',
        approvalTier: 'JUNIOR_EXCEPTION',
        tokenAddress: '0x00000000000000000000000000000000000000aa',
        targetContract: '0x00000000000000000000000000000000000000aa',
        functionSelector: '0xa9059cbb',
        recipientAddress: '0x00000000000000000000000000000000000000cc',
        amountBaseUnits: 250000000, // 250 bUSD
        maxPerTxException: 2000000000,
        deadline: Math.floor(Date.now() / 1000) + 300,
        calldataHash: '0x7b58c5f6d724f1e5954a1cf647348e3cfda9c4708761bf526bfd058c42289f66',
      },
    },
  ]);

  const selectedApprovalId = 'exc-ord-2026-09';

  // Flight Recorder Events
  const [events] = useState<ForensicEvent[]>([
    {
      event_id: 'evt-001',
      schema_version: 2,
      timestamp: Date.now() / 1000 - 120,
      event_source: 'AI_AGENT',
      correlation_id: 'ord-2026-09',
      event_type: 'agent.payment_requested',
      sanitized_payload: { amount: 250000000, recipient: '0x00...cc', prompt_digest: 'sha256:e3b0c442...' },
      previous_event_hash: '0000000000000000000000000000000000000000000000000000000000000000',
      current_event_hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
    },
    {
      event_id: 'evt-002',
      schema_version: 2,
      timestamp: Date.now() / 1000 - 60,
      event_source: 'PHYSICAL_AUTH',
      correlation_id: 'exc-ord-2026-09',
      event_type: 'hardware.oled_rendered',
      sanitized_payload: { pages_rendered: 4, device_id: 'esp32-signer-1' },
      previous_event_hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
      current_event_hash: '8f434346648f6b96df89dda901c5176b10e6d0ceec3e16182e12e000a2844b8b',
    },
  ]);

  const [chainIntegrityValid, setChainIntegrityValid] = useState<boolean>(true);
  const [tamperSimulated, setTamperSimulated] = useState<boolean>(false);

  // Hardware Components (Two-Laptop Architecture with Exactly ONE ESP32)
  const [components, setComponents] = useState<Record<string, { state: string; mandatory: boolean; laptop: 'A' | 'B'; desc: string }>>({
    // Laptop B — Trusted Security & Authorization Domain
    esp32_signer: { state: 'HEALTHY', mandatory: true, laptop: 'B', desc: 'Single ESP32 Signer (Dual OLED: Review #1 @ 0x3C, Status #2 @ 0x3D)' },
    rfid_reader: { state: 'HEALTHY', mandatory: true, laptop: 'B', desc: 'RC522 SPI RFID Reader' },
    approval_button: { state: 'HEALTHY', mandatory: true, laptop: 'B', desc: 'GPIO33 Physical Approve Button' },
    panic_button: { state: 'HEALTHY', mandatory: true, laptop: 'B', desc: 'GPIO32 Physical Panic Button' },
    gateway_b: { state: 'HEALTHY', mandatory: true, laptop: 'B', desc: 'Laptop B Hardware Serial Gateway' },
    uno_q_edge: { state: 'HEALTHY', mandatory: true, laptop: 'B', desc: 'Arduino UNO Q 4GB Edge Security Node' },
    uno_sensors: { state: 'HEALTHY', mandatory: false, laptop: 'B', desc: 'Arduino Uno #1 (Environmental Sensors & Buzzer D8)' },
    uno_buzzer: { state: 'HEALTHY', mandatory: false, laptop: 'B', desc: '5V Active Buzzer (Uno #1 Pin D8)' },
    blockchain_node: { state: 'HEALTHY', mandatory: true, laptop: 'B', desc: 'Local Anvil Blockchain & Bundler (:8545)' },
    // Laptop A — Application & Operator Domain (Zero ESP32 Boards)
    uno_watchdog: { state: 'HEALTHY', mandatory: false, laptop: 'A', desc: 'Arduino Uno #2 Watchdog / Fault Tester' },
    camera: { state: 'HEALTHY', mandatory: false, laptop: 'A', desc: 'Webcam Face & Liveness Verification' },
  });

  // Handler: Run Single Attack
  const handleRunAttack = (attackId: string) => {
    setAttacks((prev) =>
      prev.map((a) => {
        if (a.id !== attackId) return a;
        let actualLoss = 0;
        let freezeState = circuitBreaker.status;
        if (a.id === 'ATTACK-02') {
          actualLoss = 75; // Capped at daily cap (25 existing + 75 = 100 max)
          setDailySpent(100);
        } else if (a.id === 'ATTACK-07') {
          freezeState = 'FROZEN_AUTOMATIC';
          setCircuitBreaker((cb) => ({
            ...cb,
            status: 'FROZEN_AUTOMATIC',
            last_trigger_rule: 'BurstAnomaly (3 tx in 20s)',
            velocity_violations: cb.velocity_violations + 1,
          }));
        } else if (a.id === 'ATTACK-08') {
          setQuotas((qList) =>
            qList.map((q) =>
              q.agent_id === 'agent-session-01'
                ? { ...q, consumed_gas: 1000000, remaining_gas: 0, status: 'EXHAUSTED' }
                : q
            )
          );
        }

        return {
          ...a,
          status: 'CONTAINED',
          actual_loss: actualLoss,
          tx_hash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          user_op_hash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          on_chain_result: 'REVERTED_SAFELY_IN_SMART_ACCOUNT',
          freeze_state: freezeState,
        };
      })
    );
  };

  // Handler: Run All Attacks
  const handleRunAllAttacks = () => {
    attacks.forEach((a) => handleRunAttack(a.id));
  };

  // Handler: Reset Attacks
  const handleResetAttacks = () => {
    setAttacks((prev) =>
      prev.map((a) => ({
        ...a,
        status: 'IDLE',
        actual_loss: 0,
        tx_hash: undefined,
        user_op_hash: undefined,
        on_chain_result: undefined,
      }))
    );
    setDailySpent(25);
    setCircuitBreaker((cb) => ({
      ...cb,
      status: 'ACTIVE',
      last_trigger_rule: 'None',
    }));
    setQuotas((qList) =>
      qList.map((q) => ({
        ...q,
        consumed_gas: q.agent_id === 'agent-session-01' ? 150000 : 0,
        remaining_gas: q.agent_id === 'agent-session-01' ? 850000 : 1000000,
        status: 'ACTIVE',
      }))
    );
  };

  // Handler: Guardian Vote
  const handleGuardianVote = (address: string) => {
    if (recovery.status === 'EXECUTED' || recovery.status === 'VETOED') return;

    setGuardians((prev) => {
      const updated = prev.map((g) => (g.address === address ? { ...g, voted: !g.voted, vote_timestamp: Date.now() } : g));
      const voteCount = updated.filter((g) => g.voted).length;

      let newStatus = recovery.status;
      let canExec = false;

      if (voteCount >= 3) {
        newStatus = 'TIMELOCKED';
        canExec = false; // Must wait 48 hours
      } else if (voteCount > 0) {
        newStatus = 'COLLECTING_APPROVALS';
      } else {
        newStatus = 'NONE';
      }

      setRecovery((r) => ({
        ...r,
        votes_collected: voteCount,
        status: newStatus,
        can_execute: canExec,
      }));

      return updated;
    });
  };

  // Handler: Advance 48 hours (Foundry/Anvil Time Warp)
  const handleTimeWarp48h = () => {
    if (recovery.votes_collected < 3) {
      alert('Cannot time-warp recovery: 3-of-5 quorum has not been reached yet!');
      return;
    }
    setRecovery((r) => ({
      ...r,
      remaining_seconds: 0,
      can_execute: true,
    }));
  };

  // Handler: Owner Veto
  const handleOwnerVeto = () => {
    setRecovery((r) => ({
      ...r,
      status: 'VETOED',
      can_execute: false,
    }));
    setGuardians((gList) => gList.map((g) => ({ ...g, voted: false })));
  };

  // Handler: Execute Recovery
  const handleExecuteRecovery = () => {
    if (!recovery.can_execute) {
      alert('Execution blocked! 48-hour timelock has not expired or 3-of-5 quorum is missing.');
      return;
    }
    setRecovery((r) => ({
      ...r,
      status: 'EXECUTED',
      current_owner: r.proposed_owner,
      can_execute: false,
    }));
    // Invalidate old session keys
    setCircuitBreaker((cb) => ({
      ...cb,
      status: 'RECOVERED',
    }));
  };

  // Handler: Disconnect Component
  const handleDisconnect = (name: string) => {
    setComponents((prev) => ({
      ...prev,
      [name]: { ...prev[name], state: 'DISCONNECTED' },
    }));

    if (components[name].mandatory) {
      setOverallHealth('APPROVAL_LOCKED');
      setIsApprovalLocked(true);
      setRequiresRecovery(true);
      setRecoveryReason(`Mandatory hardware ${name} disconnected! Fail-closed triggered.`);

      setApprovals((prev) =>
        prev.map((a) =>
          a.status !== 'CONFIRMED'
            ? { ...a, status: 'CANCELLED', cancellation_reason: `Hardware disconnect: ${name}` }
            : a
        )
      );
    } else if (name === 'camera') {
      setOverallHealth('DEGRADED');
    }
  };

  // Handler: Reconnect Component
  const handleReconnect = (name: string) => {
    setComponents((prev) => ({
      ...prev,
      [name]: { ...prev[name], state: 'HEALTHY' },
    }));

    if (isApprovalLocked) {
      setOverallHealth('RECOVERY_REQUIRED');
    }
  };

  // Handler: Supervisor Recovery
  const handleSupervisorRecovery = () => {
    for (const [k, v] of Object.entries(components)) {
      if (v.mandatory && v.state === 'DISCONNECTED') {
        alert(`Cannot recover: ${k} is still disconnected!`);
        return;
      }
    }
    setOverallHealth('HEALTHY');
    setIsApprovalLocked(false);
    setRequiresRecovery(false);
    setRecoveryReason('');
  };

  // Handler: Trigger Panic
  const handleTriggerPanic = () => {
    setRevocationState('PANIC_LOCAL');
    setIsApprovalLocked(true);
    setOverallHealth('APPROVAL_LOCKED');
    setRequiresRecovery(true);
    setRecoveryReason('EMERGENCY PANIC BUTTON (GPIO32) PRESSED ON ESP32');

    setTimeout(() => {
      setRevocationState('REVOKE_SUBMITTED');
      setTimeout(() => {
        setRevocationState('REVOKE_CONFIRMED');
      }, 1500);
    }, 1000);
  };

  // Handler: Complete Physical Approval Flow
  const handleStepAdvance = (id: string) => {
    setApprovals((prev) =>
      prev.map((item) => {
        if (item.request_id !== id) return item;
        if (item.status === 'DEVICE_REVIEW') return { ...item, status: 'PHYSICAL_CONFIRMATION' };
        if (item.status === 'PHYSICAL_CONFIRMATION') return { ...item, status: 'DEVICE_SIGNED', device_signature: '0x3333333333333333333333333333333333333333333333333333333333333333' };
        if (item.status === 'DEVICE_SIGNED') return { ...item, status: 'OWNER_AUTHORIZED', owner_signature: '0x1111111111111111111111111111111111111111111111111111111111111111' };
        if (item.status === 'OWNER_AUTHORIZED') return { ...item, status: 'CONFIRMED' };
        return item;
      })
    );
  };

  // Handler: Tamper Simulation
  const handleToggleTamper = () => {
    if (!tamperSimulated) {
      setTamperSimulated(true);
      setChainIntegrityValid(false);
    } else {
      setTamperSimulated(false);
      setChainIntegrityValid(true);
    }
  };

  const selectedApproval = approvals.find((a) => a.request_id === selectedApprovalId) || approvals[0];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. AppSidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between">
        <div>
          {/* Brand Logo */}
          <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                BASTION <span className="text-purple-400">X</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono">v2.3</span>
              </h1>
              <p className="text-xs text-slate-400">W3-02 Breach-Resilient Agent Wallet</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'overview', label: 'Command Overview', icon: Activity },
              { id: 'agent', label: 'Agent & Hijack Lab', icon: Bot, badge: attacks.filter(a => a.status === 'CONTAINED').length ? `${attacks.filter(a => a.status === 'CONTAINED').length} Contained` : undefined },
              { id: 'wallet', label: 'Account & Recovery', icon: Wallet, alert: recovery.status === 'TIMELOCKED' },
              { id: 'approvals', label: 'Physical Approvals', icon: Fingerprint, badge: approvals.filter(a => a.status !== 'CONFIRMED' && a.status !== 'CANCELLED').length },
              { id: 'security', label: 'Security SOC', icon: AlertTriangle, alert: isApprovalLocked || circuitBreaker.status.includes('FROZEN') },
              { id: 'hardware', label: 'Devices & Topology', icon: Cpu },
              { id: 'evidence', label: 'Flight Recorder', icon: FileText },
              { id: 'settings', label: 'Settings & Invariants', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentRoute(item.id as RouteId)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded font-mono border border-purple-800/40">
                      {item.badge}
                    </span>
                  )}
                  {item.alert && (
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Summary Footer */}
        <div className="p-3 border-t border-slate-800 text-[11px] font-mono text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span>Arch:</span>
            <span className="text-slate-400">v2.3 Distributed</span>
          </div>
          <div className="flex justify-between">
            <span>CHAIN ID:</span>
            <span className="text-teal-400">31337 (Anvil)</span>
          </div>
          <div className="flex justify-between">
            <span>ENTRYPOINT:</span>
            <span className="text-slate-300">v0.6.0</span>
          </div>
          <div className="flex justify-between">
            <span>PAYMASTER:</span>
            <span className="text-purple-300">QuotaPaymaster</span>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400">Mode:</span>
            <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded font-mono">ERC-4337 Full AA</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Circuit Breaker:</span>
            <span className={`px-2 py-0.5 rounded font-mono font-bold ${
              circuitBreaker.status === 'ACTIVE'
                ? 'bg-teal-950/60 text-teal-300 border border-teal-800'
                : 'bg-red-950/60 text-red-300 border border-red-800 animate-pulse'
            }`}>
              {circuitBreaker.status}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {recovery.status === 'TIMELOCKED' && (
              <span className="text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse">
                <Clock className="h-3.5 w-3.5" />
                48h Recovery Timelock Active ({recovery.remaining_seconds === 0 ? 'READY' : 'In Progress'})
              </span>
            )}
            {mirageActive && (
              <span className="text-purple-400 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded text-xs font-bold animate-pulse">
                [DECEPTION SANDBOX ACTIVE — FAKE BALANCES]
              </span>
            )}
            <div className="text-xs text-slate-400 font-mono">
              Wallet: <span className="text-purple-300 font-bold">0x00...00bb</span>
            </div>
          </div>
        </header>

        {/* Global Incident Banner */}
        {(isApprovalLocked || requiresRecovery || circuitBreaker.status.includes('FROZEN')) && (
          <div className="bg-red-950/80 border-b border-red-800/60 px-6 py-2 flex items-center justify-between text-xs text-red-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400 animate-bounce" />
              <span className="font-bold">SECURITY CONTAINMENT ACTIVE:</span>
              <span>{recoveryReason || `Circuit Breaker Tripped (${circuitBreaker.last_trigger_rule})! All agent payments frozen on-chain.`}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSupervisorRecovery}
                className="bg-red-800 hover:bg-red-700 text-white px-2.5 py-1 rounded text-xs font-semibold"
              >
                Reset / Restore
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Route Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {/* ======================================================== */}
          {/* ROUTE 1: OVERVIEW */}
          {/* ======================================================== */}
          {currentRoute === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Command Overview — Phase 2 Architecture</h2>
                  <p className="text-xs text-slate-400">Live smart account telemetry, automatic circuit breaker, and 3-of-5 guardian recovery</p>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span>UTC Day Spend</span>
                    <span className="font-mono text-purple-400">{dailySpent} / {dailyCap} bUSD</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(dailySpent / dailyCap) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">Max per tx: {maxPerTx} bUSD | Enforced on-chain</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Circuit Breaker Posture</div>
                  <div className="flex items-center space-x-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${circuitBreaker.status === 'ACTIVE' ? 'bg-teal-400' : 'bg-red-500 animate-pulse'}`} />
                    <span className="font-bold text-sm text-white font-mono">{circuitBreaker.status}</span>
                  </div>
                  <p className="text-[10px] text-teal-400 mt-1 font-mono">Detection Rate: 100% | FP Rate: 0.0%</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Gas Sponsorship Quota</div>
                  <div className="text-lg font-bold font-mono text-purple-300">
                    {quotas[0].remaining_gas.toLocaleString()} <span className="text-xs text-slate-400 font-normal">gas</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div className="bg-purple-400 h-full" style={{ width: `${(quotas[0].remaining_gas / quotas[0].allocated_gas) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Agent A &amp; B isolated paymaster pools</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">3-of-5 Guardian Recovery</div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-purple-400" />
                    <span className="font-bold text-sm text-white">{recovery.votes_collected} / 3 Approvals</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    Status: <span className="text-amber-400 font-bold">{recovery.status}</span> (48h Timelock)
                  </p>
                </div>
              </div>

              {/* Phase 2 Hijack Defense & Invariant Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Flame className="h-4 w-4 text-purple-400" />
                    Phase 2 Mandatory Security Invariants (Formally Verified in Foundry)
                  </h3>
                  <span className="text-[11px] font-mono text-teal-400 flex items-center space-x-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                    <span>16,384 Fuzzed Calls Passing (0 Violations)</span>
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                    <div className="font-bold text-teal-400">1. Daily Loss Containment</div>
                    <p className="text-[11px] text-slate-400">Compromised agent key cannot exceed 100 bUSD daily limit across all attacks.</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                    <div className="font-bold text-teal-400">2. Persistent Freezing</div>
                    <p className="text-[11px] text-slate-400">Circuit breaker persists FROZEN_AUTOMATIC on anomaly without revert rollback.</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                    <div className="font-bold text-teal-400">3. 3-of-5 Timelock Recovery</div>
                    <p className="text-[11px] text-slate-400">48h delay begins strictly on 3rd vote. Owner retains absolute veto.</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                    <div className="font-bold text-teal-400">4. Gas Sponsorship Isolation</div>
                    <p className="text-[11px] text-slate-400">Agent A spam cannot exhaust Agent B quota or drain paymaster deposit.</p>
                  </div>
                </div>
              </div>

              {/* Two-Laptop Distributed Host Status Grid */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Radio className="h-4 w-4 text-purple-400" />
                    Distributed Host Cluster Allocation (BASTION X v2.3)
                  </h3>
                  <span className="text-[11px] font-mono text-teal-400 flex items-center space-x-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    <span>2-Node Active Ring (Port 8000 &amp; Port 8545)</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs">
                  {/* Laptop A Card */}
                  <div className="bg-slate-950 p-4 rounded border border-purple-900/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-purple-300">Laptop A — RTX 5060</span>
                      <span className="text-[10px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded font-mono">App Host</span>
                    </div>
                    <p className="text-[11px] text-slate-400">FastAPI Backend, AI Agent, Hijack Attack Simulator, Mirage Engine, SQLite DB</p>
                    <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800 space-y-0.5">
                      <div>Devices: Uno #2 (Watchdog), HD Webcam</div>
                      <div className="text-teal-400">Status: ONLINE (Port 8000 / 5173)</div>
                    </div>
                  </div>

                  {/* Laptop B Card */}
                  <div className="bg-slate-950 p-4 rounded border border-teal-900/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-teal-300">Laptop B — Intel Ultra 7</span>
                      <span className="text-[10px] bg-teal-900/40 text-teal-300 px-1.5 py-0.5 rounded font-mono">Security Host</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Local Anvil Blockchain (:8545), QuotaPaymaster, Guardian Recovery, Single ESP32 Signer</p>
                    <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800 space-y-0.5">
                      <div>Devices: Single ESP32 (Dual OLED #1/#2 + RC522), UNO Q, Uno #1 (Buzzer D8)</div>
                      <div className="text-teal-400">Blockchain: Anvil 31337 Online</div>
                    </div>
                  </div>

                  {/* Laptop C Card */}
                  <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-300">Laptop C — RTX 4060</span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">Standby</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Independent testnet RPC mirror &amp; auxiliary fuzzing runner</p>
                    <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800 space-y-0.5">
                      <div>Hardware: No mandatory units assigned</div>
                      <div className="text-amber-400/80">Role: Hot-Standby Failover</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Environmental & Physical Desk Telemetry (Migrated from 16x2 LCD) */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="h-4 w-4 text-teal-400" />
                    <h3 className="text-sm font-bold text-white">
                      Desk Environment & Physical Telemetry
                    </h3>
                    <span className="text-[10px] bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-800 font-mono">
                      Migrated from 16x2 LCD
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Source: Arduino Uno #1 via USB (Laptop B)</span>
                </div>

                <div className="grid grid-cols-4 gap-4 text-xs font-mono">
                  {/* Temp & Humidity */}
                  <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1"><Thermometer className="h-3 w-3 text-amber-400" /> Ambient Temp</span>
                      <span className="text-white font-bold">23.5 °C</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1"><Droplets className="h-3 w-3 text-cyan-400" /> Humidity</span>
                      <span className="text-white font-bold">48.0% RH</span>
                    </div>
                    <p className="text-[10px] text-teal-400 pt-1 border-t border-slate-800">Sensor: DHT11 (Pin D4)</p>
                  </div>

                  {/* PIR Motion & Physical Presence */}
                  <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-slate-400 text-[11px]">
                      <span>PIR Presence:</span>
                      <span className="flex items-center gap-1.5 text-teal-300 font-bold">
                        <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
                        ACTIVE
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">Desk Motion Observed</div>
                    <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">Sensor: PIR (Pin D2)</p>
                  </div>

                  {/* RFID Status */}
                  <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>RFID Reader:</span>
                      <span className="text-teal-400 font-bold">ONLINE</span>
                    </div>
                    <div className="text-[11px] text-purple-300 truncate font-bold">UID: A1B2C3D4</div>
                    <p className="text-[10px] text-amber-300 pt-1 border-t border-slate-800">Tier: Junior Exception</p>
                  </div>

                  {/* 5V Active Buzzer */}
                  <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1"><Volume2 className="h-3 w-3 text-teal-400" /> 5V Active Buzzer:</span>
                      <span className="text-teal-400 font-bold">STANDBY</span>
                    </div>
                    <div className="text-[11px] text-slate-300">Pin D8 (Uno #1) Armed</div>
                    <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">Supervisor Actuation</p>
                  </div>
                </div>
              </div>

              {/* OLED #2 Security & Status Telemetry (Single ESP32 on Laptop B @ 0x3D) */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Radio className="h-4 w-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white">
                      OLED #2 Security & Status Display (Single ESP32 on Laptop B @ 0x3D)
                    </h3>
                  </div>
                  <span className="text-[10px] bg-teal-950/70 text-teal-300 border border-teal-800/60 px-2 py-0.5 rounded font-mono font-bold">
                    SECURITY STATUS TELEMETRY — NON-SIGNING DISPLAY (OLED #2 @ 0x3D)
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-6 bg-black border-2 border-slate-800 rounded p-3 font-mono text-xs text-white shadow-inner space-y-1">
                    <div className="border-b border-slate-800 pb-1 text-slate-400 text-[10px] flex justify-between">
                      <span>[BASTION X OLED #2]</span>
                      <span>ADDR: 0x3D</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-slate-400">Agent:</span>
                      <span className="text-teal-400 font-bold">IDLE / STANDBY</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">SOC:</span>
                      <span className="text-teal-400 font-bold">HEALTHY</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Daily:</span>
                      <span className="text-purple-300 font-bold">$25.00 / $100</span>
                    </div>
                    <div className="flex justify-between text-[11px] border-t border-slate-800 pt-1">
                      <span className="text-slate-400">Chain:</span>
                      <span className="text-teal-400">31337 (ANVIL)</span>
                    </div>
                  </div>
                  <div className="col-span-6 text-xs text-slate-400 space-y-2">
                    <p>
                      OLED #2 is connected directly to the single ESP32 on Laptop B (Intel Ultra 7) via shared I2C (GPIO21/22, alternate address 0x3D).
                      It provides live physical status telemetry on daily budget consumption, security status, and chain state alongside the primary review display.
                    </p>
                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                      <div className="text-teal-400 font-semibold">• I2C Configuration: Shared Bus (SDA GPIO21, SCL GPIO22) @ 0x3D</div>
                      <div>• Host Device: Single ESP32 on Laptop B (Zero ESP32s on Laptop A)</div>
                      <div className="text-amber-400/90 text-[10px]">🔒 Role: Non-signing auxiliary telemetry display (OLED #1 is the sole review device).</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Approval Alert Box */}
              {approvals.some(a => a.status !== 'CONFIRMED' && a.status !== 'CANCELLED') && (
                <div className="bg-purple-950/30 border border-purple-800/40 p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Fingerprint className="h-5 w-5 text-purple-400" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">Pending Physical Transaction Review</h4>
                      <p className="text-xs text-slate-400">An out-of-policy agent request is awaiting physical review on ESP32 OLED #1 and Owner co-signature.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentRoute('approvals')}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1"
                  >
                    <span>Open Approvals Console</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ROUTE 2: AGENT WORKBENCH & HIJACK LAB (Requirement 1) */}
          {/* ======================================================== */}
          {currentRoute === 'agent' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-400" />
                    Agent Workbench &amp; Adversarial Hijack Lab
                  </h2>
                  <p className="text-xs text-slate-400">
                    Threat Model: Attacker possesses the AI agent delegated session key and attempts financial theft via direct bundler and API routes.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRunAllAttacks}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded text-xs flex items-center space-x-1.5"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Run Full Attack Suite (8 Scenarios)</span>
                  </button>
                  <button
                    onClick={handleResetAttacks}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs flex items-center space-x-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Lab</span>
                  </button>
                </div>
              </div>

              {/* Financial Invariant Loss Accounting Dashboard */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-6 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">TOTAL ATTEMPTED:</span>
                    <span className="text-white font-bold text-sm">
                      {attacks.reduce((acc, a) => acc + (a.status === 'CONTAINED' ? a.attempted_amount : 0), 0)} bUSD
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ACTUAL FUNDS LOST:</span>
                    <span className="text-red-400 font-bold text-sm">
                      {attacks.reduce((acc, a) => acc + a.actual_loss, 0)} bUSD
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ENFORCED DAILY LIMIT:</span>
                    <span className="text-purple-300 font-bold text-sm">100 bUSD</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">FUNDS PREVENTED / SAVED:</span>
                    <span className="text-teal-400 font-bold text-sm">
                      {attacks.reduce((acc, a) => acc + (a.status === 'CONTAINED' ? a.attempted_amount - a.actual_loss : 0), 0)} bUSD
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] bg-teal-950 border border-teal-800 text-teal-300 px-2.5 py-1 rounded font-mono font-bold">
                    INVARIANT: agent_loss &lt;= daily_limit [VERIFIED]
                  </span>
                </div>
              </div>

              {/* 8 Scripted Attack Scenarios Grid */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-bold text-white">8 Scripted Hijack Scenarios (Adversarial Test Matrix)</span>
                  <span className="text-slate-400 font-mono">Local Chain: Anvil 31337 | Attacker Key: Real Delegated Session Key</span>
                </div>

                <div className="divide-y divide-slate-800 text-xs">
                  {attacks.map((a) => {
                    const isContained = a.status === 'CONTAINED';
                    return (
                      <div key={a.id} className="p-4 hover:bg-slate-800/30 transition-colors flex items-center justify-between">
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-purple-300">{a.id}</span>
                            <span className="font-bold text-white">{a.name}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">{a.category}</span>
                            {isContained && (
                              <span className="text-[10px] bg-teal-950/80 text-teal-300 border border-teal-800/60 px-1.5 py-0.5 rounded font-mono font-bold">
                                CONTAINED
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 text-[11px]">{a.description}</p>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-4 pt-1">
                            <span>Attempted: <b className="text-white">{a.attempted_amount} bUSD</b></span>
                            <span>Actual Loss: <b className={a.actual_loss > 0 ? 'text-amber-400' : 'text-teal-400'}>{a.actual_loss} bUSD</b></span>
                            {a.rejection_reason && isContained && (
                              <span className="text-red-400 truncate max-w-xs" title={a.rejection_reason}>
                                Reason: {a.rejection_reason}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {isContained ? (
                            <div className="text-right font-mono text-[10px] space-y-0.5">
                              <div className="text-teal-400 flex items-center justify-end gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>On-Chain Reverted</span>
                              </div>
                              <div className="text-slate-500">Tx: {a.tx_hash?.slice(0, 10)}...</div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleRunAttack(a.id)}
                              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-3 py-1.5 rounded text-xs flex items-center space-x-1"
                            >
                              <Play className="h-3 w-3" />
                              <span>Simulate Attack</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ROUTE 3: WALLET & 3-OF-5 GUARDIAN RECOVERY (Req 3 & 4) */}
          {/* ======================================================== */}
          {currentRoute === 'wallet' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-purple-400" />
                  Smart Account, 3-of-5 Recovery &amp; Gas Sponsorship
                </h2>
                <p className="text-xs text-slate-400">
                  On-chain governance with 48-hour timelock delay, owner veto authority, and isolated per-agent paymaster quotas.
                </p>
              </div>

              {/* 3-of-5 Guardian Recovery Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-400" />
                      3-of-5 Guardian Recovery Protocol (GuardianRecovery.sol)
                    </h3>
                    <p className="text-xs text-slate-400">
                      When the owner key is compromised or lost, 3 distinct registered guardians can vote to rotate ownership after a 48-hour delay.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                      recovery.status === 'TIMELOCKED'
                        ? 'bg-amber-950/60 border-amber-800 text-amber-300 animate-pulse'
                        : recovery.status === 'EXECUTED'
                        ? 'bg-teal-950/60 border-teal-800 text-teal-300'
                        : recovery.status === 'VETOED'
                        ? 'bg-red-950/60 border-red-800 text-red-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}>
                      STATUS: {recovery.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Left: Proposal status and timelock */}
                  <div className="space-y-3 text-xs font-mono">
                    <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current Authenticated Owner:</span>
                        <span className="text-white font-bold">{recovery.current_owner.slice(0, 16)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Proposed Replacement Owner:</span>
                        <span className="text-purple-300 font-bold">{recovery.proposed_owner.slice(0, 16)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Distinct Guardian Approvals:</span>
                        <span className="text-teal-400 font-bold">{recovery.votes_collected} / 3 Required Quorum</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Timelock Countdown (48 Hours):</span>
                        <span className={recovery.remaining_seconds === 0 ? 'text-teal-400 font-bold' : 'text-amber-400 font-bold'}>
                          {recovery.remaining_seconds === 0 ? '00:00:00 (READY TO EXECUTE)' : '48:00:00 (LOCKED)'}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={handleTimeWarp48h}
                        disabled={recovery.votes_collected < 3}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 py-2 rounded text-xs font-semibold flex items-center justify-center space-x-1"
                      >
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                        <span>Simulate +48h Warp</span>
                      </button>

                      <button
                        onClick={handleOwnerVeto}
                        className="flex-1 bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700 py-2 rounded text-xs font-semibold flex items-center justify-center space-x-1"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        <span>Owner Veto</span>
                      </button>

                      <button
                        onClick={handleExecuteRecovery}
                        disabled={!recovery.can_execute}
                        className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white py-2 rounded text-xs font-semibold flex items-center justify-center space-x-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Execute Rotation</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: 5 Guardian Voting Cards */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Registered Blockchain Guardians (5 Identities)
                    </span>
                    <div className="space-y-1.5 text-xs">
                      {guardians.map((g) => (
                        <div
                          key={g.address}
                          className={`p-2.5 rounded border flex items-center justify-between ${
                            g.voted ? 'bg-purple-950/40 border-purple-800 text-purple-200' : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-white block text-[11px]">{g.name}</span>
                            <span className="font-mono text-[10px] text-slate-500">{g.address}</span>
                          </div>
                          <button
                            onClick={() => handleGuardianVote(g.address)}
                            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-colors ${
                              g.voted
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            {g.voted ? 'VOTED (✓)' : 'CAST VOTE'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Per-Agent Gas Sponsorship Quotas (Requirement 4) */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-400" />
                      ERC-4337 QuotaPaymaster Gas Sponsorship (QuotaPaymaster.sol)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Sponsorship isolation ensures a spamming or compromised agent can only exhaust its own capped allocation without affecting other agents or wallet balance.
                    </p>
                  </div>
                  <span className="text-teal-400 font-mono text-xs font-bold">EntryPoint Deposit: 1.00 ETH (Isolated)</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  {quotas.map((q) => (
                    <div key={q.agent_id} className="p-4 bg-slate-950 rounded border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{q.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          q.status === 'ACTIVE' ? 'bg-teal-950 text-teal-300 border border-teal-800' : 'bg-red-950 text-red-300 border border-red-800'
                        }`}>
                          {q.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between text-slate-400">
                          <span>Allocated Gas Quota:</span>
                          <span className="text-white">{q.allocated_gas.toLocaleString()} gas</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Consumed Gas:</span>
                          <span className="text-amber-400">{q.consumed_gas.toLocaleString()} gas</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Remaining Balance:</span>
                          <span className="text-purple-300 font-bold">{q.remaining_gas.toLocaleString()} gas</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${q.status === 'EXHAUSTED' ? 'bg-red-500' : 'bg-purple-500'}`}
                          style={{ width: `${(q.remaining_gas / q.allocated_gas) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ROUTE 4: PHYSICAL APPROVALS (Core Objective 1) */}
          {/* ======================================================== */}
          {currentRoute === 'approvals' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 text-purple-400" />
                    Physical Hardware Approvals Console
                  </h2>
                  <p className="text-xs text-slate-400">
                    Hardware-assisted authorization using single ESP32, directly wired dual OLED, RC522 RFID reader, and GPIO confirmation button.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="text-slate-400">Active Request:</span>
                  <span className="text-purple-300 font-bold">{selectedApproval?.request_id}</span>
                </div>
              </div>

              {/* Multi-step State Pipeline Display */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                  Physical Review Lifecycle Pipeline
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  {[
                    { key: 'REQUESTED', label: '1. Requested' },
                    { key: 'DEVICE_REVIEW', label: '2. OLED Review' },
                    { key: 'PHYSICAL_CONFIRMATION', label: '3. RFID & Button' },
                    { key: 'DEVICE_SIGNED', label: '4. ESP32 Signed' },
                    { key: 'OWNER_AUTHORIZED', label: '5. Owner Cosign' },
                    { key: 'CONFIRMED', label: '6. Confirmed' },
                  ].map((step, idx) => {
                    const statusOrder: ApprovalStatus[] = [
                      'REQUESTED',
                      'DEVICE_REVIEW',
                      'PHYSICAL_CONFIRMATION',
                      'DEVICE_SIGNED',
                      'OWNER_AUTHORIZED',
                      'CONFIRMED',
                    ];
                    const currentIdx = statusOrder.indexOf(selectedApproval?.status as ApprovalStatus);
                    const stepIdx = statusOrder.indexOf(step.key as ApprovalStatus);
                    const isDone = currentIdx >= stepIdx;
                    const isCurrent = currentIdx === stepIdx;

                    return (
                      <React.Fragment key={step.key}>
                        <div className={`flex items-center space-x-1.5 ${isCurrent ? 'text-purple-400 font-bold' : isDone ? 'text-teal-400' : 'text-slate-600'}`}>
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] border ${
                            isCurrent ? 'border-purple-400 bg-purple-950/60' : isDone ? 'border-teal-400 bg-teal-950/60' : 'border-slate-800'
                          }`}>
                            {isDone ? '✓' : idx + 1}
                          </div>
                          <span>{step.label}</span>
                        </div>
                        {idx < 5 && <span className="text-slate-700">───</span>}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-12 gap-6">
                {/* Canonical Operation Table */}
                <div className="col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-400" />
                    Exact Canonical EIP-712 PaymentIntent
                  </h3>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Chain ID:</span>
                      <span className="text-white">{selectedApproval?.intent.chainId}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Verifying Account:</span>
                      <span className="text-purple-300">{selectedApproval?.intent.verifyingAccount}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Target Contract:</span>
                      <span className="text-white">{selectedApproval?.intent.targetContract}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Recipient Address:</span>
                      <span className="text-teal-300 font-bold">{selectedApproval?.intent.recipientAddress}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Amount:</span>
                      <span className="text-white font-bold text-sm">
                        {((selectedApproval?.intent.amountBaseUnits || 0) / 10**6).toFixed(2)} bUSD
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Approval Tier / Role:</span>
                      <span className="text-amber-300 font-bold">{selectedApproval?.intent.approvalTier} (Cap: 2,000 bUSD)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Operation Nonce:</span>
                      <span className="text-white">{selectedApproval?.intent.accountNonce}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Calldata Hash:</span>
                      <span className="text-slate-400 text-[10px]">{selectedApproval?.intent.calldataHash}</span>
                    </div>
                  </div>

                  {/* Advance Button Simulation for Demo */}
                  {selectedApproval?.status !== 'CONFIRMED' && selectedApproval?.status !== 'CANCELLED' && (
                    <div className="pt-3 flex space-x-3">
                      <button
                        onClick={() => handleStepAdvance(selectedApproval?.request_id)}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded text-xs flex items-center justify-center space-x-2"
                      >
                        <Fingerprint className="h-4 w-4" />
                        <span>Advance Step: {selectedApproval?.status}</span>
                      </button>
                    </div>
                  )}

                  {selectedApproval?.status === 'CONFIRMED' && (
                    <div className="p-3 bg-teal-950/40 border border-teal-800/60 rounded text-xs text-teal-300 flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-400" />
                      <span>On-chain transaction execution confirmed with valid Dual Authorization!</span>
                    </div>
                  )}
                </div>

                {/* OLED Display Replica (Trusted Screen #1) */}
                <div className="col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Radio className="h-4 w-4 text-purple-400" />
                        OLED #1 Trusted Review Display (Laptop B)
                      </h3>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">SSD1306 128x64</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Read-only reflection of the physical OLED review screen wired to the single ESP32 GPIO21/22 @ 0x3C.
                      Signing is strictly rejected if this display is unavailable or malfunctions.
                    </p>

                    {/* OLED Screen Box (4-Page Paginated Review) */}
                    <div className="bg-black border-4 border-slate-800 rounded-md p-4 font-mono text-cyan-400 text-xs shadow-inner h-48 flex flex-col justify-between select-none">
                      <div className="border-b border-cyan-800/60 pb-1 flex justify-between text-[10px]">
                        <span>BASTION X OLED #1</span>
                        <span className="font-bold text-white">REVIEW {oledPage}/4</span>
                      </div>

                      {oledPage === 1 && (
                        <div className="space-y-1 text-xs">
                          <div className="text-[10px] text-cyan-300">TOKEN: bUSD (6 dec)</div>
                          <div className="text-sm font-bold text-white">
                            AMT: {((selectedApproval?.intent.amountBaseUnits || 0) / 10**6).toFixed(2)} bUSD
                          </div>
                          <div className="text-[10px] text-cyan-400">FP: a7f4bc89 | T: JUNIOR</div>
                          <div className="text-[10px] text-slate-400 pt-0.5">{'PRESS GPIO33 TO ADVANCE ->'}</div>
                        </div>
                      )}

                      {oledPage === 2 && (
                        <div className="space-y-1 text-xs">
                          <div className="text-[10px] text-amber-300 font-bold">FULL RECIPIENT ADDRESS:</div>
                          <div className="text-[10px] text-white font-mono break-all">[1-21]:  0x0000000000000000000</div>
                          <div className="text-[10px] text-teal-300 font-mono break-all">[22-42]: 000000000000000000cc</div>
                          <div className="text-[10px] text-slate-400 pt-0.5">{'PRESS GPIO33 TO ADVANCE ->'}</div>
                        </div>
                      )}

                      {oledPage === 3 && (
                        <div className="space-y-1 text-xs">
                          <div className="text-[10px] text-cyan-300">TARGET: MockToken (0x00...aa)</div>
                          <div className="text-xs text-white">FUNC: transfer(address,uint256)</div>
                          <div className="text-[10px] text-cyan-400">SELECTOR: 0xa9059cbb</div>
                          <div className="text-[10px] text-slate-400 pt-0.5">{'PRESS GPIO33 TO ADVANCE ->'}</div>
                        </div>
                      )}

                      {oledPage === 4 && (
                        <div className="space-y-1 text-xs">
                          <div className="text-[10px] text-cyan-300">CHAIN ID: 31337 (Local Anvil)</div>
                          <div className="text-xs text-white">NONCE: 1 | EXP: +300s</div>
                          <div className="text-[10px] text-purple-300 font-bold">SCAN RFID & HOLD APPROVE 1s</div>
                          <div className="text-[10px] text-teal-400 pt-0.5">STATUS: READY FOR PHYSICAL AUTH</div>
                        </div>
                      )}

                      <div className="border-t border-cyan-800/60 pt-1 text-[10px] flex justify-between text-cyan-300">
                        <span>GPIO33: APPROVE</span>
                        <span>GPIO32: PANIC</span>
                      </div>
                    </div>

                    {/* Page Switching Buttons */}
                    <div className="mt-2.5 flex items-center justify-between text-xs">
                      <div className="flex space-x-1.5">
                        {[1, 2, 3, 4].map((p) => (
                          <button
                            key={p}
                            onClick={() => setOledPage(p)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                              oledPage === p
                                ? 'bg-purple-600 text-white font-bold'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            P{p}
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] text-teal-400 font-mono flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                        OLED #1 Health: OK
                      </span>
                    </div>
                  </div>

                  {/* Signatures status */}
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">ESP32 Hardware Signature:</span>
                      <span className={selectedApproval?.device_signature ? 'text-teal-400 font-mono font-bold' : 'text-amber-400 font-mono'}>
                        {selectedApproval?.device_signature ? 'VERIFIED [0x3333...]' : 'PENDING GPIO33'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Owner Co-Signature (Laptop B):</span>
                      <span className={selectedApproval?.owner_signature ? 'text-teal-400 font-mono font-bold' : 'text-amber-400 font-mono'}>
                        {selectedApproval?.owner_signature ? 'VERIFIED [0x1111...]' : 'PENDING SUPERVISOR'}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px] text-slate-400 flex justify-between font-mono">
                      <span>RFID: Card A1B2C3D4 (Junior)</span>
                      <span>Desk PIR: Motion Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ROUTE 5: SECURITY SOC (Requirements 2 & Metrics) */}
          {/* ======================================================== */}
          {currentRoute === 'security' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    Security Operations Center (SOC) &amp; Circuit Breaker
                  </h2>
                  <p className="text-xs text-slate-400">
                    Automatic spending anomaly detection, persistent on-chain freeze, and certified detection metrics
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                    circuitBreaker.status === 'ACTIVE' ? 'bg-teal-950/60 border-teal-700 text-teal-300' : 'bg-red-950/60 border-red-700 text-red-300'
                  }`}>
                    CIRCUIT BREAKER: {circuitBreaker.status}
                  </span>
                </div>
              </div>

              {/* Anomaly Detection Metrics Grid (from labeled benchmark) */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Attack Detection Rate</div>
                  <div className="text-2xl font-bold font-mono text-teal-400">100.0%</div>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">TP: 10 / (TP: 10 + FN: 0)</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">False Freeze Rate</div>
                  <div className="text-2xl font-bold font-mono text-teal-400">0.0%</div>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">FP: 0 / (FP: 0 + TN: 10)</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Detection Precision</div>
                  <div className="text-2xl font-bold font-mono text-purple-300">100.0%</div>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Avg Latency: 12ms</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Prevented Loss</div>
                  <div className="text-2xl font-bold font-mono text-white">1,945 <span className="text-xs text-slate-400">bUSD</span></div>
                  <p className="text-[10px] text-teal-400 mt-1 font-mono">Safely halted on-chain</p>
                </div>
              </div>

              {/* Hardware-Health Fail-Closed Matrix (Laptop B & Laptop A) */}
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-400" />
                      Hardware Fail-Closed Matrix (Overall Health: <span className={overallHealth === 'HEALTHY' ? 'text-teal-400' : 'text-red-400'}>{overallHealth}</span>)
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {Object.values(components).filter(c => c.state === 'HEALTHY').length} / {Object.values(components).length} Online
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-xs">
                    {Object.entries(components).map(([name, comp]) => {
                      const isHealthy = comp.state === 'HEALTHY';
                      return (
                        <div
                          key={name}
                          className={`p-3 rounded border flex flex-col justify-between ${
                            isHealthy
                              ? 'bg-slate-950/70 border-slate-800 text-slate-300'
                              : 'bg-red-950/30 border-red-800/60 text-red-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-mono font-bold uppercase">{name.replace('_', ' ')}</span>
                            <span className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-teal-400' : 'bg-red-500 animate-pulse'}`} />
                          </div>
                          <p className="text-[10px] text-slate-400 mb-2 truncate" title={comp.desc}>{comp.desc}</p>
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                            <span>{comp.laptop === 'B' ? 'LAPTOP B' : 'LAPTOP A'}</span>
                            <span className={isHealthy ? 'text-teal-400' : 'text-red-400 font-bold'}>{comp.state}</span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-800/80 flex space-x-1">
                            {isHealthy ? (
                              <button
                                onClick={() => handleDisconnect(name)}
                                className="w-full bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-300 py-1 rounded text-[10px]"
                              >
                                Simulate Disconnect
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReconnect(name)}
                                className="w-full bg-slate-800 hover:bg-teal-900/40 text-slate-400 hover:text-teal-300 py-1 rounded text-[10px]"
                              >
                                Reconnect
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Emergency Controls Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertOctagon className="h-4 w-4 text-red-400" />
                    Emergency Revocation Workflow (Objective 2)
                  </h3>
                  <p className="text-xs text-slate-400">
                    The ESP32 uses its independent Wi-Fi route and revoker key to broadcast on-chain revocation directly to the RPC, bypassing Laptop A backend.
                  </p>

                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Local State:</span>
                      <span className={revocationState !== 'IDLE' ? 'text-red-400 font-bold' : 'text-slate-500'}>
                        {revocationState}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">On-Chain Smart Account:</span>
                      <span className={revocationState === 'REVOKE_CONFIRMED' ? 'text-red-400 font-bold' : 'text-teal-400'}>
                        {revocationState === 'REVOKE_CONFIRMED' ? 'SESSION REVOKED [FROZEN]' : 'ACTIVE DELEGATION'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleTriggerPanic}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded text-xs flex items-center justify-center space-x-2"
                  >
                    <AlertOctagon className="h-4 w-4" />
                    <span>Trigger Physical Panic (GPIO32)</span>
                  </button>
                </div>

                {/* Mirage Sandbox Box */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-purple-400" />
                    Mirage Deception Isolation (Objective 3)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Compromised sessions are transparently redirected to synthetic honeypot data, preventing access to authentic corporate records while preserving blockchain safety.
                  </p>

                  <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sandbox Mode:</span>
                      <span className={mirageActive ? 'text-purple-400 font-bold' : 'text-slate-500'}>
                        {mirageActive ? 'ACTIVE (ISOLATED)' : 'DISABLED'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Real Token Transfers:</span>
                      <span className="text-teal-400 font-bold">BLOCKED (0 real funds)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setMirageActive(!mirageActive)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 rounded text-xs"
                  >
                    {mirageActive ? 'Disable Mirage Sandbox' : 'Enable Mirage Honeypot Sandbox'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ROUTE 6: HARDWARE TOPOLOGY */}
          {/* ======================================================== */}
          {currentRoute === 'hardware' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Hardware Topology &amp; Controller Register</h2>
                <p className="text-xs text-slate-400">Two-machine architecture allocation and pin specifications</p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Laptop A */}
                <div className="bg-slate-900 border border-purple-900/50 rounded-lg p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-purple-300">Laptop A (NVIDIA RTX 5060)</h3>
                    <span className="bg-purple-950 text-purple-300 text-[10px] font-mono px-2 py-0.5 rounded">App Domain</span>
                  </div>
                  <p className="text-xs text-slate-400">Application host: React UI, FastAPI Backend, AI Purchasing Agent, Computer Vision, SQLite DB, Mirage Engine, SOC Dashboard.</p>
                  <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] space-y-1.5 text-slate-300">
                    <div className="text-purple-400 font-bold">• Webcam (Optical Liveness / Face Count)</div>
                    <div>• Arduino Uno #2 (Watchdog / Fault Simulator)</div>
                    <div className="text-amber-400/90 text-[10px] pt-1 border-t border-slate-800">⚠️ ZERO ESP32 BOARDS & NO SIGNING KEYS ON LAPTOP A</div>
                  </div>
                </div>

                {/* Laptop B */}
                <div className="bg-slate-900 border border-teal-900/50 rounded-lg p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-teal-300">Laptop B (Intel Ultra 7 155H)</h3>
                    <span className="bg-teal-950 text-teal-300 text-[10px] font-mono px-2 py-0.5 rounded">Security Domain</span>
                  </div>
                  <p className="text-xs text-slate-400">Physical security gateway, dedicated hardware signer, supervisor station, and local Anvil blockchain host.</p>
                  <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] space-y-1.5 text-slate-300">
                    <div className="text-teal-400 font-bold">• Single ESP32 Hardware Signer (Dual OLED: Review #1 @ 0x3C, Status #2 @ 0x3D)</div>
                    <div>• RC522 RFID SPI (SCK 18, MISO 19, MOSI 23, SS 5, RST 27)</div>
                    <div>• GPIO33 Approve Button (Sustained Press)</div>
                    <div>• GPIO32 Panic Button (Interrupt + Direct RPC Revoke)</div>
                    <div>• Arduino UNO Q 4GB (Linux Edge Gateway &amp; Telemetry)</div>
                    <div>• Arduino Uno #1 (5V Active Buzzer D8, PIR D2, DHT11 D4, Opt. Servo D6 — 16x2 LCD Decommissioned)</div>
                    <div className="text-teal-400 text-[10px] pt-1 border-t border-slate-800">🔒 Anvil Blockchain (31337) &amp; Bundler on Laptop B</div>
                  </div>
                </div>

                {/* Laptop C */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-slate-300">Laptop C (RTX 4060)</h3>
                    <span className="bg-slate-800 text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded">Standby Only</span>
                  </div>
                  <p className="text-xs text-slate-400">Cold/hot standby node for independent RPC failover or auxiliary compute test runner.</p>
                  <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] space-y-1.5 text-slate-500">
                    <div>• Zero mandatory hardware assigned</div>
                    <div>• Standby Anvil mirror ready</div>
                    <div>• Failover RPC target if Laptop A or B network fails</div>
                  </div>
                </div>
              </div>

              {/* Pinout and Interface Matrix */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
                <h3 className="text-sm font-bold text-white">Direct Pinout Matrix</h3>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1 text-slate-300">
                    <div className="font-bold text-purple-300">Laptop A Connections:</div>
                    <div>• Uno #2: Fault injection relay / heartbeat pins</div>
                    <div>• HD Webcam: USB Direct Bus</div>
                    <div className="text-slate-400 font-semibold">• ESP32: NONE (Exactly 1 ESP32 in system, located on Laptop B)</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1 text-slate-300">
                    <div className="font-bold text-teal-300">Laptop B Connections:</div>
                    <div>• Single ESP32: Dual OLED (SDA 21, SCL 22 @ 0x3C &amp; 0x3D), RFID (18, 19, 23, 5, 27)</div>
                    <div>• Buttons: Approve (GPIO 33), Panic (GPIO 32)</div>
                    <div>• Uno #1: 5V Buzzer (D8), PIR (D2), DHT11 (D4), Servo (D6)</div>
                    <div className="text-amber-400 font-semibold">• 16x2 I2C LCD: DECOMMISSIONED (Telemetry displayed on React console)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ROUTE 7: EVIDENCE & FLIGHT RECORDER (Core Objective 4) */}
          {/* ======================================================== */}
          {currentRoute === 'evidence' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-400" />
                    Forensic Security Flight Recorder
                  </h2>
                  <p className="text-xs text-slate-400">
                    Cryptographically linked SHA-256 event audit chain with independent Laptop B checkpointing
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleToggleTamper}
                    className={`px-3 py-1.5 rounded text-xs font-semibold border flex items-center space-x-1.5 transition-all ${
                      tamperSimulated
                        ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>{tamperSimulated ? 'Revert Tamper Attack' : 'Simulate Log Tampering'}</span>
                  </button>

                  <a
                    href="http://localhost:8000/api/v2/evidence/export/json?correlation_id=*"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1 border border-slate-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export JSON</span>
                  </a>

                  <a
                    href="http://localhost:8000/api/v2/evidence/export/pdf?correlation_id=*"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export PDF Report</span>
                  </a>
                </div>
              </div>

              {/* Cryptographic Verification Banner */}
              <div className={`p-4 rounded-lg border flex items-center justify-between ${
                chainIntegrityValid
                  ? 'bg-teal-950/40 border-teal-800 text-teal-300'
                  : 'bg-red-950/60 border-red-800 text-red-200'
              }`}>
                <div className="flex items-center space-x-3">
                  {chainIntegrityValid ? (
                    <CheckCircle2 className="h-6 w-6 text-teal-400" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-400 animate-pulse" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm">
                      {chainIntegrityValid ? 'Cryptographic Audit-Chain Integrity: VERIFIED [OK]' : 'CRITICAL INTEGRITY BREACH: TAMPER DETECTED [FAIL]'}
                    </h4>
                    <p className="text-xs opacity-80">
                      {chainIntegrityValid
                        ? 'All events link sequentially via SHA-256 hashes matching Laptop B independent checkpoint.'
                        : 'Event hash at index 0 does not match recomputed hash. Log modification detected!'}
                    </p>
                  </div>
                </div>
                <div className="font-mono text-xs text-right">
                  <div>Checkpoints: 2 Anchored</div>
                  <div className="text-[10px] opacity-70">Laptop B Independent Storage</div>
                </div>
              </div>

              {/* Events Chain Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-bold text-white">Immutable Event Timeline</span>
                  <span className="text-slate-500 font-mono">SHA256(prev_hash + canonical_event)</span>
                </div>

                <div className="divide-y divide-slate-800 text-xs font-mono">
                  {events.map((evt) => (
                    <div key={evt.event_id} className="p-4 hover:bg-slate-800/40 transition-colors space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded text-[10px] border border-purple-800/50">
                            {evt.event_source}
                          </span>
                          <span className="font-bold text-white">{evt.event_type}</span>
                          <span className="text-slate-500 text-[11px]">{new Date(evt.timestamp * 1000).toLocaleTimeString()}</span>
                        </div>
                        <span className="text-slate-400 text-[10px]">ID: {evt.event_id}</span>
                      </div>

                      <div className="text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800/80 text-slate-300">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(evt.sanitized_payload, null, 2)}</pre>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-500">
                        <div>
                          <span>Prev Hash: </span>
                          <span className="text-slate-400">{evt.previous_event_hash.slice(0, 28)}...</span>
                        </div>
                        <div className="text-right">
                          <span>Current Hash: </span>
                          <span className="text-teal-400">{evt.current_event_hash.slice(0, 28)}...</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ROUTE 8: SETTINGS & INVARIANTS (Requirement 5) */}
          {/* ======================================================== */}
          {currentRoute === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Environment Settings &amp; Invariant Verifications</h2>
                <p className="text-xs text-slate-400">Formal verification proofs, build hashes, and active contract addresses</p>
              </div>

              {/* 10 Proven Security Invariants */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-400" />
                    10 Formally Tested Invariants (Foundry Invariant Engine)
                  </h3>
                  <span className="text-teal-400 font-mono text-xs">WalletInvariant.t.sol: PASSED</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  {[
                    { id: 'INV-1', name: 'No Unauthorized Outflow', desc: 'Protected tokens move only through verified owner or active session.' },
                    { id: 'INV-2', name: 'Daily Agent Limit Bound', desc: 'Agent-authorized payments cannot exceed daily cap under any sequence.' },
                    { id: 'INV-3', name: 'Expired/Revoked Agent Block', desc: 'Revoked, frozen or expired sessions cannot execute payments.' },
                    { id: 'INV-4', name: '3-of-5 Guardian Quorum', desc: 'Recovery cannot complete with fewer than 3 distinct guardian approvals.' },
                    { id: 'INV-5', name: '48-Hour Timelock Integrity', desc: 'Recovery cannot execute before 48 hours after quorum reached.' },
                    { id: 'INV-6', name: 'Owner Veto Absolute Block', desc: 'Vetoed recovery proposals can never be executed or replayed.' },
                    { id: 'INV-7', name: 'Paymaster Sponsorship Isolation', desc: 'Agent A gas consumption cannot drain Agent B allocated pool.' },
                    { id: 'INV-8', name: 'Alternative-Path Resistance', desc: 'Unsupported calls, approvals, and delegates rejected without transfer.' },
                    { id: 'INV-9', name: 'Nonce Replay Resistance', desc: 'UserOperations and exception authorizations are strictly single-use.' },
                    { id: 'INV-10', name: 'Session Invalidation on Recovery', desc: 'Old agent keys automatically invalidated upon ownership rotation.' },
                  ].map((inv) => (
                    <div key={inv.id} className="p-3 bg-slate-950 rounded border border-slate-800/80 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-300 font-bold">{inv.id}: {inv.name}</span>
                        <span className="text-teal-400 text-[10px]">VERIFIED (✓)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans">{inv.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Protocol Configurations */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3 font-mono text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Release Version:</span>
                  <span className="text-purple-300 font-bold">BASTION X v2.3</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">ERC-4337 EntryPoint:</span>
                  <span className="text-white">0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789 (v0.6.0)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Local RPC URL:</span>
                  <span className="text-teal-400">http://127.0.0.1:8545 (Chain 31337)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Risk Circuit Breaker:</span>
                  <span className="text-slate-300">RiskCircuitBreaker.sol (Velocity: 3 in 60s, Burst: 70% in 5m)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Paymaster Architecture:</span>
                  <span className="text-slate-300">QuotaPaymaster.sol (Isolated EntryPoint Deposits)</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [simulation, setSimulation] = useState(false);
  return <>
    <div style={{ background: simulation ? '#78350f' : '#0f172a', color: '#fff', padding: '10px 20px' }}>
      <strong>{simulation ? 'SIMULATION: all dashboard values, approvals, attacks and receipts below are synthetic.' : 'LOCAL TESTNET: live API results; hardware acceptance remains unverified.'}</strong>
      <button style={{ marginLeft: 20 }} onClick={() => setSimulation(!simulation)}>
        {simulation ? 'Return to live acceptance' : 'Open labeled simulation console'}
      </button>
    </div>
    {simulation ? <SimulationConsole /> : <LiveAcceptance />}
  </>;
}
