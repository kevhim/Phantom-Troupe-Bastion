import React, { useState } from 'react';
import { useBastionStore } from '../store/useBastionStore';
import { testLanConnection } from '../services/hardwareBridge';
import {
  Radio,
  Server,
  Activity,
  Thermometer,
  Bell,
  AlertTriangle,
  RefreshCw,
  Volume2,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Zap,
} from 'lucide-react';

export const HardwareView: React.FC = () => {
  const store = useBastionStore();

  const [apiUrl, setApiUrl] = useState(store.apiBaseUrl);
  const [rpcUrl, setRpcUrl] = useState(store.rpcUrl);
  const [testingLan, setTestingLan] = useState(false);
  const [lanResults, setLanResults] = useState<{
    tested: boolean;
    apiOk: boolean;
    rpcOk: boolean;
    apiLatency: number;
    rpcLatency: number;
    blockNumber?: number;
  } | null>(null);

  const [pinging, setPinging] = useState(false);
  const [polling, setPolling] = useState(false);
  const [buzzing, setBuzzing] = useState(false);

  const handlePing = async () => {
    setPinging(true);
    await store.pingEsp32();
    setTimeout(() => setPinging(false), 300);
  };

  const handlePoll = async () => {
    setPolling(true);
    await store.pollSensors();
    setTimeout(() => setPolling(false), 300);
  };

  const handleTestBuzzer = async () => {
    setBuzzing(true);
    await store.testBuzzer();
    setTimeout(() => setBuzzing(false), 2400);
  };

  const handleSaveAndTestLan = async () => {
    store.saveLanConfig(apiUrl, rpcUrl);
    setTestingLan(true);
    const results = await testLanConnection(apiUrl, rpcUrl);
    setLanResults({ tested: true, ...results });
    setTestingLan(false);
  };

  const isPanic = store.emergencyState === 'PANIC_FROZEN';

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Device & Sensor Diagnostics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Hardware bridge telemetry, IoT environmental sensors, emergency freeze latches, and network RPC status.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ═══ LEFT CARD: LIVE IOT SENSORS & EMERGENCY FREEZE ═══ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <Radio size={18} className="text-slate-700" />
                <h2 className="text-base font-semibold text-slate-900">Live IoT Sensors & Emergency Freeze</h2>
              </div>
              <span className="text-xs font-mono font-medium text-slate-600 bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-full">
                Laptop B Hub
              </span>
            </div>

            {/* Clean Status Rows */}
            <div className="space-y-3 mb-6 text-xs">
              {/* Row 1: ESP32 Signer */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-800 font-medium">ESP32 #1 Signer</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 font-mono">
                  <span className="text-emerald-700 font-medium">Online</span>
                  <span>•</span>
                  <span>Heartbeat {store.hardwareBridgePingMs}ms</span>
                </div>
              </div>

              {/* Row 2: Uno #1 PIR Motion & Optical Check */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <Activity size={14} className="text-slate-400" />
                  <span className="text-slate-800 font-medium">Uno #1 PIR & Optical Check</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 font-mono">
                  <span className={store.pirMotion ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                    {store.pirMotion ? 'Motion Active' : 'No Motion'}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 font-medium">Optical Verified</span>
                </div>
              </div>

              {/* Row 3: DHT11 Environment */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <Thermometer size={14} className="text-slate-400" />
                  <span className="text-slate-800 font-medium">DHT11 Environment</span>
                </div>
                <div className="text-slate-700 font-mono">
                  {store.dht11Temp.toFixed(1)}°C{' '}
                  <span className="text-slate-400">/</span> {store.dht11Humidity}% Humidity
                </div>
              </div>

              {/* Row 4: ESP8266 Alarm Buzzer */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <Bell size={14} className={store.esp8266BuzzerActive ? 'text-rose-600 animate-bounce' : 'text-slate-400'} />
                  <span className="text-slate-800 font-medium">ESP8266 Alarm Buzzer</span>
                </div>
                <div className="font-mono">
                  {store.esp8266BuzzerActive ? (
                    <span className="text-rose-700 font-semibold px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200/60 animate-pulse">
                      ALARM ACTIVE
                    </span>
                  ) : (
                    <span className="text-slate-500">Ready</span>
                  )}
                </div>
              </div>

              {/* Row 5: Emergency Freeze State */}
              <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                isPanic
                  ? 'bg-rose-50 border-rose-200/80 text-rose-950'
                  : 'bg-slate-50/70 border-slate-200/70'
              }`}>
                <div className="flex items-center gap-2.5">
                  <AlertTriangle size={14} className={isPanic ? 'text-rose-600' : 'text-slate-400'} />
                  <span className="font-medium text-slate-800">Emergency Freeze State</span>
                </div>
                <div className="font-mono font-medium">
                  {isPanic ? (
                    <span className="text-rose-700 font-bold tracking-wide">PANIC FROZEN</span>
                  ) : (
                    <span className="text-emerald-700 font-bold">NORMAL</span>
                  )}
                </div>
              </div>
            </div>

            {/* Test Buttons */}
            <div className="pt-2">
              <div className="text-xs font-medium text-slate-500 mb-2">Diagnostic Triggers</div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handlePing}
                  disabled={pinging}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-center gap-2"
                >
                  <RefreshCw size={13} className={pinging ? 'animate-spin' : ''} />
                  <span>Ping ESP32</span>
                </button>

                <button
                  onClick={handleTestBuzzer}
                  disabled={buzzing}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-center gap-2"
                >
                  <Volume2 size={13} className={buzzing ? 'text-rose-600' : ''} />
                  <span>Test Buzzer</span>
                </button>

                <button
                  onClick={handlePoll}
                  disabled={polling}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-center gap-2"
                >
                  <Activity size={13} className={polling ? 'animate-spin' : ''} />
                  <span>Poll Sensors</span>
                </button>

                {isPanic ? (
                  <button
                    onClick={() => store.resetPanic()}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={13} />
                    <span>Reset Freeze</span>
                  </button>
                ) : (
                  <button
                    onClick={() => store.pressGpioPanic()}
                    className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 text-rose-700 text-xs font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <AlertTriangle size={13} />
                    <span>Trigger Freeze</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT CARD: LAPTOP A / LAN CONNECTION & AUDIT CHECK ═══ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <Server size={18} className="text-slate-700" />
                <h2 className="text-base font-semibold text-slate-900">Laptop A / LAN Connection</h2>
              </div>
              <span className="text-xs font-mono font-medium text-slate-600 bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-full">
                Network Bridge
              </span>
            </div>

            {/* LAN Inputs */}
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Laptop A API URL (FastAPI)
                </label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://192.168.1.10:8000"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-mono transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Anvil RPC URL (Chain 31337)
                </label>
                <input
                  type="text"
                  value={rpcUrl}
                  onChange={(e) => setRpcUrl(e.target.value)}
                  placeholder="http://192.168.1.10:8545"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-mono transition-all outline-none"
                />
              </div>

              <button
                onClick={handleSaveAndTestLan}
                disabled={testingLan}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Zap size={14} className={testingLan ? 'animate-spin' : ''} />
                <span>{testingLan ? 'Testing Network...' : 'Save & Test LAN Connection'}</span>
              </button>

              {lanResults && lanResults.tested && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">API Health:</span>
                    <span className={lanResults.apiOk ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
                      {lanResults.apiOk ? `OK (${lanResults.apiLatency}ms)` : 'Unreachable'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Anvil RPC:</span>
                    <span className={lanResults.rpcOk ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
                      {lanResults.rpcOk ? `OK (${lanResults.rpcLatency}ms, Block #${lanResults.blockNumber})` : 'Unreachable'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ═══ AUDIT LOG INTEGRITY CHECK ═══ */}
            <div className="pt-5 border-t border-slate-100">
              <div className="text-xs font-medium text-slate-500 mb-2.5">
                Audit Log Integrity Check
              </div>

              <div
                className={`p-4 rounded-xl border mb-3 text-xs transition-colors ${
                  store.tamperDetected
                    ? 'bg-rose-50/70 border-rose-200/80 text-rose-950'
                    : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 font-semibold">
                  {store.tamperDetected ? (
                    <>
                      <ShieldAlert size={16} className="text-rose-600" />
                      <span>Hash Chain Compromised — Tamper Detected!</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} className="text-emerald-600" />
                      <span>Hash Chain Intact</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {store.tamperDetected
                    ? 'Digest payload mutated at log index #2. Cryptographic parent hash validation failed.'
                    : 'All 4 immutable log entries verify against SHA-256 parent hash sequence.'}
                </p>
              </div>

              <button
                onClick={() => store.toggleAuditTamper()}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-medium transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
                  store.tamperDetected
                    ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {store.tamperDetected ? 'Restore Original Hash Chain' : 'Test Log Tamper Detection'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HardwareView;
