import React, { useState, useEffect } from 'react';
import { useBastionStore } from '../store/useBastionStore';
import MosaicLens from './MosaicLens';

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
  children 
}) => {
  const store = useBastionStore();
  const [copied, setCopied] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(store.smartAccountAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems = [
    { id: 'payments' as const, label: '01. PAYMENTS' },
    { 
      id: 'approvals' as const, 
      label: '02. HARDWARE SIGNER',
      badge: store.approvalQueue.length > 0 ? store.approvalQueue.length : undefined 
    },
    { id: 'rules' as const, label: '03. WALLET RULES' },
    { id: 'hardware' as const, label: '04. DEVICE & SENSORS' },
  ];

  const isPanic = store.emergencyState === 'PANIC_FROZEN' || store.gpio32Panic;

  return (
    <div className="relative min-h-screen text-white/90 font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* ═══ MOSAIC LENS BACKGROUND WITH FALLBACK ═══ */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Static animated mesh fallback layer beneath MosaicLens */}
        <div className="absolute inset-0 animated-mesh-bg opacity-70" />
        <MosaicLens
          background="#07080F" color1="#FF7A3D" color2="#8B5CF6"
          speed={reducedMotion ? 0 : 120} size={140} angle={0}
          tileSize={12} hover={80} reach={240}
          style={{ position: "absolute", inset: 0, minWidth: 0, minHeight: 0, width: "100%", height: "100%", background: "transparent" }}
        />
        {/* static vignette for legibility: transparent center -> rgba(0,0,0,.35) edges */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 100% at 50% 40%, transparent 45%, rgba(0,0,0,.35) 100%)" }} />
      </div>

      {/* ═══ APP CONTENT WRAPPER (RELATIVE Z-10) ═══ */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ═══ EMERGENCY PANIC BAR (IF LATCHED) ═══ */}
        {isPanic && (
          <div className="sticky top-0 z-40 glass-status-crimson text-white/90 px-6 py-2.5 flex items-center justify-between text-xs backdrop-blur-md">
            <div className="flex items-center gap-3 max-w-5xl mx-auto w-full justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-none bg-rose-500 inline-block" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/90 font-bold">
                  PANIC ACTIVE
                </span>
                <span className="text-white/80 font-medium">
                  HARDWARE PANIC LATCHED (GPIO 32) — Session key revoked & alarm active
                </span>
              </div>
              <button
                onClick={() => store.resetPanic()}
                className="glass-btn px-3 py-1 font-mono text-[10px] uppercase tracking-widest cursor-pointer"
              >
                Reset Panic
              </button>
            </div>
          </div>
        )}

        {/* ═══ MAIN HEADER & TOP NAVIGATION ═══ */}
        <header className="pt-8 pb-4 px-4 text-center">
          {/* Top Center Branding */}
          <div className="mb-4">
            <div className="flex items-baseline justify-center gap-2">
              <h1 className="text-center text-3xl font-black tracking-widest text-white/90 drop-shadow-sm font-sans">
                BASTION X
              </h1>
              <span className="font-serif italic text-base text-white/45 font-normal">
                spec. 01
              </span>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/45 mt-1">
              Breach-Resilient Autonomous Agent Wallet • EIP-4337
            </p>
          </div>

          {/* Centered Horizontal Navigation Dock (.glass with 999px radius) */}
          <div className="mx-auto w-fit flex items-center gap-1.5 p-1.5 glass rounded-full mb-6">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`px-5 py-2 rounded-full text-xs transition-all flex items-center gap-2 cursor-pointer font-sans ${
                    isActive
                      ? 'bg-white/[0.18] text-white shadow-sm font-semibold'
                      : 'text-white/60 hover:text-white/90 hover:bg-white/[0.06]'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="w-4 h-4 rounded-full bg-rose-500/80 text-white text-[9px] flex items-center justify-center font-mono font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Integrated Glass Metrics Bar (4 Columns, 14px radius, 1px hairlines) */}
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-0 glass rounded-[14px] divide-y md:divide-y-0 md:divide-x divide-white/[0.08] text-center mb-8">
            {/* 1. ACCOUNT */}
            <button
              onClick={handleCopyAddress}
              title="Click to copy account address"
              className="flex flex-col items-center justify-center py-3.5 px-4 hover:bg-white/[0.04] transition-colors cursor-pointer group"
            >
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium">
                ACCOUNT
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs font-mono font-medium text-white/90 group-hover:text-white">
                  {store.smartAccountAddress.slice(0, 6)}...{store.smartAccountAddress.slice(-4)}
                </span>
                <span className="text-[10px] text-white/45 group-hover:text-white/90">
                  {copied ? '✓' : '⧉'}
                </span>
              </div>
            </button>

            {/* 2. TREASURY VAULT */}
            <div className="flex flex-col items-center justify-center py-3.5 px-4">
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium">
                TREASURY VAULT
              </span>
              <span className="text-xs font-mono font-medium text-white/90 mt-1 tabular-nums">
                {store.balanceUsdc.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC
              </span>
            </div>

            {/* 3. DAILY ALLOWANCE */}
            <div className="flex flex-col items-center justify-center py-3.5 px-4">
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium">
                DAILY ALLOWANCE
              </span>
              <span className="text-xs font-mono font-medium text-white/90 mt-1 tabular-nums">
                ${store.dailySpent.toFixed(2)} / ${store.dailyLimit}.00
              </span>
            </div>

            {/* 4. NETWORK */}
            <button
              onClick={() => store.setEnvMode(store.envMode === 'LIVE_LAN' ? 'SIMULATED' : 'LIVE_LAN')}
              title="Click to toggle Network mode"
              className="flex flex-col items-center justify-center py-3.5 px-4 hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium">
                NETWORK
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-1.5 h-1.5 rounded-none ${
                  store.envMode === 'LIVE_LAN' ? 'bg-emerald-400' : 'bg-white/45'
                }`} />
                <span className="text-xs font-mono font-medium text-white/90">
                  {store.envMode === 'LIVE_LAN' ? 'LAN CONNECTED' : 'SIMULATED'}
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* ═══ CENTERED CONTENT CONTAINER (MAX-W-5XL) ═══ */}
        <main className="max-w-5xl mx-auto px-4 pb-16 flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
