import React, { useState } from 'react';
import { useBastionStore } from '../store/useBastionStore';
import { 
  Shield, 
  Wallet, 
  Clock, 
  Key, 
  Cpu, 
  Activity, 
  ArrowUpRight, 
  Check, 
  Copy, 
  RefreshCw,
  Server,
  Layers
} from 'lucide-react';

export const OverviewPage: React.FC<{ onNavigate: (route: string) => void }> = ({ onNavigate }) => {
  const {
    smartAccountAddress,
    ownerAddress,
    entryPointAddress,
    nativeBalanceEth,
    tokenBalanceUsdc,
    spentTodayUsd,
    dailyAllowanceUsd,
    dailyResetUtc,
    activeSession,
    hardwareNodes,
    riskLevel,
    recentUserOps,
    approvalQueue,
    refreshBalances,
    revokeSessionKey
  } = useBastionStore();

  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(id);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  const esp32Node = hardwareNodes.find(n => n.id === 'esp32-signer');
  const spendPct = Math.min(100, Math.round((spentTodayUsd / dailyAllowanceUsd) * 100));

  return (
    <div className="space-y-8">
      {/* Broad Opening Statement Grid (Swiss Minimalist Layout) */}
      <div className="border-b-2 border-black pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-[#c90000] mb-2 flex items-center space-x-2">
              <span className="w-2 h-2 bg-[#c90000] inline-block" />
              <span>SECTION 01 / EXECUTIVE COMMAND OVERVIEW</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-black leading-none uppercase">
              BREACH-RESILIENT WALLET ARCHITECTURE.
            </h1>
            <p className="text-base text-muted font-normal mt-3 leading-relaxed max-w-2xl">
              Autonomous agent spending restricted by an immutable ERC-4337 smart account, paired with an independent directly-wired ESP32 physical review station.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={refreshBalances}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-black hover:text-white text-black border-2 border-black font-sans font-bold text-xs uppercase tracking-[0.12em] transition-none"
            >
              <RefreshCw className="w-4 h-4" />
              <span>SYNC LEDGER</span>
            </button>
            <button
              onClick={() => onNavigate('agent')}
              className="flex items-center space-x-2 px-5 py-2.5 bg-black hover:bg-[#c90000] text-white font-sans font-bold text-xs uppercase tracking-[0.12em] transition-none"
            >
              <span>DISPATCH INTENT</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: Core Financial & Identity Widgets (3 equal ruled columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-black bg-black">
        {/* Widget 1: SmartAccountIdentity */}
        <div className="bg-white p-6 space-y-4 border-b-2 md:border-b-0 md:border-r-2 border-black">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">01.1</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Account Identity
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              ERC-4337 V0.6
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <div className="text-[10px] text-muted font-sans uppercase font-bold tracking-wider">Account Contract</div>
              <div className="flex items-center justify-between bg-surface p-2 border border-black mt-1">
                <span className="text-black font-bold truncate mr-2">{smartAccountAddress}</span>
                <button 
                  onClick={() => handleCopy(smartAccountAddress, 'acct')}
                  className="text-black hover:text-[#c90000]"
                >
                  {copiedAddr === 'acct' ? <Check className="w-3.5 h-3.5 text-[#c90000]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-[10px] text-muted font-sans uppercase font-bold">Owner (B)</span>
                <div className="text-black font-bold truncate mt-0.5">{ownerAddress.substring(0, 10)}...</div>
              </div>
              <div>
                <span className="text-[10px] text-muted font-sans uppercase font-bold">EntryPoint</span>
                <div className="text-black font-bold truncate mt-0.5">{entryPointAddress.substring(0, 10)}...</div>
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t-2 border-black text-xs">
            <button 
              onClick={() => onNavigate('wallet')}
              className="text-black hover:text-[#c90000] font-bold uppercase tracking-wider flex items-center space-x-1"
            >
              <span>Inspect Policy</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
            <span className="text-[11px] font-mono font-bold bg-surface px-1.5 border border-black">ACTIVE</span>
          </div>
        </div>

        {/* Widget 2: BalanceSummary */}
        <div className="bg-white p-6 space-y-4 border-b-2 md:border-b-0 md:border-r-2 border-black">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">01.2</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Balance & Gas
              </h2>
            </div>
            <button
              onClick={refreshBalances}
              title="Refresh balances"
              className="p-1 hover:bg-black hover:text-white text-black"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="bg-surface p-4 border border-black">
              <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-muted">Token Balance</div>
              <div className="text-3xl font-mono font-extrabold text-black mt-1">
                ${tokenBalanceUsdc.toFixed(2)} <span className="text-sm font-bold">USDC</span>
              </div>
              <div className="text-[10px] font-mono text-muted mt-1">
                Target: 0x0000...0022 (Mock ERC-20)
              </div>
            </div>

            <div className="bg-white p-3 border border-black flex items-center justify-between">
              <div>
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-muted">Native Gas</div>
                <div className="text-base font-mono font-extrabold text-black">{nativeBalanceEth} ETH</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
                READY
              </span>
            </div>
          </div>
        </div>

        {/* Widget 3: SpendToday */}
        <div className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">01.3</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                UTC Spend Cap
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold bg-surface px-1.5 border border-black text-black">
              {dailyResetUtc}
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-3xl font-mono font-extrabold text-black">
                ${spentTodayUsd.toFixed(2)}
              </span>
              <span className="text-xs font-mono font-bold text-muted">
                CAP: ${dailyAllowanceUsd.toFixed(2)} USDC
              </span>
            </div>

            {/* Ruled Spend Bar */}
            <div className="w-full h-4 bg-surface border-2 border-black p-0.5">
              <div 
                className="h-full bg-black transition-none"
                style={{ width: `${spendPct}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] font-mono font-bold mt-2">
              <span className="text-black">{spendPct}% CONSUMED</span>
              <span className="text-[#c90000]">${(dailyAllowanceUsd - spentTodayUsd).toFixed(2)} REMAINING</span>
            </div>
          </div>

          <div className="bg-surface p-2.5 border border-black text-[11px] font-sans text-muted">
            Enforced on-chain by <span className="font-mono font-bold text-black">Account.sol</span> rolling daily budget.
          </div>
        </div>
      </div>

      {/* Row 2: Agent Key, Hardware Health & Trust Posture (3 Ruled Blocks) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-black bg-black">
        {/* Widget 4: AgentSessionTile */}
        <div className="bg-white p-6 space-y-4 border-b-2 md:border-b-0 md:border-r-2 border-black">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">01.4</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Agent Session Key
              </h2>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 font-bold uppercase ${
              activeSession.status === 'ACTIVE'
                ? 'bg-black text-white'
                : 'bg-[#c90000] text-white'
            }`}>
              {activeSession.status}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div>
              <div className="text-[10px] text-muted font-sans uppercase font-bold">Public Key Identifier</div>
              <div className="text-black font-bold truncate bg-surface p-2 border border-black mt-1">
                {activeSession.publicKey}
              </div>
            </div>
            <div className="bg-surface p-2.5 border border-black text-[11px] font-sans text-black">
              <strong className="uppercase tracking-wider">Scope:</strong> {activeSession.permissionScope}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t-2 border-black">
            <button
              onClick={() => onNavigate('wallet')}
              className="text-xs font-sans font-bold uppercase tracking-wider text-black hover:text-[#c90000]"
            >
              View Scope
            </button>
            <button
              onClick={revokeSessionKey}
              className="text-xs font-sans font-bold uppercase tracking-wider text-white bg-black hover:bg-[#c90000] px-3 py-1 border border-black transition-none"
            >
              Revoke Session
            </button>
          </div>
        </div>

        {/* Widget 5: HardwareSignerHealth */}
        <div className="bg-white p-6 space-y-4 border-b-2 md:border-b-0 md:border-r-2 border-black">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">01.5</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                ESP32 Signer Health
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              ONLINE
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center bg-surface p-2 border border-black">
              <span className="text-muted font-sans uppercase font-bold text-[10px]">Firmware</span>
              <span className="text-black font-bold">{esp32Node?.firmware || 'v2.0.4-rc2'}</span>
            </div>
            <div className="flex justify-between items-center bg-surface p-2 border border-black">
              <span className="text-muted font-sans uppercase font-bold text-[10px]">OLED Screen</span>
              <span className="text-black font-bold">128x64 Active (I2C)</span>
            </div>
            <div className="flex justify-between items-center bg-surface p-2 border border-black">
              <span className="text-muted font-sans uppercase font-bold text-[10px]">RC522 RFID</span>
              <span className="text-black font-bold">Ready on SPI</span>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t-2 border-black text-xs">
            <button
              onClick={() => onNavigate('hardware')}
              className="text-black hover:text-[#c90000] font-bold uppercase tracking-wider flex items-center space-x-1"
            >
              <span>Inspect Pinout</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
            <span className="text-[11px] font-mono font-bold text-muted">LATENCY: {esp32Node?.lastPingMs || 4}MS</span>
          </div>
        </div>

        {/* Widget 6: TrustPosture */}
        <div className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">01.6</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Correlated Trust
              </h2>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 font-bold uppercase ${
              riskLevel === 'TRUSTED'
                ? 'bg-black text-white'
                : 'bg-[#c90000] text-white'
            }`}>
              {riskLevel}
            </span>
          </div>

          <div className="space-y-2 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-rule-light pb-1.5">
              <span className="font-bold text-muted uppercase text-[11px]">PIR Sensor (Uno #1):</span>
              <span className="font-mono font-bold text-black">Nominal / Clear</span>
            </div>
            <div className="flex items-center justify-between border-b border-rule-light pb-1.5">
              <span className="font-bold text-muted uppercase text-[11px]">Camera Optical Challenge:</span>
              <span className="font-mono font-bold text-black">Verified Present</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-muted uppercase text-[11px]">Anomalous UserOps:</span>
              <span className="font-mono font-bold text-black">0 Detected</span>
            </div>
            <p className="text-[11px] text-muted pt-1">
              Soft telemetry provides correlated threat context; hard authority resides in on-chain contracts.
            </p>
          </div>

          <div className="pt-3 border-t-2 border-black">
            <button
              onClick={() => onNavigate('security')}
              className="text-xs font-sans font-bold uppercase tracking-wider text-black hover:text-[#c90000] flex items-center space-x-1"
            >
              <span>Open Security SOC</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Activity, Queue & Dependencies (Ruled Matrix Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-2 border-black bg-black">
        {/* Widget 7: PaymentActivity (Takes 2 Columns) */}
        <div className="lg:col-span-2 bg-white p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">01.7</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Recent On-Chain Payment Operations (UserOps)
              </h2>
            </div>
            <button
              onClick={() => onNavigate('agent')}
              className="text-xs font-sans font-bold uppercase tracking-wider text-black hover:text-[#c90000] flex items-center space-x-1"
            >
              <span>Compose Payment</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-2 border-black">
              <thead>
                <tr className="bg-surface border-b-2 border-black text-black font-sans text-[11px] uppercase tracking-wider">
                  <th className="p-3 border-r border-black font-bold">UserOp Hash</th>
                  <th className="p-3 border-r border-black font-bold">Recipient</th>
                  <th className="p-3 border-r border-black font-bold">Amount</th>
                  <th className="p-3 border-r border-black font-bold">Block</th>
                  <th className="p-3 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y border-t border-black divide-black">
                {recentUserOps.map((op) => (
                  <tr key={op.intentId} className="hover:bg-surface">
                    <td className="p-3 border-r border-black font-bold text-black">{op.userOpHash}</td>
                    <td className="p-3 border-r border-black font-sans text-muted">{op.target}</td>
                    <td className="p-3 border-r border-black font-bold text-black">{op.amount}</td>
                    <td className="p-3 border-r border-black text-muted">#{op.blockNumber}</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 bg-black text-white font-mono font-bold text-[10px] uppercase">
                        EXECUTED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Pending Approvals (Widget 8) & Dependencies (Widget 9) */}
        <div className="bg-white flex flex-col justify-between divide-y-2 divide-black">
          {/* Widget 8: PendingApprovals */}
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-[#c90000]">01.8</span>
                <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                  Pending Approvals
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#c90000] text-white font-bold">
                {approvalQueue.length} QUEUED
              </span>
            </div>

            {approvalQueue.length === 0 ? (
              <p className="text-xs font-sans text-muted py-4 text-center">
                Queue empty. All transactions within policy.
              </p>
            ) : (
              <div className="space-y-3">
                {approvalQueue.map((item) => (
                  <div key={item.id} className="bg-surface p-3 border-2 border-black text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-black">
                        ${item.intent.displayAmount.toFixed(2)} {item.intent.tokenSymbol}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-black text-white px-1.5 py-0.2 uppercase">
                        {item.tierRequired}
                      </span>
                    </div>
                    <div className="text-[11px] font-sans text-muted truncate">
                      {item.intent.recipientLabel}
                    </div>
                    <button
                      onClick={() => onNavigate('approvals')}
                      className="w-full py-1.5 px-3 bg-white hover:bg-black hover:text-white text-black border-2 border-black text-xs font-sans font-bold uppercase tracking-wider transition-none flex items-center justify-center space-x-1"
                    >
                      <span>Review on Hardware OLED</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget 9: LiveDependencyPanel */}
          <div className="p-6 space-y-3 bg-surface">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-[#c90000]">01.9</span>
                <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                  Cluster Dependencies
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold">
                ALL OK
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-black border-b border-rule-light pb-1">
                <span className="font-sans font-bold text-[11px]">API Host A (RTX 5060):</span>
                <span className="font-bold">HEALTHY (8000)</span>
              </div>
              <div className="flex justify-between items-center text-black border-b border-rule-light pb-1">
                <span className="font-sans font-bold text-[11px]">Gateway B (Ultra 7):</span>
                <span className="font-bold">CONNECTED (UART)</span>
              </div>
              <div className="flex justify-between items-center text-black border-b border-rule-light pb-1">
                <span className="font-sans font-bold text-[11px]">UNO Q 4GB Edge:</span>
                <span className="font-bold">STREAMING (14MS)</span>
              </div>
              <div className="flex justify-between items-center text-black">
                <span className="font-sans font-bold text-[11px]">4337 Bundler RPC:</span>
                <span className="font-bold">ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
