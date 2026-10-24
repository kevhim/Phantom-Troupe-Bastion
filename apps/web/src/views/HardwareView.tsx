import React, { useState } from 'react';
import { useBastionStore } from '../store/useBastionStore';
import { testLanConnection } from '../services/hardwareBridge';

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
      {/* ═══ TWO-COLUMN REAL GLASS CARDS (24px PADDING) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ═══ LEFT CARD: LIVE IOT SENSORS & EMERGENCY FREEZE ═══ */}
        <div className="glass p-6 text-white/90 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-sm font-bold tracking-wide uppercase text-white/90">
                    IoT Peripherals & Sensors
                  </h2>
                  <span className="font-serif italic text-xs text-white/45">§ 4.1</span>
                </div>
                <p className="text-xs text-white/60 mt-0.5">
                  Real-time telemetry from Laptop B edge supervisor
                </p>
              </div>
              <span className="text-[10px] font-mono text-white/45 uppercase tracking-widest">
                Serial Bridge
              </span>
            </div>

            {/* Status Rows */}
            <div className="space-y-2 mb-6 text-xs">
              {/* Row 1: ESP32 Signer */}
              <div className="glass rounded-[8px] p-3 flex items-center justify-between">
                <div>
                  <div className="font-bold uppercase tracking-tight text-white/90 text-xs">
                    ESP32 #1 Signer
                  </div>
                  <div className="text-[10px] font-mono text-white/45 mt-0.5">
                    Dual OLED @ 0x3C / 0x3D • RC522 SPI
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 inline-block" />
                  <span className="text-emerald-300 font-bold text-[10px] uppercase">
                    ONLINE
                  </span>
                  <span className="text-white/45 text-[10px] tabular-nums">{store.hardwareBridgePingMs}ms</span>
                </div>
              </div>

              {/* Row 2: Uno #1 PIR Motion & Optical Check */}
              <div className="glass rounded-[8px] p-3 flex items-center justify-between">
                <div>
                  <div className="font-bold uppercase tracking-tight text-white/90 text-xs">
                    Uno #1 PIR Motion & Optical
                  </div>
                  <div className="text-[10px] font-mono text-white/45 mt-0.5">
                    Physical Presence Sensor • Laptop B
                  </div>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase">
                  <span
                    className={`w-1.5 h-1.5 rounded-none inline-block ${
                      store.pirMotion ? 'bg-emerald-400' : 'bg-white/30'
                    }`}
                  />
                  <span className="text-white/70 font-semibold">
                    {store.pirMotion ? 'MOTION ACTIVE' : 'NO MOTION'}
                  </span>
                </div>
              </div>

              {/* Row 3: DHT11 Environment */}
              <div className="glass rounded-[8px] p-3 flex items-center justify-between">
                <div>
                  <div className="font-bold uppercase tracking-tight text-white/90 text-xs">
                    DHT11 Environmental Sensor
                  </div>
                  <div className="text-[10px] font-mono text-white/45 mt-0.5">
                    Ambient Temperature & Humidity
                  </div>
                </div>
                <div className="font-mono text-xs font-bold text-white/90 tabular-nums">
                  {store.dht11Temp.toFixed(1)}°C{' '}
                  <span className="text-white/45 font-normal">/</span> {store.dht11Humidity}% RH
                </div>
              </div>

              {/* Row 4: ESP8266 Alarm Buzzer */}
              <div className="glass rounded-[8px] p-3 flex items-center justify-between">
                <div>
                  <div className="font-bold uppercase tracking-tight text-white/90 text-xs">
                    Alarm Buzzer (Uno #1 Pin D8)
                  </div>
                  <div className="text-[10px] font-mono text-white/45 mt-0.5">
                    Audible Breach Alert Latch
                  </div>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase">
                  <span
                    className={`w-1.5 h-1.5 rounded-none inline-block ${
                      store.esp8266BuzzerActive ? 'bg-rose-400' : 'bg-white/30'
                    }`}
                  />
                  <span className={store.esp8266BuzzerActive ? 'text-rose-300 font-bold' : 'text-white/70'}>
                    {store.esp8266BuzzerActive ? 'BUZZER ACTIVE' : 'STANDBY'}
                  </span>
                </div>
              </div>

              {/* Row 5: Emergency Freeze State */}
              <div className="glass rounded-[8px] p-3 flex items-center justify-between">
                <div>
                  <div className="font-bold uppercase tracking-tight text-white/90 text-xs">
                    Emergency Freeze State
                  </div>
                  <div className="text-[10px] font-mono text-white/45 mt-0.5">
                    Anti-Rollback Circuit Breaker
                  </div>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase">
                  <span
                    className={`w-1.5 h-1.5 rounded-none inline-block ${
                      isPanic ? 'bg-rose-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span className={isPanic ? 'text-rose-300 font-bold' : 'text-emerald-300 font-bold'}>
                    {isPanic ? 'PANIC FROZEN' : 'NORMAL OK'}
                  </span>
                </div>
              </div>
            </div>

            {/* Diagnostic Action Keys */}
            <div>
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium block mb-2">
                Hardware Diagnostic Triggers
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handlePing}
                  disabled={pinging}
                  className="glass-btn py-2.5 px-3 text-[10px] font-mono uppercase tracking-widest font-semibold cursor-pointer text-center"
                >
                  {pinging ? 'Pinging...' : 'Ping ESP32'}
                </button>

                <button
                  onClick={handleTestBuzzer}
                  disabled={buzzing}
                  className="glass-btn py-2.5 px-3 text-[10px] font-mono uppercase tracking-widest font-semibold cursor-pointer text-center"
                >
                  {buzzing ? 'Buzzing...' : 'Test Buzzer'}
                </button>

                <button
                  onClick={handlePoll}
                  disabled={polling}
                  className="glass-btn py-2.5 px-3 text-[10px] font-mono uppercase tracking-widest font-semibold cursor-pointer text-center"
                >
                  {polling ? 'Polling...' : 'Poll Sensors'}
                </button>

                {isPanic ? (
                  <button
                    onClick={() => store.resetPanic()}
                    className="glass-status-emerald py-2.5 px-3 rounded-[8px] text-emerald-300 font-mono text-[10px] uppercase tracking-widest font-bold cursor-pointer text-center"
                  >
                    Reset Freeze
                  </button>
                ) : (
                  <button
                    onClick={() => store.pressGpioPanic()}
                    className="glass-status-crimson py-2.5 px-3 rounded-[8px] text-rose-300 font-mono text-[10px] uppercase tracking-widest font-bold cursor-pointer text-center"
                  >
                    Trigger Freeze
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT CARD: LAPTOP A / LAN CONNECTION & AUDIT CHECK ═══ */}
        <div className="glass p-6 text-white/90 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-sm font-bold tracking-wide uppercase text-white/90">
                    LAN Bridge & Cryptographic Audit
                  </h2>
                  <span className="font-serif italic text-xs text-white/45">§ 4.2</span>
                </div>
                <p className="text-xs text-white/60 mt-0.5">
                  Laptop A API (:8000) & Anvil EVM (:8545)
                </p>
              </div>
              <span className="text-[10px] font-mono text-white/45 uppercase tracking-widest">
                Network Bridge
              </span>
            </div>

            {/* LAN Inputs */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium mb-1.5">
                  Laptop A API URL (FastAPI)
                </label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://192.168.1.10:8000"
                  className="glass-well w-full px-3.5 py-2.5 text-xs font-mono transition-colors outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium mb-1.5">
                  Anvil RPC URL (Chain 31337)
                </label>
                <input
                  type="text"
                  value={rpcUrl}
                  onChange={(e) => setRpcUrl(e.target.value)}
                  placeholder="http://192.168.1.10:8545"
                  className="glass-well w-full px-3.5 py-2.5 text-xs font-mono transition-colors outline-none"
                />
              </div>

              <button
                onClick={handleSaveAndTestLan}
                disabled={testingLan}
                className="glass-btn-primary w-full py-3 px-4 font-mono text-xs uppercase tracking-[0.18em] font-semibold transition-all cursor-pointer text-center"
              >
                {testingLan ? 'Testing Network Bridge...' : 'Save & Test LAN Connection'}
              </button>

              {lanResults && lanResults.tested && (
                <div className="glass rounded-[8px] p-3 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-white/45 font-sans text-[11px] uppercase tracking-wider">FastAPI Node:</span>
                    <span className={lanResults.apiOk ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                      {lanResults.apiOk ? `REACHABLE (${lanResults.apiLatency}ms)` : 'UNREACHABLE'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/45 font-sans text-[11px] uppercase tracking-wider">Anvil RPC:</span>
                    <span className={lanResults.rpcOk ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                      {lanResults.rpcOk ? `CONNECTED (${lanResults.rpcLatency}ms, Block #${lanResults.blockNumber})` : 'UNREACHABLE'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ═══ AUDIT LOG INTEGRITY CHECK ═══ */}
            <div className="pt-5 border-t border-white/[0.08]">
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium block mb-2">
                Cryptographic Audit Log Integrity
              </span>

              <div
                className={`p-3.5 rounded-[8px] mb-3 text-xs transition-colors ${
                  store.tamperDetected
                    ? 'glass-status-crimson text-rose-200'
                    : 'glass-status-emerald text-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-none inline-block ${
                      store.tamperDetected ? 'bg-rose-400' : 'bg-emerald-400'
                    }`} />
                    <span className="font-mono text-xs uppercase tracking-widest font-bold">
                      {store.tamperDetected ? 'Tamper Detected' : 'Hash Chain Verified'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-black/40 text-white/80 px-2 py-0.5 rounded-[4px]">
                    SHA-256
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-80 font-sans">
                  {store.tamperDetected
                    ? 'Digest payload mutated at log index #2. Parent hash chain validation failed on-chain.'
                    : 'All 4 immutable log entries successfully verify against SHA-256 parent hash sequence.'}
                </p>
              </div>

              <button
                onClick={() => store.toggleAuditTamper()}
                className="glass-btn w-full py-2.5 px-3 font-mono text-[10px] uppercase tracking-widest font-semibold cursor-pointer text-center"
              >
                {store.tamperDetected ? 'Restore Cryptographic Hash Chain' : 'Simulate Log Tampering Attack'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HardwareView;
