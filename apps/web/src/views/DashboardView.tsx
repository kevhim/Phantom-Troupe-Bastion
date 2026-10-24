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
  Send,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertOctagon,
  Flame,
  FileCode,
  Layers,
  Server
} from 'lucide-react';

// ─── MODULE A: Account Summary ──────────────────────────────────────
const AccountSummary: React.FC = () => {
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
    riskLevel,
    revokeSessionKey,
    refreshBalances
  } = useBastionStore();

  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(id);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  const spendPct = Math.min(100, Math.round((spentTodayUsd / dailyAllowanceUsd) * 100));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b-2 border-black pb-4">
        <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-[#c90000] mb-1.5 flex items-center space-x-2">
          <span className="w-2 h-2 bg-[#c90000] inline-block" />
          <span>01 / COMMAND DASHBOARD</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-black leading-none uppercase">
          BREACH-RESILIENT WALLET.
        </h1>
        <p className="text-sm font-sans text-muted mt-2 max-w-2xl">
          ERC-4337 smart account with on-chain policy enforcement. Even a stolen agent key cannot 
          bypass spending limits, recipient whitelists, or function selector restrictions.
        </p>
      </div>

      {/* Account Identity + Balances Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Account Identity */}
        <div className="lg:col-span-2 border-2 border-black p-4 bg-white">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-3 border-b border-rule-light pb-1.5">
            Smart Account Addresses
          </div>
          <div className="space-y-2">
            {[
              { label: 'SMART ACCOUNT', value: smartAccountAddress, id: 'sa' },
              { label: 'OWNER (EOA)', value: ownerAddress, id: 'owner' },
              { label: 'ENTRYPOINT', value: entryPointAddress, id: 'ep' },
            ].map((addr) => (
              <div key={addr.id} className="flex items-center justify-between py-1 border-b border-rule-light">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted w-32 shrink-0">
                  {addr.label}
                </span>
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span className="text-xs font-mono font-bold text-black truncate">
                    {addr.value}
                  </span>
                  <button
                    onClick={() => handleCopy(addr.value, addr.id)}
                    className="shrink-0 p-1 hover:bg-black hover:text-white text-black transition-none"
                    title="Copy"
                  >
                    {copiedAddr === addr.id ? (
                      <Check className="w-3 h-3 text-[#c90000]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Balance Panel */}
        <div className="border-2 border-black p-4 bg-white">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-3 border-b border-rule-light pb-1.5">
            On-Chain Balance
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted">ETH</div>
              <div className="text-2xl font-extrabold font-mono text-black">{nativeBalanceEth.toFixed(3)}</div>
            </div>
            <div className="border-t border-rule-light pt-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted">USDC</div>
              <div className="text-2xl font-extrabold font-mono text-black">${tokenBalanceUsdc.toFixed(2)}</div>
            </div>
            <div className="border-t border-rule-light pt-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted mb-1">
                DAILY SPEND: ${spentTodayUsd.toFixed(2)} / ${dailyAllowanceUsd.toFixed(2)}
              </div>
              <div className="w-full h-3 bg-surface border border-black">
                <div
                  className="h-full bg-black transition-none"
                  style={{ width: `${spendPct}%` }}
                />
              </div>
              <div className="text-[10px] font-mono text-muted mt-1">
                Reset: {dailyResetUtc}
              </div>
            </div>
          </div>
          <button
            onClick={refreshBalances}
            className="w-full mt-3 flex items-center justify-center space-x-1.5 py-1.5 border-2 border-black bg-surface hover:bg-black hover:text-white text-black text-[11px] font-bold uppercase tracking-wider transition-none"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Session Key Panel */}
      <div className="border-2 border-black p-4 bg-white">
        <div className="flex items-center justify-between mb-3 border-b border-rule-light pb-1.5">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted flex items-center space-x-2">
            <Key className="w-3.5 h-3.5" />
            <span>Active Session Key</span>
          </div>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 ${
            activeSession.status === 'ACTIVE' ? 'bg-black text-white' : 'bg-[#c90000] text-white'
          }`}>
            {activeSession.status}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div>
            <div className="text-[10px] uppercase text-muted">Public Key</div>
            <div className="font-bold text-black truncate">{activeSession.publicKey}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted">Actor</div>
            <div className="font-bold text-black">{activeSession.actorSession}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted">Scope</div>
            <div className="font-bold text-black">{activeSession.permissionScope}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted">Expires</div>
            <div className="font-bold text-black">{activeSession.expiresAtUtc}</div>
          </div>
        </div>
        {activeSession.status === 'ACTIVE' && (
          <button
            onClick={revokeSessionKey}
            className="mt-3 flex items-center space-x-1.5 px-3 py-1.5 bg-[#c90000] hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider transition-none"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Emergency Revoke Key</span>
          </button>
        )}
      </div>
    </div>
  );
};

// ─── MODULE B: Agent Workbench (Payment + Attack Lab) ───────────────
const AgentWorkbench: React.FC = () => {
  const {
    whitelistedVendors,
    maxPerTxUsd,
    submitPaymentIntent,
    reasoningTrace,
    recentUserOps,
    lastTxReceipt,
    runSafeAttack,
    attackLabOutput,
    clearAttackLab
  } = useBastionStore();

  const [tokenSymbol, setTokenSymbol] = useState('USDC');
  const [selectedVendor, setSelectedVendor] = useState(whitelistedVendors[0]?.address || '');
  const [amount, setAmount] = useState('15.00');
  const [memo, setMemo] = useState('Agent-initiated cloud compute payment');
  const [copiedHash, setCopiedHash] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPaymentIntent({
      tokenSymbol,
      recipient: selectedVendor,
      amountUsd: parseFloat(amount),
      memo
    });
  };

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b-2 border-black pb-3">
        <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted flex items-center space-x-2">
          <span className="w-2 h-2 bg-black inline-block" />
          <span>AGENT WORKBENCH — Payment Intent & Attack Simulation</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Payment Intent Form */}
        <div className="border-2 border-black p-4 bg-white">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-3 border-b border-rule-light pb-1.5">
            Submit Payment Intent
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-muted mb-1">Token</label>
              <select
                value={tokenSymbol}
                onChange={e => setTokenSymbol(e.target.value)}
                className="w-full border-2 border-black px-3 py-2 text-xs font-mono bg-white focus:outline-none"
              >
                <option value="USDC">USDC (Mock)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-muted mb-1">Recipient</label>
              <select
                value={selectedVendor}
                onChange={e => setSelectedVendor(e.target.value)}
                className="w-full border-2 border-black px-3 py-2 text-xs font-mono bg-white focus:outline-none"
              >
                {whitelistedVendors.map(v => (
                  <option key={v.address} value={v.address}>
                    {v.label} ({v.address.substring(0, 8)}...)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-muted mb-1">
                Amount (USD) — Max autonomous: ${maxPerTxUsd}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full border-2 border-black px-3 py-2 text-xs font-mono bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-muted mb-1">Memo</label>
              <input
                type="text"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                className="w-full border-2 border-black px-3 py-2 text-xs font-mono bg-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-2.5 bg-black hover:bg-[#c90000] text-white font-sans font-bold text-xs uppercase tracking-[0.12em] transition-none"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Intent</span>
            </button>
            {parseFloat(amount) > maxPerTxUsd && (
              <div className="bg-surface border border-black p-2 text-[11px] font-mono text-[#c90000] font-bold">
                ⚠ Exceeds ${maxPerTxUsd} limit → Will route to ESP32 hardware queue
              </div>
            )}
          </form>
        </div>

        {/* Attack Lab */}
        <div className="border-2 border-black p-4 bg-white">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-3 border-b border-rule-light pb-1.5 flex items-center space-x-2">
            <Flame className="w-3.5 h-3.5 text-[#c90000]" />
            <span>Attack Simulation Lab</span>
          </div>
          <p className="text-[11px] font-sans text-muted mb-3">
            Simulate a stolen agent key attack. Every attack is BLOCKED on-chain by the smart contract's policy engine.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => runSafeAttack('NON_WHITELISTED')}
              className="w-full flex items-center space-x-2 px-3 py-2 border-2 border-black bg-surface hover:bg-black hover:text-white text-black text-xs font-bold uppercase tracking-wider transition-none"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-[#c90000]" />
              <span>Attack: Non-Whitelisted Recipient</span>
            </button>
            <button
              onClick={() => runSafeAttack('OVER_LIMIT')}
              className="w-full flex items-center space-x-2 px-3 py-2 border-2 border-black bg-surface hover:bg-black hover:text-white text-black text-xs font-bold uppercase tracking-wider transition-none"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-[#c90000]" />
              <span>Attack: Exceed $25 Cap ($99,999)</span>
            </button>
            <button
              onClick={() => runSafeAttack('UNAUTHORIZED_SELECTOR')}
              className="w-full flex items-center space-x-2 px-3 py-2 border-2 border-black bg-surface hover:bg-black hover:text-white text-black text-xs font-bold uppercase tracking-wider transition-none"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-[#c90000]" />
              <span>Attack: Forbidden Selector (approve)</span>
            </button>
          </div>

          {attackLabOutput && (
            <div className="mt-3 border-2 border-[#c90000] p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 ${
                  attackLabOutput.status === 'REVERTED' ? 'bg-black text-white' : 'bg-[#c90000] text-white'
                }`}>
                  {attackLabOutput.status}
                </span>
                <button
                  onClick={clearAttackLab}
                  className="text-[10px] font-bold uppercase text-muted hover:text-black"
                >
                  Dismiss
                </button>
              </div>
              <div className="text-xs font-bold text-black mb-1">{attackLabOutput.attackType}</div>
              <div className="text-[11px] font-mono text-[#c90000] mb-1">{attackLabOutput.reason}</div>
              <div className="text-[11px] font-sans text-muted">{attackLabOutput.details}</div>
            </div>
          )}
        </div>
      </div>

      {/* Agent Reasoning Trace */}
      <div className="border-2 border-black p-4 bg-white">
        <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-2 border-b border-rule-light pb-1.5">
          Agent Reasoning Trace
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {reasoningTrace.map((line, i) => (
            <div key={i} className="flex space-x-2 text-[11px] font-mono">
              <span className="text-muted shrink-0 w-6 text-right">{i + 1}.</span>
              <span className="text-black">{line}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent UserOps */}
      <div className="border-2 border-black p-4 bg-white">
        <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-3 border-b border-rule-light pb-1.5">
          Recent UserOperations ({recentUserOps.length})
        </div>
        <div className="space-y-3">
          {recentUserOps.slice(0, 4).map((op) => (
            <div key={op.intentId} className="border-2 border-black p-3 bg-white hover:bg-surface transition-none">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                    op.executionSuccess ? 'bg-black text-white' : 'bg-[#c90000] text-white'
                  }`}>
                    {op.executionSuccess ? 'SUCCESS' : 'FAILED'}
                  </span>
                  <span className="text-xs font-bold font-mono text-black">{op.amount}</span>
                </div>
                <span className="text-[10px] font-mono text-muted">
                  Block #{op.blockNumber}
                </span>
              </div>
              <div className="text-[11px] font-mono text-muted">
                → {op.target}
              </div>
              {/* Lifecycle Steps */}
              <div className="mt-2 flex flex-wrap gap-1">
                {op.steps.map((step, si) => (
                  <span
                    key={si}
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 ${
                      step.status === 'COMPLETED' ? 'bg-surface text-black border border-black' :
                      step.status === 'FAILED' ? 'bg-[#c90000] text-white' :
                      'bg-white text-muted border border-rule-light'
                    }`}
                    title={step.detail}
                  >
                    {step.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── VIEW EXPORT ────────────────────────────────────────────────────
export const DashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      <AccountSummary />
      <AgentWorkbench />
    </div>
  );
};
