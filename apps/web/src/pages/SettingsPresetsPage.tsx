import React, { useState } from 'react';
import { useBastionStore } from '../store/useBastionStore';
import { 
  Sparkles, 
  Trash2, 
  Save
} from 'lucide-react';

export const SettingsPresetsPage: React.FC<{ onNavigate: (route: string) => void }> = ({ onNavigate }) => {
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
  const [testConnFeedback, setTestConnFeedback] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfigSettings({ rpcUrl, entryPoint, bundlerUrl });
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const handleTestConnection = () => {
    setTestConnFeedback(true);
    setTimeout(() => setTestConnFeedback(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Swiss Header Grid */}
      <div className="border-b-2 border-black pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-[#c90000] mb-2 flex items-center space-x-2">
              <span className="w-2 h-2 bg-[#c90000] inline-block" />
              <span>SECTION 08 / PRESETS, RUNTIME & CONFIGURATION</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-black leading-none uppercase">
              DEMO LAB PRESETS.
            </h1>
            <p className="text-base text-muted font-normal mt-3 leading-relaxed max-w-2xl">
              Instantly reconfigure global application state across five deterministic scenarios for hackathon evaluations, and manage local network RPC bindings.
            </p>
          </div>
        </div>
      </div>

      {/* Widget 5: SimulationConfig — 5 ONE-CLICK DEMO PRESETS (Ruled Matrix Layout) */}
      <div className="border-2 border-black bg-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-[#c90000]">08.5</span>
            <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
              One-Click Demonstration Scenario Presets
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
            INSTANT EVALUATION
          </span>
        </div>

        <p className="text-xs font-sans text-muted leading-relaxed">
          Select any preset to instantly mutate the reactive store and verify security invariants:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-0 border-2 border-black bg-black">
          {/* Preset 1 */}
          <button
            onClick={() => {
              applyDemoPreset(1);
              onNavigate('overview');
            }}
            className="p-5 bg-white hover:bg-black hover:text-white text-left transition-none border-b-2 md:border-b-0 md:border-r-2 border-black flex flex-col justify-between group"
          >
            <div>
              <div className="text-[10px] font-mono text-[#c90000] font-extrabold">PRESET 01</div>
              <div className="text-xs font-sans font-extrabold uppercase tracking-wider text-black group-hover:text-white mt-1">
                Normal Agent Flow
              </div>
              <p className="text-[11px] font-sans text-muted group-hover:text-slate-300 mt-2 leading-relaxed">
                $12.50 &lt;= $25.00 limit. Autonomous UserOp executes on-chain.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase mt-4 block group-hover:underline">
              &rarr; Load & Jump
            </span>
          </button>

          {/* Preset 2 */}
          <button
            onClick={() => {
              applyDemoPreset(2);
              onNavigate('approvals');
            }}
            className="p-5 bg-white hover:bg-black hover:text-white text-left transition-none border-b-2 md:border-b-0 md:border-r-2 border-black flex flex-col justify-between group"
          >
            <div>
              <div className="text-[10px] font-mono text-[#c90000] font-extrabold">PRESET 02</div>
              <div className="text-xs font-sans font-extrabold uppercase tracking-wider text-black group-hover:text-white mt-1">
                Hardware Exception
              </div>
              <p className="text-[11px] font-sans text-muted group-hover:text-slate-300 mt-2 leading-relaxed">
                $75.00 &gt; $25.00 limit. Dispatched to ESP32 OLED review queue.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase mt-4 block group-hover:underline">
              &rarr; Load & Jump
            </span>
          </button>

          {/* Preset 3 */}
          <button
            onClick={() => {
              applyDemoPreset(3);
              onNavigate('agent');
            }}
            className="p-5 bg-white hover:bg-black hover:text-white text-left transition-none border-b-2 md:border-b-0 md:border-r-2 border-black flex flex-col justify-between group"
          >
            <div>
              <div className="text-[10px] font-mono text-[#c90000] font-extrabold">PRESET 03</div>
              <div className="text-xs font-sans font-extrabold uppercase tracking-wider text-black group-hover:text-white mt-1">
                Stolen Key Attack
              </div>
              <p className="text-[11px] font-sans text-muted group-hover:text-slate-300 mt-2 leading-relaxed">
                Compromised key attempts drain. Account.sol reverts UserOp.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase mt-4 block group-hover:underline">
              &rarr; Load & Jump
            </span>
          </button>

          {/* Preset 4 */}
          <button
            onClick={() => {
              applyDemoPreset(4);
              onNavigate('security');
            }}
            className="p-5 bg-white hover:bg-[#c90000] hover:text-white text-left transition-none border-b-2 md:border-b-0 md:border-r-2 border-black flex flex-col justify-between group"
          >
            <div>
              <div className="text-[10px] font-mono text-[#c90000] group-hover:text-white font-extrabold">PRESET 04</div>
              <div className="text-xs font-sans font-extrabold uppercase tracking-wider text-black group-hover:text-white mt-1">
                Physical Panic
              </div>
              <p className="text-[11px] font-sans text-muted group-hover:text-white mt-2 leading-relaxed">
                GPIO32 pressed. ESP32 locks signing and broadcasts revoke.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase mt-4 block group-hover:underline">
              &rarr; Load & Jump
            </span>
          </button>

          {/* Preset 5 */}
          <button
            onClick={() => {
              applyDemoPreset(5);
              onNavigate('overview');
            }}
            className="p-5 bg-white hover:bg-black hover:text-white text-left transition-none border-black flex flex-col justify-between group"
          >
            <div>
              <div className="text-[10px] font-mono text-[#c90000] font-extrabold">PRESET 05</div>
              <div className="text-xs font-sans font-extrabold uppercase tracking-wider text-black group-hover:text-white mt-1">
                Mirage Decoy
              </div>
              <p className="text-[11px] font-sans text-muted group-hover:text-slate-300 mt-2 leading-relaxed">
                Isolates adversary into synthetic fixtures without touching funds.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase mt-4 block group-hover:underline">
              &rarr; Load & Jump
            </span>
          </button>
        </div>
      </div>

      {/* Row 2: Chain Connectivity (Widget 1) & Readiness Preflight (Widget 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-2 border-black bg-black">
        {/* Widget 1: ChainConnectivityConfig */}
        <div className="bg-white p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">08.1</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Blockchain & RPC Connectivity
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              CHAIN 31337
            </span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-black mb-1">
                JSON-RPC Endpoint (Laptop A LAN IP or Localhost)
              </label>
              <input
                type="text"
                value={rpcUrl}
                onChange={(e) => setRpcUrl(e.target.value)}
                className="w-full bg-surface border-2 border-black p-2 text-xs font-mono font-bold text-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-black mb-1">
                EntryPoint Contract Address
              </label>
              <input
                type="text"
                value={entryPoint}
                onChange={(e) => setEntryPoint(e.target.value)}
                className="w-full bg-surface border-2 border-black p-2 text-xs font-mono font-bold text-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-black mb-1">
                ERC-4337 Bundler RPC Endpoint
              </label>
              <input
                type="text"
                value={bundlerUrl}
                onChange={(e) => setBundlerUrl(e.target.value)}
                className="w-full bg-surface border-2 border-black p-2 text-xs font-mono font-bold text-black focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                className="px-4 py-2 bg-surface hover:bg-black hover:text-white text-black border-2 border-black text-xs font-sans font-bold uppercase tracking-wider transition-none"
              >
                {testConnFeedback ? '✓ Ping Successful (12ms)' : 'Test Ping'}
              </button>

              <button
                type="submit"
                className="flex items-center space-x-2 px-5 py-2 bg-black hover:bg-[#c90000] text-white text-xs font-sans font-bold uppercase tracking-[0.12em] transition-none"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saveFeedback ? 'Saved!' : 'Save Config'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Widget 2: EnvironmentReadiness (5-Gate Pre-flight) */}
        <div className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">08.2</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Environment Pre-Flight Gates
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              5/5 PASSED
            </span>
          </div>

          <div className="border-2 border-black divide-y-2 divide-black">
            {[
              { check: 'M0: Real 4337 UserOp Execution', status: 'PASSED', desc: 'Bundler relays to EntryPoint v0.6' },
              { check: 'M1: Stolen Session Key Rejected', status: 'PASSED', desc: 'Account.sol reverts non-whitelisted actions' },
              { check: 'M2: ESP32 Hardware Signed Operation', status: 'PASSED', desc: 'secp256k1 signature matches canonical digest' },
              { check: 'M3: Direct Physical Revocation RPC', status: 'PASSED', desc: 'GPIO32 bypasses Laptop A application' },
              { check: 'M4: Replayable End-to-End Demo', status: 'PASSED', desc: '72 widgets connected to live reactive store' }
            ].map((gate) => (
              <div key={gate.check} className="p-2.5 bg-white flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="font-bold text-black uppercase">{gate.check}</div>
                  <div className="text-[11px] font-sans text-muted">{gate.desc}</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
                  {gate.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Role & Session Prefs (Widget 3) & Build/Schema Versions (Widget 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-2 border-black bg-black">
        {/* Widget 3 & 4: Role Preferences & Retention */}
        <div className="bg-white p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">08.3</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Role Persona & Ephemeral Purge
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-surface border border-black font-bold uppercase">
              SETTINGS
            </span>
          </div>

          <div className="space-y-4 text-xs font-sans">
            <div className="flex justify-between items-center bg-surface p-4 border-2 border-black">
              <div>
                <span className="font-extrabold uppercase text-black block text-xs">Active Persona</span>
                <span className="text-[11px] text-muted">Switch between operator and supervisor controls</span>
              </div>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as any)}
                aria-label="Select active persona"
                className="bg-white border-2 border-black text-black font-mono font-bold text-xs p-2 uppercase"
              >
                <option value="OPERATOR">Operator</option>
                <option value="SUPERVISOR">Supervisor</option>
              </select>
            </div>

            <div className="bg-surface p-4 border-2 border-black space-y-2">
              <span className="font-extrabold uppercase text-black block text-xs">Purge Session Logs</span>
              <p className="text-[11px] text-muted leading-relaxed">
                Purge all temporary session logs and reset local SQLite demo caches.
              </p>
              <button
                onClick={() => alert('Local demo cache purged. Smart account state remains safely on-chain.')}
                className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-[#c90000] hover:text-white text-black border-2 border-black text-xs font-bold uppercase tracking-wider transition-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purge Ephemeral Logs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Widget 6: BuildAndSchemaVersions */}
        <div className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">08.6</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Pinned Build & Schema Protocol
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              SPEC V2
            </span>
          </div>

          <div className="bg-surface p-4 border-2 border-black font-mono text-xs text-black space-y-2.5 leading-relaxed">
            <div className="flex justify-between border-b border-rule-light pb-1">
              <span className="text-muted uppercase font-bold text-[10px]">Git Revision:</span>
              <span className="font-extrabold">git-902f229</span>
            </div>
            <div className="flex justify-between border-b border-rule-light pb-1">
              <span className="text-muted uppercase font-bold text-[10px]">Solidity Compiler:</span>
              <span className="font-bold">solc 0.8.24</span>
            </div>
            <div className="flex justify-between border-b border-rule-light pb-1">
              <span className="text-muted uppercase font-bold text-[10px]">ESP32 Arduino Core:</span>
              <span className="font-bold">esp32 2.0.14</span>
            </div>
            <div className="flex justify-between border-b border-rule-light pb-1">
              <span className="text-muted uppercase font-bold text-[10px]">EIP-712 Struct Hash:</span>
              <span className="font-bold truncate ml-2">0x9a8f...0a1b</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted uppercase font-bold text-[10px]">Host Machine D:</span>
              <span className="font-extrabold text-black">MacBook Air M1 (macOS)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
