import React, { useState } from 'react';
import { useBastionStore } from '../store/useBastionStore';
import {
  Wallet,
  ShieldCheck,
  Key,
  CheckCircle2,
  XCircle,
  Lock,
  Sliders,
  FileText,
  RotateCcw,
  PlusCircle,
  Copy,
  Check,
  Building,
  UserCheck,
  Save,
  Sparkles,
  Trash2
} from 'lucide-react';

// ─── MODULE A: Policy Configuration ─────────────────────────────────
const PolicyConfig: React.FC = () => {
  const {
    smartAccountAddress,
    entryPointAddress,
    maxPerTxUsd,
    dailyAllowanceUsd,
    spentTodayUsd,
    activeSession,
    whitelistedVendors,
    allowedSelectors,
    allowlistedTargets,
    approvalTiers,
    revokeSessionKey
  } = useBastionStore();

  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(id);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Policy Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border-2 border-black p-4 bg-white">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted mb-1">
            Max Per Transaction
          </div>
          <div className="text-3xl font-extrabold font-mono text-black">${maxPerTxUsd.toFixed(2)}</div>
          <div className="text-[10px] font-mono text-muted mt-1">Hard-enforced on-chain</div>
        </div>
        <div className="border-2 border-black p-4 bg-white">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted mb-1">
            Daily Allowance
          </div>
          <div className="text-3xl font-extrabold font-mono text-black">${dailyAllowanceUsd.toFixed(2)}</div>
          <div className="text-[10px] font-mono text-muted mt-1">
            Spent today: ${spentTodayUsd.toFixed(2)} ({Math.round((spentTodayUsd / dailyAllowanceUsd) * 100)}%)
          </div>
        </div>
        <div className="border-2 border-black p-4 bg-white">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted mb-1">
            Session Key
          </div>
          <div className={`text-xl font-extrabold font-mono ${
            activeSession.status === 'ACTIVE' ? 'text-black' : 'text-[#c90000]'
          }`}>
            {activeSession.status}
          </div>
          <div className="text-[10px] font-mono text-muted mt-1">
            {activeSession.actorSession}
          </div>
        </div>
      </div>

      {/* Vendor Whitelist */}
      <div className="border-2 border-black p-4 bg-white">
        <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-3 border-b border-rule-light pb-1.5 flex items-center space-x-2">
          <Building className="w-3.5 h-3.5" />
          <span>Whitelisted Vendor Recipients ({whitelistedVendors.length})</span>
        </div>
        <div className="space-y-2">
          {whitelistedVendors.map((v, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-rule-light">
              <div>
                <div className="text-xs font-sans font-bold text-black">{v.label}</div>
                <div className="text-[10px] font-mono text-muted">{v.address}</div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono text-muted">{v.category}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-black text-white">
                  Since {v.verifiedSince}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selectors + Targets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Function Selectors */}
        <div className="border-2 border-black p-4 bg-white">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-3 border-b border-rule-light pb-1.5">
            Allowed Function Selectors
          </div>
          <div className="space-y-1.5">
            {allowedSelectors.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-rule-light">
                <div className="flex items-center space-x-2">
                  {s.allowed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-[#c90000]" />
                  )}
                  <span className="text-xs font-mono font-bold text-black">{s.selector}</span>
                </div>
                <span className="text-[10px] font-mono text-muted">{s.signature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Target Contracts */}
        <div className="border-2 border-black p-4 bg-white">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-3 border-b border-rule-light pb-1.5">
            Allowlisted Target Contracts
          </div>
          <div className="space-y-1.5">
            {allowlistedTargets.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-rule-light">
                <div className="flex items-center space-x-2">
                  {t.allowed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-[#c90000]" />
                  )}
                  <span className="text-xs font-mono font-bold text-black">{t.label}</span>
                </div>
                <span className="text-[10px] font-mono text-muted truncate max-w-[160px]">{t.address}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Approval Tiers Table */}
      <div className="border-2 border-black p-4 bg-white">
        <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-3 border-b border-rule-light pb-1.5 flex items-center space-x-2">
          <Key className="w-3.5 h-3.5" />
          <span>Approval Tier Escalation Matrix</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left py-2 pr-4 font-bold uppercase text-[10px]">Tier</th>
                <th className="text-left py-2 pr-4 font-bold uppercase text-[10px]">Card</th>
                <th className="text-right py-2 pr-4 font-bold uppercase text-[10px]">Ceiling</th>
                <th className="text-center py-2 pr-4 font-bold uppercase text-[10px]">OLED</th>
                <th className="text-center py-2 pr-4 font-bold uppercase text-[10px]">GPIO</th>
                <th className="text-center py-2 font-bold uppercase text-[10px]">Co-Sign</th>
              </tr>
            </thead>
            <tbody>
              {approvalTiers.map(tier => (
                <tr key={tier.tierNumber} className="border-b border-rule-light">
                  <td className="py-2 pr-4 font-bold text-black">{tier.name}</td>
                  <td className="py-2 pr-4 text-muted">{tier.cardName}</td>
                  <td className="py-2 pr-4 text-right font-bold text-black">${tier.maxCeilingUsd.toFixed(2)}</td>
                  <td className="py-2 pr-4 text-center">
                    {tier.requiresOledReview ? '■' : '□'}
                  </td>
                  <td className="py-2 pr-4 text-center">
                    {tier.requiresGpioButton ? '■' : '□'}
                  </td>
                  <td className="py-2 text-center">
                    {tier.requiresOwnerCosign ? '■' : '□'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── MODULE B: RPC & Demo Presets ───────────────────────────────────
const RpcAndPresets: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const {
    configSettings,
    saveConfigSettings,
    applyDemoPreset,
    userRole,
    setUserRole
  } = useBastionStore();

  const [rpcUrl, setRpcUrl] = useState(configSettings.rpcUrl);
  const [entryPoint, setEntryPoint] = useState(configSettings.entryPoint);
  const [bundlerUrl, setBundlerUrl] = useState(configSettings.bundlerUrl);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [testFeedback, setTestFeedback] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfigSettings({ rpcUrl, entryPoint, bundlerUrl });
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const handleTestConnection = () => {
    setTestFeedback(true);
    setTimeout(() => setTestFeedback(false), 2500);
  };

  const presets = [
    { num: 1 as const, label: 'Normal Autonomous Flow', desc: 'Submits a $12.50 payment within limits' },
    { num: 2 as const, label: 'Over-Limit Hardware Exception', desc: 'Triggers a $75.00 payment → ESP32 queue' },
    { num: 3 as const, label: 'Stolen Key Attack (Blocked)', desc: 'Non-whitelisted recipient → on-chain revert' },
    { num: 4 as const, label: 'Physical Panic Emergency', desc: 'GPIO32 panic → alarm + signing halt' },
    { num: 5 as const, label: 'Mirage Decoy Mode', desc: 'Activates synthetic fixture isolation' },
  ];

  return (
    <div className="space-y-4">
      {/* RPC Config */}
      <div className="border-2 border-black p-4 bg-white">
        <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-3 border-b border-rule-light pb-1.5">
          RPC & Bundler Configuration
        </div>
        <form onSubmit={handleSaveConfig} className="space-y-3">
          <div>
            <label className="block text-[10px] font-mono uppercase text-muted mb-1">Anvil RPC URL</label>
            <input
              type="text"
              value={rpcUrl}
              onChange={e => setRpcUrl(e.target.value)}
              className="w-full border-2 border-black px-3 py-2 text-xs font-mono bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-muted mb-1">EntryPoint Address</label>
            <input
              type="text"
              value={entryPoint}
              onChange={e => setEntryPoint(e.target.value)}
              className="w-full border-2 border-black px-3 py-2 text-xs font-mono bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-muted mb-1">Bundler URL</label>
            <input
              type="text"
              value={bundlerUrl}
              onChange={e => setBundlerUrl(e.target.value)}
              className="w-full border-2 border-black px-3 py-2 text-xs font-mono bg-white focus:outline-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-[#c90000] transition-none"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveFeedback ? '✓ Saved' : 'Save Config'}</span>
            </button>
            <button
              type="button"
              onClick={handleTestConnection}
              className="flex items-center space-x-1.5 px-4 py-2 border-2 border-black bg-surface text-black text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-none"
            >
              <span>{testFeedback ? '✓ Connected (12ms)' : 'Test Connection'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Demo Presets */}
      <div className="border-2 border-black p-4 bg-white">
        <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-3 border-b border-rule-light pb-1.5 flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Demo Scenario Presets</span>
        </div>
        <p className="text-[11px] font-sans text-muted mb-3">
          One-click scenarios to demonstrate Bastion X's core security primitives.
        </p>
        <div className="space-y-2">
          {presets.map(p => (
            <button
              key={p.num}
              onClick={() => {
                applyDemoPreset(p.num);
                if (p.num === 2) onNavigate('approvals');
                if (p.num === 4) onNavigate('security');
              }}
              className="w-full flex items-center justify-between p-3 border-2 border-black bg-white hover:bg-surface transition-none text-left"
            >
              <div>
                <div className="text-xs font-sans font-bold text-black flex items-center space-x-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-black text-white">
                    #{p.num}
                  </span>
                  <span>{p.label}</span>
                </div>
                <div className="text-[10px] font-mono text-muted mt-0.5">{p.desc}</div>
              </div>
              <Sparkles className="w-4 h-4 text-muted shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── VIEW EXPORT ────────────────────────────────────────────────────
export const SettingsView: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const [tab, setTab] = useState<'policy' | 'config'>('policy');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b-2 border-black pb-4">
        <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-[#c90000] mb-1.5 flex items-center space-x-2">
          <span className="w-2 h-2 bg-[#c90000] inline-block" />
          <span>04 / CONFIGURATION</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black leading-none uppercase">
          POLICY & PRESETS.
        </h1>
        <p className="text-sm font-sans text-muted mt-2 max-w-2xl">
          On-chain policy dimensions, vendor whitelist, selector restrictions, RPC configuration, and demo presets.
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex border-2 border-black">
        {[
          { id: 'policy' as const, label: 'Policy & Vendors' },
          { id: 'config' as const, label: 'RPC & Demo Presets' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-xs font-sans font-bold uppercase tracking-[0.12em] border-r-2 border-black last:border-r-0 transition-none ${
              tab === t.id ? 'bg-black text-white' : 'bg-white text-black hover:bg-surface'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'policy' && <PolicyConfig />}
      {tab === 'config' && <RpcAndPresets onNavigate={onNavigate} />}
    </div>
  );
};
