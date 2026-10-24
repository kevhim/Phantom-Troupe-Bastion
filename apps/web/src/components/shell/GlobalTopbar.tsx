import React, { useState, useEffect } from 'react';
import { useBastionStore } from '../../store/useBastionStore';
import { 
  Copy, 
  Check, 
  QrCode, 
  Activity, 
  Clock, 
  ShieldAlert, 
  RefreshCw,
  X
} from 'lucide-react';

export const GlobalTopbar: React.FC = () => {
  const { 
    smartAccountAddress, 
    rpcPingMs, 
    dailyResetUtc, 
    userRole, 
    setUserRole, 
    approvalQueue, 
    toggleApprovalDrawer,
    refreshBalances
  } = useBastionStore();

  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC').split(' ')[4] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(smartAccountAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pendingApprovalsCount = approvalQueue.length;

  return (
    <header className="h-16 bg-white border-b-2 border-black px-6 flex items-center justify-between text-xs font-mono select-none">
      {/* Left: Smart Account Identity with Copy & QR */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center border-2 border-black bg-surface">
          <span className="px-2.5 py-1 text-[11px] font-sans font-bold uppercase tracking-[0.12em] bg-black text-white">
            ACCOUNT
          </span>
          <span className="px-3 py-1 text-black font-mono font-bold text-xs tracking-wider">
            {smartAccountAddress.substring(0, 6)}...{smartAccountAddress.substring(smartAccountAddress.length - 4)}
          </span>
          <button 
            onClick={handleCopy}
            title="Copy Full Smart Account Address"
            className="p-1.5 border-l-2 border-black hover:bg-black hover:text-white text-black transition-none"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#c90000]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button 
            onClick={() => setShowQrModal(true)}
            title="Show Address QR"
            className="p-1.5 border-l-2 border-black hover:bg-black hover:text-white text-black transition-none"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* RPC Ping */}
        <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 border-2 border-black bg-white font-mono text-[11px]">
          <Activity className="w-3.5 h-3.5 text-black" />
          <span className="font-bold tracking-wider">RPC:</span>
          <span className="font-bold">{rpcPingMs}MS</span>
        </div>

        {/* Live UTC Clock */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 border-2 border-black bg-surface font-mono text-[11px]">
          <Clock className="w-3.5 h-3.5 text-black" />
          <span className="font-bold text-black">{utcTime}</span>
          <span className="text-muted">| RESET: {dailyResetUtc}</span>
        </div>
      </div>

      {/* Right: Cluster Health, Role & Approval Trigger */}
      <div className="flex items-center space-x-3">
        {/* Node Health Matrix */}
        <div className="hidden xl:flex items-center border-2 border-black">
          <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-black text-white">
            NODES
          </span>
          <span className="px-2 py-1 text-[10px] font-bold border-r border-black">
            API (A): OK
          </span>
          <span className="px-2 py-1 text-[10px] font-bold border-r border-black">
            GW (B): OK
          </span>
          <span className="px-2 py-1 text-[10px] font-bold">
            BUNDLER: 4337
          </span>
        </div>

        {/* Balance Refresh */}
        <button
          onClick={refreshBalances}
          title="Refresh On-Chain Balances & Ping"
          className="p-2 border-2 border-black bg-white hover:bg-black hover:text-white text-black transition-none"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Role Switcher Pill */}
        <div className="flex border-2 border-black">
          <button
            onClick={() => setUserRole('OPERATOR')}
            className={`px-3 py-1 text-[11px] font-sans font-bold uppercase tracking-[0.12em] transition-none ${
              userRole === 'OPERATOR' 
                ? 'bg-black text-white' 
                : 'bg-white text-black hover:bg-surface'
            }`}
          >
            Operator
          </button>
          <button
            onClick={() => setUserRole('SUPERVISOR')}
            className={`px-3 py-1 text-[11px] font-sans font-bold uppercase tracking-[0.12em] border-l-2 border-black transition-none ${
              userRole === 'SUPERVISOR' 
                ? 'bg-black text-white' 
                : 'bg-white text-black hover:bg-surface'
            }`}
          >
            Supervisor
          </button>
        </div>

        {/* Hardware Approval Drawer Trigger */}
        <button
          onClick={() => toggleApprovalDrawer()}
          className="relative flex items-center space-x-2 px-3 py-1 border-2 border-black bg-white hover:bg-black hover:text-white text-black font-bold uppercase tracking-wider text-[11px] transition-none"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-[#c90000]" />
          <span className="hidden sm:inline">APPROVALS</span>
          {pendingApprovalsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-[#c90000] text-white font-mono font-bold text-[10px]">
              {pendingApprovalsCount}
            </span>
          )}
        </button>
      </div>

      {/* QR Code Popover Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black p-6 max-w-sm w-full text-black relative">
            <button 
              onClick={() => setShowQrModal(false)}
              className="absolute top-3 right-3 p-1 hover:bg-black hover:text-white text-black"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-sans font-extrabold uppercase tracking-[0.12em] text-black mb-3 border-b-2 border-black pb-2">
              Smart Account Address
            </h3>
            <div className="border-2 border-black p-4 bg-surface flex items-center justify-center mb-4">
              <div className="w-40 h-40 bg-white grid grid-cols-6 gap-1 p-2 border-2 border-black">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div key={i} className={`${i % 2 === 0 || i % 7 === 0 ? 'bg-black' : 'bg-transparent'}`} />
                ))}
              </div>
            </div>
            <p className="text-[11px] font-mono break-all bg-surface p-2 border border-black text-black font-semibold">
              {smartAccountAddress}
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  handleCopy();
                  setShowQrModal(false);
                }}
                className="px-4 py-2 bg-black text-white text-xs font-sans font-bold uppercase tracking-wider hover:bg-[#c90000]"
              >
                Copy & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
