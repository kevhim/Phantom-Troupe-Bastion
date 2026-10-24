import React from 'react';
import { useBastionStore } from '../../store/useBastionStore';
import { GitCommit, Cpu, FileCode2, Blocks, CheckCircle2 } from 'lucide-react';

export const AuditFooter: React.FC = () => {
  const { lastAnchoredBlock } = useBastionStore();

  return (
    <footer className="h-10 bg-white border-t-2 border-black px-6 flex items-center justify-between text-[11px] font-mono text-black select-none">
      <div className="flex items-center space-x-6">
        {/* Firmware Version */}
        <div className="flex items-center space-x-1.5">
          <Cpu className="w-3.5 h-3.5 text-black" />
          <span className="font-bold tracking-wider">FW:</span>
          <span className="font-bold">ESP32-v2.0.4-rc2</span>
          <span className="bg-black text-white px-1 font-bold text-[10px] ml-1">VERIFIED</span>
        </div>

        {/* Git SHA */}
        <div className="hidden sm:flex items-center space-x-1.5 border-l-2 border-black pl-6">
          <GitCommit className="w-3.5 h-3.5 text-black" />
          <span className="font-bold tracking-wider">COMMIT:</span>
          <a 
            href="https://github.com/kevhim/Phantom-Troupe-Bastion" 
            target="_blank" 
            rel="noreferrer"
            className="font-bold underline decoration-2 hover:text-[#c90000]"
          >
            902f229
          </a>
        </div>

        {/* EIP-712 Schema Hash */}
        <div className="hidden md:flex items-center space-x-1.5 border-l-2 border-black pl-6">
          <FileCode2 className="w-3.5 h-3.5 text-black" />
          <span className="font-bold tracking-wider">SCHEMA:</span>
          <span className="font-bold">EIP712-BASTION-V2</span>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        {/* On-Chain Block */}
        <div className="flex items-center space-x-1.5">
          <Blocks className="w-3.5 h-3.5 text-black" />
          <span className="font-bold tracking-wider">BLOCK:</span>
          <span className="font-bold bg-surface px-1.5 border border-black">#{lastAnchoredBlock}</span>
        </div>

        {/* Anti-Tamper Status */}
        <div className="hidden lg:flex items-center space-x-1.5 border-l-2 border-black pl-6">
          <span className="w-2 h-2 bg-black inline-block" />
          <span className="font-bold tracking-wider uppercase text-[10px]">POLICY HARD-ENFORCED</span>
        </div>
      </div>
    </footer>
  );
};
