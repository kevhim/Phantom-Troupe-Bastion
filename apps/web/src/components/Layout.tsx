import React, { useState } from 'react';
import { useBastionStore } from '../store/useBastionStore';
import {
  Shield,
  ChevronRight,
  UserCheck,
  Copy,
  Check,
  Activity,
  Clock,
  ShieldAlert,
  RefreshCw,
  X,
  Cpu,
  GitCommit,
  FileCode2,
  Blocks,
  Sparkles,
  ArrowRight,
  RotateCcw,
  ExternalLink,
  CheckSquare,
  QrCode
} from 'lucide-react';

// ─── View type ───────────────────────────────────────────────────────
export type ViewId = 'dashboard' | 'approvals' | 'security' | 'settings';

interface LayoutProps {
  currentView: ViewId;
  onViewChange: (view: ViewId) => void;
  children: React.ReactNode;
}

// ─── Nav definition ──────────────────────────────────────────────────
const NAV_ITEMS: { id: ViewId; index: string; label: string }[] = [
  { id: 'dashboard',  index: '01', label: 'Command Dashboard' },
  { id: 'approvals',  index: '02', label: 'Hardware Approvals' },
  { id: 'security',   index: '03', label: 'Security & Devices' },
  { id: 'settings',   index: '04', label: 'Configuration' },
];

// ─── Layout ──────────────────────────────────────────────────────────
export const Layout: React.FC<LayoutProps> = ({ currentView, onViewChange, children }) => {
  const {
    smartAccountAddress,
    rpcPingMs,
    dailyResetUtc,
    userRole,
    setUserRole,
    approvalQueue,
    toggleApprovalDrawer,
    isApprovalDrawerOpen,
    selectApprovalForReview,
    refreshBalances,
    environmentMode,
    setEnvironmentMode,
    toggleDemoFixtures,
    emergencyState,
    panicTimestampUtc,
    resetEmergencyState,
    riskLevel,
    lastAnchoredBlock,
  } = useBastionStore();

  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [utcTime, setUtcTime] = useState(() => {
    const now = new Date();
    return now.toUTCString().replace('GMT', 'UTC').split(' ')[4] + ' UTC';
  });

  React.useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC').split(' ')[4] + ' UTC');
    };
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(smartAccountAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pendingApprovals = approvalQueue.length;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans overflow-x-hidden">
      {/* ───── 1. Environment Strip ───── */}
      <div className={`w-full py-1.5 px-6 text-xs font-mono flex items-center justify-between border-b-2 border-black bg-white select-none ${
        environmentMode === 'SIMULATED_MIRAGE' ? 'hazard-stripes' : ''
      }`}>
        <div className="flex items-center space-x-3">
          <span className={`w-2 h-2 inline-block ${
            environmentMode === 'SIMULATED_MIRAGE' ? 'bg-[#c90000] animate-pulse' : 'bg-black'
          }`} />
          <span className="font-bold tracking-[0.12em] text-[11px] uppercase text-black">ENV:</span>
          <span className={`px-2 py-0.5 text-[11px] font-bold tracking-wider ${
            environmentMode === 'SIMULATED_MIRAGE'
              ? 'bg-[#c90000] text-white'
              : environmentMode === 'OFFLINE_DISCONNECTED'
              ? 'bg-surface text-black border border-black'
              : 'bg-black text-white'
          }`}>
            {environmentMode === 'LOCAL_TESTNET' ? 'ANVIL 31337' : 
             environmentMode === 'SIMULATED_MIRAGE' ? 'MIRAGE MODE' : 'OFFLINE'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={environmentMode}
            onChange={(e) => setEnvironmentMode(e.target.value as any)}
            aria-label="Select environment mode"
            className="bg-white border-2 border-black text-black text-[11px] font-bold px-2 py-0.5 uppercase tracking-wider focus:outline-none"
          >
            <option value="LOCAL_TESTNET">Chain 31337</option>
            <option value="SIMULATED_MIRAGE">Mirage</option>
            <option value="OFFLINE_DISCONNECTED">Offline</option>
          </select>
          <button
            onClick={toggleDemoFixtures}
            className="flex items-center space-x-1 px-2 py-0.5 bg-surface hover:bg-black hover:text-white text-black border-2 border-black font-bold text-[11px] uppercase tracking-wider transition-none"
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">Fixtures</span>
          </button>
        </div>
      </div>

      {/* ───── 2. Global Topbar ───── */}
      <header className="h-14 bg-white border-b-2 border-black px-6 flex items-center justify-between text-xs font-mono select-none">
        <div className="flex items-center space-x-3">
          <div className="flex items-center border-2 border-black bg-surface">
            <span className="px-2 py-1 text-[11px] font-sans font-bold uppercase tracking-[0.12em] bg-black text-white">
              ACCT
            </span>
            <span className="px-2.5 py-1 text-black font-mono font-bold text-xs tracking-wider">
              {smartAccountAddress.substring(0, 6)}...{smartAccountAddress.substring(smartAccountAddress.length - 4)}
            </span>
            <button
              onClick={handleCopy}
              title="Copy Full Smart Account Address"
              className="p-1.5 border-l-2 border-black hover:bg-black hover:text-white text-black transition-none"
            >
              {copied ? <Check className="w-3 h-3 text-[#c90000]" /> : <Copy className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setShowQr(true)}
              title="Show Address QR"
              className="p-1.5 border-l-2 border-black hover:bg-black hover:text-white text-black transition-none"
            >
              <QrCode className="w-3 h-3" />
            </button>
          </div>

          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 border-2 border-black bg-white font-mono text-[11px]">
            <Activity className="w-3 h-3 text-black" />
            <span className="font-bold">{rpcPingMs}MS</span>
          </div>

          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 border-2 border-black bg-surface font-mono text-[11px]">
            <Clock className="w-3 h-3 text-black" />
            <span className="font-bold text-black">{utcTime}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={refreshBalances}
            title="Refresh Balances & Ping"
            className="p-1.5 border-2 border-black bg-white hover:bg-black hover:text-white text-black transition-none"
          >
            <RefreshCw className="w-3 h-3" />
          </button>

          <div className="flex border-2 border-black">
            <button
              onClick={() => setUserRole('OPERATOR')}
              className={`px-2.5 py-1 text-[11px] font-sans font-bold uppercase tracking-[0.12em] transition-none ${
                userRole === 'OPERATOR' ? 'bg-black text-white' : 'bg-white text-black hover:bg-surface'
              }`}
            >
              Oper
            </button>
            <button
              onClick={() => setUserRole('SUPERVISOR')}
              className={`px-2.5 py-1 text-[11px] font-sans font-bold uppercase tracking-[0.12em] border-l-2 border-black transition-none ${
                userRole === 'SUPERVISOR' ? 'bg-black text-white' : 'bg-white text-black hover:bg-surface'
              }`}
            >
              Supv
            </button>
          </div>

          <button
            onClick={() => toggleApprovalDrawer()}
            className="relative flex items-center space-x-1.5 px-2.5 py-1 border-2 border-black bg-white hover:bg-black hover:text-white text-black font-bold uppercase tracking-wider text-[11px] transition-none"
          >
            <ShieldAlert className="w-3 h-3 text-[#c90000]" />
            <span className="hidden sm:inline">Queue</span>
            {pendingApprovals > 0 && (
              <span className="px-1 py-0 bg-[#c90000] text-white font-mono font-bold text-[10px]">
                {pendingApprovals}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ───── 3. Emergency Banner ───── */}
      {emergencyState !== 'NORMAL' && (
        <div className="w-full py-2.5 px-6 border-b-2 border-black bg-[#c90000] text-white font-mono text-xs flex items-center justify-between select-none">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-white shrink-0" />
            <div>
              <span className="font-extrabold text-sm tracking-[0.12em] uppercase text-white font-sans">
                EMERGENCY:
              </span>{' '}
              <span className="px-2 py-0.5 font-bold text-xs bg-black text-white border border-white">
                {emergencyState}
              </span>
              <p className="text-[11px] text-white font-sans mt-0.5">
                GPIO32 panic at {panicTimestampUtc || 'recently'}. Signing halted.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewChange('security')}
              className="flex items-center space-x-1 px-3 py-1.5 bg-black text-white hover:bg-white hover:text-black font-sans font-bold text-xs uppercase tracking-wider transition-none border-2 border-black"
            >
              <span>Inspect</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={resetEmergencyState}
              title="Reset emergency (demo)"
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-white text-black hover:bg-black hover:text-white border-2 border-black text-xs font-bold uppercase transition-none"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* ───── 4. Main Body ───── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Index Rail */}
        <aside className="w-56 bg-white border-r-2 border-black flex flex-col justify-between h-[calc(100vh-5.5rem)] select-none shrink-0">
          <div>
            <div className="p-4 border-b-2 border-black bg-white">
              <div className="flex items-center space-x-2.5 mb-1.5">
                <div className="w-7 h-7 bg-black flex items-center justify-center text-white">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="font-sans font-extrabold text-lg tracking-tight text-black">BASTION</span>
                  <span className="font-mono text-[10px] font-bold px-1 py-0 bg-black text-white">X V2</span>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-muted pt-1 border-t border-rule-light">
                <span className={`w-1.5 h-1.5 ${
                  riskLevel === 'TRUSTED' ? 'bg-black' :
                  riskLevel === 'SUSPICIOUS' ? 'bg-[#c90000]' : 'bg-[#c90000] animate-pulse'
                }`} />
                <span>POSTURE: <strong className="text-black font-bold">{riskLevel}</strong></span>
              </div>
            </div>

            <nav className="p-0 divide-y-2 divide-black">
              {NAV_ITEMS.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-none ${
                      isActive
                        ? 'bg-black text-white font-bold'
                        : 'bg-white text-black hover:bg-surface'
                    }`}
                  >
                    <div className="flex items-baseline space-x-2.5">
                      <span className={`font-mono text-[11px] font-bold ${
                        isActive ? 'text-[#c90000]' : 'text-muted'
                      }`}>
                        {item.index}
                      </span>
                      <span className="font-sans font-bold text-xs uppercase tracking-[0.06em]">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {item.id === 'approvals' && pendingApprovals > 0 && (
                        <span className={`px-1 py-0 text-[10px] font-mono font-bold ${
                          isActive ? 'bg-[#c90000] text-white' : 'bg-black text-white'
                        }`}>
                          {pendingApprovals}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom: Role + Authority */}
          <div className="p-3 border-t-2 border-black bg-surface">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted font-bold">
                Authority
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0 bg-black text-white font-bold uppercase">
                {userRole}
              </span>
            </div>
            <button
              onClick={() => setUserRole(userRole === 'OPERATOR' ? 'SUPERVISOR' : 'OPERATOR')}
              className="w-full flex items-center justify-center space-x-1.5 px-2.5 py-1.5 bg-white hover:bg-black hover:text-white text-black border-2 border-black transition-none text-[11px] font-sans font-bold uppercase tracking-wider"
            >
              <UserCheck className="w-3 h-3" />
              <span>Switch {userRole === 'OPERATOR' ? 'Supv' : 'Oper'}</span>
            </button>
          </div>
        </aside>

        {/* Content viewport */}
        <main className="flex-1 overflow-y-auto bg-surface/40 p-6 h-[calc(100vh-5.5rem)]">
          <div className="max-w-[1400px] mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* ───── 5. Approval Drawer ───── */}
      {isApprovalDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          <div
            className="absolute inset-0 bg-black/50 transition-none"
            onClick={() => toggleApprovalDrawer(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-sm bg-white border-l-2 border-black text-black flex flex-col justify-between">
              <div className="p-4 border-b-2 border-black flex items-center justify-between bg-surface">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-[#c90000]" />
                  <div>
                    <h2 className="text-sm font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                      Approval Queue
                    </h2>
                    <p className="text-[10px] font-mono text-muted">
                      {approvalQueue.length} pending
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleApprovalDrawer(false)}
                  className="p-1 border-2 border-black hover:bg-black hover:text-white text-black transition-none"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-3">
                {approvalQueue.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-black bg-surface">
                    <CheckSquare className="w-6 h-6 text-black mb-2" />
                    <p className="text-xs font-sans font-bold uppercase tracking-wider text-black">
                      No Pending Exceptions
                    </p>
                  </div>
                ) : (
                  approvalQueue.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-3 border-2 border-black hover:bg-surface transition-none cursor-pointer"
                      onClick={() => {
                        selectApprovalForReview(item.id);
                        onViewChange('approvals');
                        toggleApprovalDrawer(false);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-black text-white font-bold uppercase tracking-wider">
                          {item.tierRequired.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-lg font-bold font-mono text-black">
                        ${item.intent.displayAmount.toFixed(2)} {item.intent.tokenSymbol}
                      </div>
                      <div className="text-xs font-sans text-black mt-0.5">
                        → <strong>{item.intent.recipientLabel}</strong>
                      </div>
                      <div className="bg-surface p-1.5 border border-black text-[10px] font-mono text-black mt-1.5">
                        <strong className="text-[#c90000]">MEMO:</strong> {item.intent.memo}
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-sans font-bold uppercase tracking-wider pt-1.5 border-t-2 border-black mt-2">
                        <span>Open in Station</span>
                        <ExternalLink className="w-3 h-3 text-black" />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t-2 border-black bg-surface">
                <button
                  onClick={() => {
                    onViewChange('approvals');
                    toggleApprovalDrawer(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-black hover:bg-[#c90000] text-white font-sans font-bold text-xs uppercase tracking-[0.12em] transition-none"
                >
                  <span>Open Station</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───── 6. Audit Footer ───── */}
      <footer className="h-9 bg-white border-t-2 border-black px-6 flex items-center justify-between text-[10px] font-mono text-black select-none">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-black" />
            <span className="font-bold">FW:</span>
            <span className="font-bold">ESP32-v2.0.4-rc2</span>
            <span className="bg-black text-white px-1 font-bold text-[9px]">OK</span>
          </div>
          <div className="hidden sm:flex items-center space-x-1 border-l-2 border-black pl-4">
            <GitCommit className="w-3 h-3 text-black" />
            <span className="font-bold">902f229</span>
          </div>
          <div className="hidden md:flex items-center space-x-1 border-l-2 border-black pl-4">
            <FileCode2 className="w-3 h-3 text-black" />
            <span className="font-bold">EIP712-V2</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Blocks className="w-3 h-3 text-black" />
            <span className="font-bold">#{lastAnchoredBlock}</span>
          </div>
          <div className="hidden lg:flex items-center space-x-1 border-l-2 border-black pl-4">
            <span className="w-1.5 h-1.5 bg-black inline-block" />
            <span className="font-bold uppercase text-[9px]">POLICY ENFORCED</span>
          </div>
        </div>
      </footer>

      {/* ───── QR Modal ───── */}
      {showQr && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black p-5 max-w-xs w-full text-black relative">
            <button
              onClick={() => setShowQr(false)}
              className="absolute top-2 right-2 p-1 hover:bg-black hover:text-white text-black"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <h3 className="text-sm font-sans font-extrabold uppercase tracking-[0.12em] text-black mb-2 border-b-2 border-black pb-1.5">
              Smart Account
            </h3>
            <div className="border-2 border-black p-3 bg-surface flex items-center justify-center mb-3">
              <div className="w-32 h-32 bg-white grid grid-cols-6 gap-0.5 p-1.5 border-2 border-black">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div key={i} className={`${i % 2 === 0 || i % 7 === 0 ? 'bg-black' : 'bg-transparent'}`} />
                ))}
              </div>
            </div>
            <p className="text-[10px] font-mono break-all bg-surface p-1.5 border border-black text-black font-semibold">
              {smartAccountAddress}
            </p>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  handleCopy();
                  setShowQr(false);
                }}
                className="px-3 py-1.5 bg-black text-white text-xs font-sans font-bold uppercase tracking-wider hover:bg-[#c90000]"
              >
                Copy & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
