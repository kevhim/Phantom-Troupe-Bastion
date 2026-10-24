import React from 'react';
import { useBastionStore } from '../../store/useBastionStore';
import { ShieldCheck, AlertTriangle, WifiOff, Sparkles } from 'lucide-react';

export const EnvironmentModeStrip: React.FC = () => {
  const { environmentMode, setEnvironmentMode, toggleDemoFixtures } = useBastionStore();

  return (
    <div className={`w-full py-2 px-6 text-xs font-mono flex items-center justify-between border-b-2 border-black bg-white select-none ${
      environmentMode === 'SIMULATED_MIRAGE' ? 'hazard-stripes' : ''
    }`}>
      <div className="flex items-center space-x-3">
        {environmentMode === 'LOCAL_TESTNET' && (
          <>
            <span className="w-2.5 h-2.5 bg-black inline-block" />
            <span className="font-bold tracking-[0.12em] text-[11px] uppercase text-black">
              SYS-01 / ENVIRONMENT:
            </span>
            <span className="px-2 py-0.5 bg-black text-white text-[11px] font-bold tracking-wider">
              LOCAL TESTNET (ANVIL 31337)
            </span>
            <span className="text-muted text-[11px] hidden sm:inline">
              — Smart Account ERC-4337 v0.6 Verified
            </span>
          </>
        )}
        {environmentMode === 'SIMULATED_MIRAGE' && (
          <>
            <span className="w-2.5 h-2.5 bg-[#c90000] inline-block animate-pulse" />
            <span className="font-bold tracking-[0.12em] text-[11px] uppercase text-[#c90000]">
              SYS-01 / WARNING:
            </span>
            <span className="px-2 py-0.5 bg-[#c90000] text-white text-[11px] font-bold tracking-wider">
              SIMULATED / MIRAGE MODE ACTIVE
            </span>
            <span className="text-black font-semibold text-[11px] hidden sm:inline">
              — Synthetic decoy fixtures isolated from live on-chain assets
            </span>
          </>
        )}
        {environmentMode === 'OFFLINE_DISCONNECTED' && (
          <>
            <span className="w-2.5 h-2.5 bg-[#c90000] inline-block" />
            <span className="font-bold tracking-[0.12em] text-[11px] uppercase text-black">
              SYS-01 / STATUS:
            </span>
            <span className="px-2 py-0.5 bg-surface text-black border border-black text-[11px] font-bold tracking-wider">
              OFFLINE STANDBY
            </span>
          </>
        )}
      </div>

      <div className="flex items-center space-x-3">
        <select 
          value={environmentMode}
          onChange={(e) => setEnvironmentMode(e.target.value as any)}
          aria-label="Select environment mode"
          className="bg-white border-2 border-black text-black text-[11px] font-bold px-2 py-1 uppercase tracking-wider focus:outline-none"
        >
          <option value="LOCAL_TESTNET">Chain 31337 (Active)</option>
          <option value="SIMULATED_MIRAGE">Mirage Mode</option>
          <option value="OFFLINE_DISCONNECTED">Offline Standby</option>
        </select>

        <button
          onClick={toggleDemoFixtures}
          className="flex items-center space-x-1.5 px-3 py-1 bg-surface hover:bg-black hover:text-white text-black border-2 border-black font-bold text-[11px] uppercase tracking-wider transition-none"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Toggle Demo Fixtures</span>
        </button>
      </div>
    </div>
  );
};
