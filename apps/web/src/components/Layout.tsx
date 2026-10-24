import React, { useState } from 'react';
import { useBastionStore } from '../store/useBastionStore';
import {
  Shield,
  CreditCard,
  Cpu,
  Sliders,
  Radio,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export type NavTab = 'payments' | 'approvals' | 'rules' | 'hardware';

interface LayoutProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onReplayIntro?: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ 
  currentTab, 
  onTabChange, 
  onReplayIntro,
  children 
}) => {
  const store = useBastionStore();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(store.smartAccountAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems = [
    { id: 'payments' as const, label: 'Payments', icon: CreditCard },
    { 
      id: 'approvals' as const, 
      label: 'Hardware Signer', 
      icon: Cpu,
      badge: store.approvalQueue.length > 0 ? store.approvalQueue.length : undefined
    },
    { id: 'rules' as const, label: 'Wallet Rules', icon: Sliders },
    { id: 'hardware' as const, label: 'Device & Sensors', icon: Radio },
  ];

  const isPanic = store.emergencyState === 'PANIC_FROZEN' || store.gpio32Panic;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 flex flex-col font-sans antialiased">
      {/* ═══ EMERGENCY PANIC NOTIFICATION BAR ═══ */}
      {isPanic && (
        <div className="bg-rose-50 border-b border-rose-200/90 px-6 py-2.5 flex items-center justify-between text-rose-800 text-xs z-40 transition-all">
          <div className="flex items-center gap-2.5 font-medium">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
            </span>
            <span className="font-semibold tracking-wide">
              EMERGENCY PANIC LATCHED (GPIO 32)
            </span>
            <span className="text-rose-600/80 hidden sm:inline">
              — Session key revoked on-chain & alarm buzzer active
            </span>
          </div>
          <button
            onClick={() => store.resetPanic()}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-medium px-3 py-1 rounded-lg text-xs shadow-sm transition-colors"
          >
            <RotateCcw size={12} />
            <span>Reset Panic</span>
          </button>
        </div>
      )}

      {/* ═══ MINIMAL TOP HEADER (APPLE / LINEAR STYLE) ═══ */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between flex-shrink-0 z-30 sticky top-0">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            <Shield size={16} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-slate-900 font-sans">
              BASTION X
            </span>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200/60 rounded-full px-2 py-0.5">
              v2.3
            </span>
          </div>
        </div>

        {/* Right: Account, Balances & Mode */}
        <div className="flex items-center gap-3 text-xs">
          {/* Smart Wallet Address Pill */}
          <button
            onClick={handleCopyAddress}
            title="Click to copy address"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all font-mono"
          >
            <span>
              {store.smartAccountAddress.slice(0, 6)}...{store.smartAccountAddress.slice(-4)}
            </span>
            {copied ? (
              <Check size={12} className="text-emerald-600" />
            ) : (
              <Copy size={12} className="text-slate-400" />
            )}
          </button>

          {/* Balance Pill */}
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <span className="text-slate-400 font-medium">Vault:</span>
            <span className="text-emerald-700 font-mono font-semibold">
              {store.balanceUsdc.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC
            </span>
          </div>

          {/* Today's Spend */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.03)] font-mono">
            <span className="text-slate-400 font-sans">Today:</span>
            <span className="font-semibold text-slate-800">
              ${store.dailySpent.toFixed(0)} <span className="text-slate-400">/</span> ${store.dailyLimit}
            </span>
          </div>

          {/* Mode Pill Toggle */}
          <button
            onClick={() => store.setEnvMode(store.envMode === 'LIVE_LAN' ? 'SIMULATED' : 'LIVE_LAN')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
              store.envMode === 'LIVE_LAN'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/70'
                : 'bg-slate-100/80 border-slate-200 text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                store.envMode === 'LIVE_LAN' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{store.envMode === 'LIVE_LAN' ? 'LAN Connected' : 'Simulated Mode'}</span>
          </button>
        </div>
      </header>

      {/* ═══ MAIN DESK CANVAS (SIDEBAR + VIEWS) ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ═══ LEFT SIDEBAR (w-64) ═══ */}
        <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between p-4 flex-shrink-0">
          <div>
            {/* Live Hardware Bridge Pill */}
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 mb-5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-700 font-medium">Bridge Online</span>
              </div>
              <span className="text-slate-500 font-mono text-[11px] bg-white border border-slate-200/80 rounded px-1.5 py-0.5">
                {store.hardwareBridgePingMs}ms
              </span>
            </div>

            {/* 4 Clean Navigation Tabs */}
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={17}
                        className={isActive ? 'text-white' : 'text-slate-400'}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Sidebar: Replay Intro + System Tag */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            {onReplayIntro && (
              <button
                onClick={onReplayIntro}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                title="Replay BASTIONX Knockout Zoom Animation"
              >
                <Sparkles size={13} className="text-slate-500" />
                <span>Replay Intro</span>
              </button>
            )}

            <div className="px-1 text-[11px] text-slate-400 font-mono text-center">
              Bastion X v2.3 • Chain 31337
            </div>
          </div>
        </aside>

        {/* ═══ SCROLLABLE BREATHER CANVAS ═══ */}
        <main className="flex-1 overflow-y-auto bg-[#FAFAFA]">
          <div className="max-w-6xl mx-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
