import React from 'react';
import { useBastionStore } from '../../store/useBastionStore';
import { ShieldAlert, ArrowRight, RotateCcw } from 'lucide-react';

interface GlobalIncidentBannerProps {
  onInspectSecurity: () => void;
}

export const GlobalIncidentBanner: React.FC<GlobalIncidentBannerProps> = ({ onInspectSecurity }) => {
  const { emergencyState, panicTimestampUtc, resetEmergencyState } = useBastionStore();

  if (emergencyState === 'NORMAL') {
    return null;
  }

  return (
    <div className="w-full py-3 px-6 border-b-2 border-black bg-[#c90000] text-white font-mono text-xs flex items-center justify-between select-none">
      <div className="flex items-center space-x-4">
        <ShieldAlert className="w-6 h-6 text-white shrink-0" />
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm tracking-[0.12em] uppercase text-white font-sans">
              CRITICAL EMERGENCY HALT:
            </span>
            <span className="px-2 py-0.5 font-bold text-xs bg-black text-white border border-white">
              {emergencyState}
            </span>
          </div>
          <p className="text-[11px] text-white font-sans mt-0.5">
            Physical ESP32 GPIO32 panic switch triggered at {panicTimestampUtc || 'recently'}. 
            Signing pipeline locked on-device. Independent RPC session revocation broadcast.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={onInspectSecurity}
          className="flex items-center space-x-1.5 px-4 py-2 bg-black text-white hover:bg-white hover:text-black font-sans font-bold text-xs uppercase tracking-wider transition-none border-2 border-black"
        >
          <span>Inspect Containment</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={resetEmergencyState}
          title="Reset emergency state for demo testing"
          className="flex items-center space-x-1 px-3 py-2 bg-white text-black hover:bg-black hover:text-white border-2 border-black text-xs font-bold uppercase transition-none"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
