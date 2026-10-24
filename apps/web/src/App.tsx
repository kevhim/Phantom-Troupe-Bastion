import React, { useState } from 'react';
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
  Eye,
  EyeOff,
  ChevronRight,
  Fingerprint
} from 'lucide-react';
import {
  RouteId,
  HardwareHealthState,
  RevocationState,
  ApprovalStatus,
  ApprovalQueueItem,
  ForensicEvent
} from './types';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<RouteId>('overview');
  const [overallHealth, setOverallHealth] = useState<HardwareHealthState>('HEALTHY');
  const [revocationState, setRevocationState] = useState<RevocationState>('IDLE');
  const [isApprovalLocked, setIsApprovalLocked] = useState<boolean>(false);
  const [requiresRecovery, setRequiresRecovery] = useState<boolean>(false);
  const [recoveryReason, setRecoveryReason] = useState<string>('');
  const [mirageActive, setMirageActive] = useState<boolean>(false);

  const dailySpent = 25;
  const dailyCap = 100;
  const maxPerTx = 50;

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

  // Selected approval for detailed physical review
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

  // Hardware Components (Two-Laptop Architecture)
  const [components, setComponents] = useState<Record<string, { state: string; mandatory: boolean; laptop: 'A' | 'B'; desc: string }>>({
    // Laptop B — Trusted Security & Authorization Domain
    esp32_signer: { state: 'HEALTHY', mandatory: true, laptop: 'B', desc: 'ESP32 #1 Dedicated Signer (OLED #1)' },
    rfid_reader: { state: 'HEALTHY', mandatory: true, laptop: 'B', desc: 'RC522 SPI RFID Reader' },
    approval_button: { state: 'HEALTHY', mandatory: true, laptop: 'B', desc: 'GPIO33 Physical Approve Button' },
    panic_button: { state: 'HEALTHY', mandatory: true, laptop: 'B', desc: 'GPIO32 Physical Panic Button' },
    gateway_b: { state: 'HEALTHY', mandatory: true, laptop: 'B', desc: 'Laptop B Hardware Serial Gateway' },
    uno_q_edge: { state: 'HEALTHY', mandatory: true, laptop: 'B', desc: 'Arduino UNO Q 4GB Edge Security Node' },
    uno_sensors: { state: 'HEALTHY', mandatory: false, laptop: 'B', desc: 'Arduino Uno #1 (PIR, DHT11, 16x2 LCD)' },
    blockchain_node: { state: 'HEALTHY', mandatory: true, laptop: 'B', desc: 'Local Anvil Blockchain & Bundler (:8545)' },
    // Laptop A — Application & Operator Domain
    esp32_telemetry: { state: 'HEALTHY', mandatory: false, laptop: 'A', desc: 'ESP32 #2 Operator Telemetry OLED #2' },
    uno_watchdog: { state: 'HEALTHY', mandatory: false, laptop: 'A', desc: 'Arduino Uno #2 Watchdog / Fault Tester' },
    esp8266_buzzer: { state: 'HEALTHY', mandatory: false, laptop: 'A', desc: 'ESP8266 Remote Wi-Fi Buzzer Node' },
    camera: { state: 'HEALTHY', mandatory: false, laptop: 'A', desc: 'Webcam Face & Liveness Verification' },
  });

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

      // Cancel pending approvals
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
    // Check if any mandatory is still disconnected
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

    // Simulate direct RPC on-chain broadcast progress
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
      {/* 1. AppSidebar (Shell Widget #1) */}
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
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono">v2.1</span>
              </h1>
              <p className="text-xs text-slate-400">W3-02 Agent Wallet</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'overview', label: 'Command Overview', icon: Activity },
              { id: 'agent', label: 'Agent Workbench', icon: Bot },
              { id: 'wallet', label: 'Smart Account & Policy', icon: Wallet },
              { id: 'approvals', label: 'Physical Approvals', icon: Fingerprint, badge: approvals.filter(a => a.status !== 'CONFIRMED' && a.status !== 'CANCELLED').length },
              { id: 'security', label: 'Security SOC', icon: AlertTriangle, alert: isApprovalLocked },
              { id: 'hardware', label: 'Devices & Topology', icon: Cpu },
              { id: 'evidence', label: 'Flight Recorder', icon: FileText },
              { id: 'settings', label: 'Settings & Config', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentRoute(item.id as RouteId)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-amber-500/20 text-amber-300 font-mono text-[10px] px-1.5 py-0.5 rounded-full border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                  {item.alert && (
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* AuditFooter (Shell Widget #6) */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono space-y-1">
          <div className="flex justify-between">
            <span>Arch:</span>
            <span className="text-slate-400">v2.2 Distributed</span>
          </div>
          <div className="flex justify-between">
            <span>Chain Host:</span>
            <span className="text-purple-400">Laptop B (31337)</span>
          </div>
          <div className="flex justify-between">
            <span>Signer:</span>
            <span className="text-teal-400">ESP32#1 on Laptop B</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 2. GlobalTopbar (Shell Widget #2) */}
        <header className="h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs">
            <span className="font-mono text-slate-400">Account:</span>
            <span className="font-mono bg-slate-800 text-slate-200 px-2 py-1 rounded border border-slate-700">
              0x00000000000000000000000000000000000000bb
            </span>
            <span className="flex items-center space-x-1.5 text-slate-400">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              <span>Laptop A (RTX 5060) App: Online</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-400">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              <span>Laptop B (Ultra 7) Auth & Chain: Online (:8545)</span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Panic Trigger */}
            <button
              onClick={handleTriggerPanic}
              className="bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm shadow-red-950"
            >
              <AlertOctagon className="h-3.5 w-3.5 text-red-400" />
              <span>PANIC LOCK</span>
            </button>

            {/* Mirage Toggle */}
            <button
              onClick={() => setMirageActive(!mirageActive)}
              className={`px-3 py-1.5 rounded text-xs font-medium border flex items-center space-x-1.5 transition-all ${
                mirageActive
                  ? 'bg-purple-600/25 border-purple-500 text-purple-200'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {mirageActive ? <EyeOff className="h-3.5 w-3.5 text-purple-400" /> : <Eye className="h-3.5 w-3.5 text-slate-400" />}
              <span>{mirageActive ? 'MIRAGE: DECOY ACTIVE' : 'MIRAGE: DISABLED'}</span>
            </button>
          </div>
        </header>

        {/* 3. EnvironmentModeStrip (Shell Widget #3) */}
        <div className="bg-slate-900 border-b border-slate-800/80 px-6 py-1 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center space-x-3">
            <span className="text-teal-400 flex items-center space-x-1">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              <span>LOCAL TESTNET (ANVIL)</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">ERC-4337 ENTRYPOINT: v0.6.0</span>
            <span className="text-slate-600">|</span>
            <span className="text-purple-400">DUAL AUTH: STRICT OWNER MODE</span>
          </div>
          {mirageActive && (
            <span className="text-purple-400 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded font-bold animate-pulse">
              [DECEPTION SANDBOX ACTIVE — FAKE BALANCES]
            </span>
          )}
        </div>

        {/* 4. GlobalIncidentBanner (Shell Widget #4) */}
        {(isApprovalLocked || requiresRecovery) && (
          <div className="bg-red-950/80 border-b border-red-800/60 px-6 py-2 flex items-center justify-between text-xs text-red-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400 animate-bounce" />
              <span className="font-bold">SECURITY ALERT:</span>
              <span>{recoveryReason || 'Physical authorization locked. Pending requests invalidated.'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-red-900/60 text-red-300 px-2 py-0.5 rounded border border-red-700/50 font-mono text-[10px]">
                REVOCATION STATE: {revocationState}
              </span>
              <button
                onClick={handleSupervisorRecovery}
                className="bg-red-800 hover:bg-red-700 text-white px-2.5 py-1 rounded text-xs font-semibold"
              >
                Supervisor Recovery
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
                  <h2 className="text-xl font-bold text-white">Command Overview</h2>
                  <p className="text-xs text-slate-400">Live smart account telemetry and hardware security posture</p>
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
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">Resets UTC 00:00 (block.timestamp / 86400)</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Max Per Transaction</div>
                  <div className="text-2xl font-bold font-mono text-white">{maxPerTx}.00 <span className="text-xs font-normal text-slate-400">bUSD</span></div>
                  <p className="text-[10px] text-teal-400 mt-1">On-chain enforced cap</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Hardware Signer #1</div>
                  <div className="flex items-center space-x-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${isApprovalLocked ? 'bg-red-500' : 'bg-teal-400'}`} />
                    <span className="font-bold text-sm text-white">{overallHealth}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">ESP32 SPI/I2C/GPIO Direct</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Flight Recorder Chain</div>
                  <div className="flex items-center space-x-2">
                    {chainIntegrityValid ? (
                      <CheckCircle2 className="h-4 w-4 text-teal-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`font-bold text-sm ${chainIntegrityValid ? 'text-teal-400' : 'text-red-400'}`}>
                      {chainIntegrityValid ? 'INTEGRITY VERIFIED' : 'TAMPER DETECTED'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">{events.length} chained events</p>
                </div>
              </div>

              {/* Two-Laptop Distributed Host Status Grid */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Radio className="h-4 w-4 text-purple-400" />
                    Distributed Host Cluster Allocation (BASTION X v2.2)
                  </h3>
                  <span className="text-[11px] font-mono text-teal-400 flex items-center space-x-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    <span>2-Node Active Ring</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs">
                  {/* Laptop A Card */}
                  <div className="bg-slate-950 p-4 rounded border border-purple-900/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-purple-300">Laptop A — RTX 5060</span>
                      <span className="text-[10px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded font-mono">App Host</span>
                    </div>
                    <p className="text-[11px] text-slate-400">FastAPI Backend, AI Agent, OpenCV Vision, Mirage Engine, SQLite DB</p>
                    <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800 space-y-0.5">
                      <div>Devices: ESP32 #2, Uno #2, ESP8266, Cam</div>
                      <div className="text-teal-400">Status: ONLINE (Port 8000 / 5173)</div>
                    </div>
                  </div>

                  {/* Laptop B Card */}
                  <div className="bg-slate-950 p-4 rounded border border-teal-900/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-teal-300">Laptop B — Intel Ultra 7</span>
                      <span className="text-[10px] bg-teal-900/40 text-teal-300 px-1.5 py-0.5 rounded font-mono">Security Host</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Local Anvil Blockchain (:8545), Bundler, ESP32 Signer, UNO Q Edge Node</p>
                    <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800 space-y-0.5">
                      <div>Devices: ESP32 #1, UNO Q, Uno #1, RC522</div>
                      <div className="text-teal-400">Blockchain: Anvil 31337 Online</div>
                    </div>
                  </div>

                  {/* Laptop C Card */}
                  <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-300">Laptop C — RTX 4060</span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">Standby</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Independent testnet RPC mirror & backup compute station</p>
                    <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800 space-y-0.5">
                      <div>Hardware: No mandatory units assigned</div>
                      <div className="text-amber-400/80">Role: Hot-Standby Failover</div>
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
          {/* ROUTE 2: PHYSICAL APPROVALS (Core Objective 1) */}
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
                    Hardware-assisted authorization using ESP32 #1, directly wired OLED, RC522 RFID reader, and GPIO confirmation button.
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
                        <span>Simulate Next Step: {selectedApproval?.status}</span>
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
                        OLED #1 Display Replica (Laptop B)
                      </h3>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">SSD1306 128x64</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Read-only reflection of the actual physical OLED screen wired to ESP32 #1 GPIO21/22.
                    </p>

                    {/* OLED Screen Box */}
                    <div className="bg-black border-4 border-slate-800 rounded-md p-4 font-mono text-cyan-400 text-xs shadow-inner h-44 flex flex-col justify-between select-none">
                      <div className="border-b border-cyan-800/60 pb-1 flex justify-between text-[10px]">
                        <span>BASTION X OLED #1</span>
                        <span>REVIEW 1/4</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div>TOKEN: bUSD (6 dec)</div>
                        <div className="text-sm font-bold text-white">
                          AMT: {((selectedApproval?.intent.amountBaseUnits || 0) / 10**6).toFixed(2)} bUSD
                        </div>
                        <div className="text-[10px] text-cyan-300">RECIP: 0x00...00cc</div>
                        <div className="text-[10px] text-cyan-500">FP: a7f4bc89 | T: JUNIOR</div>
                      </div>
                      <div className="border-t border-cyan-800/60 pt-1 text-[10px] flex justify-between text-cyan-300">
                        <span>GPIO33: APPROVE</span>
                        <span>GPIO32: PANIC</span>
                      </div>
                    </div>
                  </div>

                  {/* Signatures status */}
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-xs">
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
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ROUTE 3: SECURITY SOC (Core Objective 2) */}
          {/* ======================================================== */}
          {currentRoute === 'security' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    Security Operations Center (SOC) & Containment
                  </h2>
                  <p className="text-xs text-slate-400">
                    Real-time hardware-health matrix, fail-closed approval state, and emergency panic revocation
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                    overallHealth === 'HEALTHY' ? 'bg-teal-950/60 border-teal-700 text-teal-300' : 'bg-red-950/60 border-red-700 text-red-300'
                  }`}>
                    STATE: {overallHealth}
                  </span>
                </div>
              </div>

              {/* Hardware-Health Matrix (Partitioned Across Laptop B & Laptop A) */}
              <div className="space-y-4">
                {/* Laptop B Group */}
                <div className="bg-slate-900 border border-teal-900/60 rounded-lg p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-teal-300 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-teal-400" />
                      Laptop B — Trusted Security & Authorization Domain (Intel Ultra 7)
                    </h3>
                    <span className="text-xs text-teal-400 font-mono">
                      {Object.values(components).filter(c => c.laptop === 'B' && c.state === 'HEALTHY').length} / {Object.values(components).filter(c => c.laptop === 'B').length} Online
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-xs">
                    {Object.entries(components).filter(([_, comp]) => comp.laptop === 'B').map(([name, comp]) => {
                      const isHealthy = comp.state === 'HEALTHY';
                      return (
                        <div
                          key={name}
                          className={`p-3 rounded border flex flex-col justify-between ${
                            isHealthy
                              ? 'bg-slate-950/70 border-teal-950 text-slate-300'
                              : 'bg-red-950/30 border-red-800/60 text-red-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-mono font-bold uppercase">{name.replace('_', ' ')}</span>
                            <span className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-teal-400' : 'bg-red-500 animate-pulse'}`} />
                          </div>
                          <p className="text-[10px] text-slate-400 mb-2 truncate" title={comp.desc}>{comp.desc}</p>
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                            <span>{comp.mandatory ? 'MANDATORY' : 'AUXILIARY'}</span>
                            <span className={isHealthy ? 'text-teal-400' : 'text-red-400 font-bold'}>{comp.state}</span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-800/80 flex space-x-1">
                            {isHealthy ? (
                              <button
                                onClick={() => handleDisconnect(name)}
                                className="w-full bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-300 py-1 rounded text-[10px]"
                              >
                                Disconnect
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

                {/* Laptop A Group */}
                <div className="bg-slate-900 border border-purple-900/60 rounded-lg p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-purple-400" />
                      Laptop A — Application & Operator Domain (NVIDIA RTX 5060)
                    </h3>
                    <span className="text-xs text-purple-400 font-mono">
                      {Object.values(components).filter(c => c.laptop === 'A' && c.state === 'HEALTHY').length} / {Object.values(components).filter(c => c.laptop === 'A').length} Online
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-xs">
                    {Object.entries(components).filter(([_, comp]) => comp.laptop === 'A').map(([name, comp]) => {
                      const isHealthy = comp.state === 'HEALTHY';
                      return (
                        <div
                          key={name}
                          className={`p-3 rounded border flex flex-col justify-between ${
                            isHealthy
                              ? 'bg-slate-950/70 border-purple-950 text-slate-300'
                              : 'bg-red-950/30 border-red-800/60 text-red-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-mono font-bold uppercase">{name.replace('_', ' ')}</span>
                            <span className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-teal-400' : 'bg-red-500 animate-pulse'}`} />
                          </div>
                          <p className="text-[10px] text-slate-400 mb-2 truncate" title={comp.desc}>{comp.desc}</p>
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                            <span>{comp.mandatory ? 'MANDATORY' : 'AUXILIARY'}</span>
                            <span className={isHealthy ? 'text-teal-400' : 'text-red-400 font-bold'}>{comp.state}</span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-800/80 flex space-x-1">
                            {isHealthy ? (
                              <button
                                onClick={() => handleDisconnect(name)}
                                className="w-full bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-300 py-1 rounded text-[10px]"
                              >
                                Disconnect
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

              {/* Emergency Revocation & Panic Console */}
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
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Independent RPC Route:</span>
                      <span className="text-purple-300">http://192.168.1.100:8545 (Laptop B)</span>
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

                {/* Mirage Status Box */}
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
                    <div className="flex justify-between">
                      <span className="text-slate-400">Decoy Customer Ledger:</span>
                      <span className="text-slate-300">Synthetic Honeypot Alpha ($12.50)</span>
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
          {/* ROUTE 4: EVIDENCE & FLIGHT RECORDER (Core Objective 4) */}
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
          {/* ROUTE 5: HARDWARE TOPOLOGY */}
          {/* ======================================================== */}
          {currentRoute === 'hardware' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Hardware Topology & Controller Register</h2>
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
                    <div>• ESP32 #2 + OLED #2 (Operator Telemetry SDA 21, SCL 22)</div>
                    <div>• Arduino Uno #2 (Watchdog / Fault Simulator)</div>
                    <div>• ESP8266 NodeMCU (Buzzer D1/GPIO5, LED D4/GPIO2)</div>
                    <div className="text-amber-400/90 text-[10px] pt-1 border-t border-slate-800">⚠️ NO SIGNING KEYS STORED ON LAPTOP A</div>
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
                    <div className="text-teal-400 font-bold">• ESP32 #1 Dedicated Signer (OLED #1 21/22)</div>
                    <div>• RC522 RFID SPI (SCK 18, MISO 19, MOSI 23, SS 5, RST 27)</div>
                    <div>• GPIO33 Approve Button (Sustained Press)</div>
                    <div>• GPIO32 Panic Button (Interrupt + Direct RPC Revoke)</div>
                    <div>• Arduino UNO Q 4GB (Linux Edge Gateway & Telemetry)</div>
                    <div>• Arduino Uno #1 (PIR D2, DHT11 D4, LCD A4/A5, Servo D6)</div>
                    <div className="text-teal-400 text-[10px] pt-1 border-t border-slate-800">🔒 Anvil Blockchain (31337) & Bundler on Laptop B</div>
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

              {/* Pin Assignment Matrix */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-purple-400" />
                  Official Hardware Pinout & Wiring Specifications (v2.2)
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-slate-950 p-4 rounded border border-teal-900/40 space-y-2">
                    <span className="font-bold text-teal-300">Laptop B — ESP32 #1 Physical Signer Pins</span>
                    <div className="space-y-1 text-slate-400 text-[11px]">
                      <div className="flex justify-between"><span>RC522 SPI SCK:</span><span className="text-white">GPIO 18</span></div>
                      <div className="flex justify-between"><span>RC522 SPI MISO:</span><span className="text-white">GPIO 19</span></div>
                      <div className="flex justify-between"><span>RC522 SPI MOSI:</span><span className="text-white">GPIO 23</span></div>
                      <div className="flex justify-between"><span>RC522 SPI SS (SDA):</span><span className="text-white">GPIO 5</span></div>
                      <div className="flex justify-between"><span>RC522 RST:</span><span className="text-white">GPIO 27</span></div>
                      <div className="flex justify-between"><span>OLED #1 SDA:</span><span className="text-white">GPIO 21 (3.3V I2C, 0x3C)</span></div>
                      <div className="flex justify-between"><span>OLED #1 SCL:</span><span className="text-white">GPIO 22</span></div>
                      <div className="flex justify-between"><span>Approval Button:</span><span className="text-teal-400">GPIO 33 (INPUT_PULLUP)</span></div>
                      <div className="flex justify-between"><span>Panic Button:</span><span className="text-red-400">GPIO 32 (INPUT_PULLUP)</span></div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded border border-purple-900/40 space-y-2">
                    <span className="font-bold text-purple-300">Secondary Nodes & Peripherals</span>
                    <div className="space-y-1 text-slate-400 text-[11px]">
                      <div className="flex justify-between"><span>ESP32 #2 (Laptop A) OLED #2 SDA:</span><span className="text-white">GPIO 21</span></div>
                      <div className="flex justify-between"><span>ESP32 #2 (Laptop A) OLED #2 SCL:</span><span className="text-white">GPIO 22</span></div>
                      <div className="flex justify-between"><span>ESP8266 (Laptop A) Active Buzzer:</span><span className="text-white">D1 (GPIO 5)</span></div>
                      <div className="flex justify-between"><span>ESP8266 (Laptop A) Status LED:</span><span className="text-white">D4 (GPIO 2)</span></div>
                      <div className="flex justify-between"><span>Arduino Uno #1 (Laptop B) PIR:</span><span className="text-white">D2</span></div>
                      <div className="flex justify-between"><span>Arduino Uno #1 (Laptop B) DHT11:</span><span className="text-white">D4</span></div>
                      <div className="flex justify-between"><span>Arduino Uno #1 (Laptop B) LCD:</span><span className="text-white">A4 (SDA) / A5 (SCL)</span></div>
                      <div className="flex justify-between"><span>Arduino Uno #2 (Laptop A) Heartbeat:</span><span className="text-white">Pin 13 (Watchdog)</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ROUTE 6: WALLET & POLICIES */}
          {/* ======================================================== */}
          {currentRoute === 'wallet' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Smart Account & Six W3-02 Wallet Policies</h2>
                <p className="text-xs text-slate-400">On-chain spending restrictions enforced directly by BastionAccount.sol</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white">The Six Enforced Policy Dimensions</h3>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                      <span className="text-purple-400 font-bold">1. Allowed Target Contract:</span>
                      <div className="text-slate-300 text-[11px] mt-0.5">0x00000000000000000000000000000000000000aa (MockToken)</div>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                      <span className="text-purple-400 font-bold">2. Allowed Function Selector:</span>
                      <div className="text-slate-300 text-[11px] mt-0.5">0xa9059cbb (transfer(address,uint256))</div>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                      <span className="text-purple-400 font-bold">3. Allowed Recipient Address:</span>
                      <div className="text-slate-300 text-[11px] mt-0.5">0x00000000000000000000000000000000000000cc (MockVendor)</div>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                      <span className="text-purple-400 font-bold">4. Max Amount Per Payment:</span>
                      <div className="text-slate-300 text-[11px] mt-0.5">{maxPerTx}.00 bUSD</div>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                      <span className="text-purple-400 font-bold">5. Daily UTC Spending Limit:</span>
                      <div className="text-slate-300 text-[11px] mt-0.5">{dailyCap}.00 bUSD (Current spend: {dailySpent}.00 bUSD)</div>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                      <span className="text-purple-400 font-bold">6. Session Expiry:</span>
                      <div className="text-slate-300 text-[11px] mt-0.5">Active (Valid for 48 hours)</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white">Exception Role Ceilings (RFID Tiers)</h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                      <div className="flex justify-between font-bold text-amber-300">
                        <span>Card 1: Junior Exception Tier</span>
                        <span>Cap: 2,000 bUSD</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">Enforces physical OLED review + Junior RFID + GPIO33 + Owner co-signature.</p>
                    </div>

                    <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                      <div className="flex justify-between font-bold text-purple-300">
                        <span>Card 2: Senior Exception Tier</span>
                        <span>Cap: 10,000 bUSD</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">Enforces physical OLED review + Senior RFID + GPIO33 + Owner co-signature.</p>
                    </div>

                    <div className="p-3 bg-red-950/30 rounded border border-red-800/50 space-y-1">
                      <div className="flex justify-between font-bold text-red-300">
                        <span>Revoker Role (Direct Wi-Fi Panic)</span>
                        <span>Cap: 0 bUSD (Revoke Only)</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">Authorized strictly to disable agent sessions on chain; holds zero token transfer authority.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ROUTE 7: AGENT WORKBENCH */}
          {/* ======================================================== */}
          {currentRoute === 'agent' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Agent Workbench & Payment Composer</h2>
                <p className="text-xs text-slate-400">AI purchasing agent request generator and policy compliance testing</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white">Autonomous Payment Request</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Target Vendor:</label>
                      <input
                        type="text"
                        readOnly
                        value="0x00000000000000000000000000000000000000cc (MockVendor)"
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Payment Amount (bUSD):</label>
                      <input
                        type="number"
                        defaultValue={25}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
                      />
                    </div>
                    <div className="pt-2 flex space-x-3">
                      <button
                        onClick={() => alert('Simulated payment request submitted within policy limits!')}
                        className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2 rounded text-xs"
                      >
                        Send In-Policy (25 bUSD)
                      </button>
                      <button
                        onClick={() => alert('Out-of-policy payment (250 bUSD) queued for ESP32 hardware review!')}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 rounded text-xs"
                      >
                        Send Out-of-Policy (250 bUSD)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
                  <h3 className="text-sm font-bold text-white">Advisory Policy Precheck</h3>
                  <p className="text-xs text-slate-400">Local preflight simulation before blockchain UserOperation broadcast:</p>
                  <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
                    <div className="text-teal-400">✓ Target: 0x00...aa allowed</div>
                    <div className="text-teal-400">✓ Function: transfer(address,uint256) allowed</div>
                    <div className="text-teal-400">✓ Recipient: 0x00...cc allowed</div>
                    <div className="text-teal-400">✓ Per-tx check: 25.00 &lt;= 50.00 bUSD</div>
                    <div className="text-teal-400">✓ Daily cap check: 25 + 25 &lt;= 100.00 bUSD</div>
                    <div className="text-teal-400">✓ Session: Active &amp; Not Revoked</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ROUTE 8: SETTINGS */}
          {/* ======================================================== */}
          {currentRoute === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Environment Settings & Build Hashes</h2>
                <p className="text-xs text-slate-400">Configuration and protocol verifications</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3 font-mono text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Release Version:</span>
                  <span className="text-purple-300 font-bold">BASTION X v2.1</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">EIP-712 Domain:</span>
                  <span className="text-white">BastionX v2 (Chain 31337)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Strict Owner Cosign Mode:</span>
                  <span className="text-teal-400">ENABLED (W3-02 Conservative Compliance)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Local RPC URL:</span>
                  <span className="text-slate-300">http://127.0.0.1:8545</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Audit Checkpoint Path:</span>
                  <span className="text-slate-300">artifacts/checkpoints/</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
