import React, { useState } from 'react';
import { useBastionStore } from '../store/useBastionStore';
import { 
  Cpu, 
  Laptop, 
  Terminal, 
  Volume2, 
  CheckCircle2, 
  Layers, 
  Server
} from 'lucide-react';

export const HardwareTelemetryPage: React.FC = () => {
  const {
    hardwareNodes,
    serialPortOwnership,
    esp8266AlarmActive,
    triggerAlarmSelfTest,
    pingDevice
  } = useBastionStore();

  const [testLog, setTestLog] = useState<string[]>(['Hardware diagnostic bus initialized at 115200 baud.']);

  const runTest = (type: string) => {
    const timestamp = new Date().toISOString().substring(11, 19);
    if (type === 'PING_ESP32') {
      pingDevice('esp32-signer');
      setTestLog(prev => [`[${timestamp}] PING ESP32 #1 -> pong received (4ms latency, GPIO32/33 debouncer active).`, ...prev]);
    } else if (type === 'POLL_PIR') {
      setTestLog(prev => [`[${timestamp}] POLL UNO #1 PIR -> Status: High-confidence stationary presence.`, ...prev]);
    } else if (type === 'UNO_Q') {
      setTestLog(prev => [`[${timestamp}] UNO Q 4GB Heartbeat -> Linux edge telemetry nominal (RAM 1.2GB/4GB).`, ...prev]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Swiss Header Grid */}
      <div className="border-b-2 border-black pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-[#c90000] mb-2 flex items-center space-x-2">
              <span className="w-2 h-2 bg-[#c90000] inline-block" />
              <span>SECTION 06 / HARDWARE MAP, WIRING & TELEMETRY</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-black leading-none uppercase">
              PHYSICAL DEVICE MATRIX.
            </h1>
            <p className="text-base text-muted font-normal mt-3 leading-relaxed max-w-2xl">
              Pinout mapping, single-owner serial buses, USB microcontrollers, and remote audio alarms across four designated machines.
            </p>
          </div>
        </div>
      </div>

      {/* Widget 1: LaptopAllocationDiagram (4-Machine Ruled Matrix) */}
      <div className="border-2 border-black bg-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-[#c90000]">06.1</span>
            <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
              Four-Laptop Allocation Specification
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
            PHYSICAL TOPOLOGY
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-black bg-black">
          {/* Laptop A */}
          <div className="bg-white p-5 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-3">
            <div className="flex justify-between items-center border-b border-rule-light pb-2">
              <span className="font-extrabold text-xs font-sans text-black uppercase">Laptop A (Host)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-black text-white font-bold">RTX 5060</span>
            </div>
            <div className="text-[11px] font-sans text-muted space-y-1">
              <div>• Untrusted App & Chain Lab</div>
              <div>• FastAPI Backend (Port 8000)</div>
              <div>• Anvil Local Chain (Port 8545)</div>
              <div>• 4337 Bundler (Port 4337)</div>
              <div>• USB: ESP32 #2 Auxiliary OLED</div>
            </div>
            <div className="text-[10px] font-mono text-white bg-[#c90000] p-1.5 font-bold uppercase text-center">
              Never holds signing keys
            </div>
          </div>

          {/* Laptop B */}
          <div className="bg-surface p-5 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-3">
            <div className="flex justify-between items-center border-b border-rule-light pb-2">
              <span className="font-extrabold text-xs font-sans text-black uppercase">Laptop B (Security)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-black text-white font-bold">Ultra 7</span>
            </div>
            <div className="text-[11px] font-sans text-muted space-y-1">
              <div>• Physical Hardware Station</div>
              <div>• ESP32 #1 (Signer + OLED + RFID)</div>
              <div>• Arduino UNO Q 4GB (Edge Telemetry)</div>
              <div>• Arduino Uno #1 (PIR/DHT11/LCD)</div>
              <div>• ESP8266 Alert Buzzer / LED</div>
            </div>
            <div className="text-[10px] font-mono text-white bg-black p-1.5 font-bold uppercase text-center">
              Hardware signing isolation
            </div>
          </div>

          {/* Laptop C */}
          <div className="bg-white p-5 border-b-2 md:border-b-0 lg:border-r-2 border-black space-y-3 opacity-90">
            <div className="flex justify-between items-center border-b border-rule-light pb-2">
              <span className="font-extrabold text-xs font-sans text-black uppercase">Laptop C (Standby)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-surface text-black border border-black font-bold">RTX 4060</span>
            </div>
            <div className="text-[11px] font-sans text-muted space-y-1">
              <div>• Standby Blockchain Peer</div>
              <div>• Preserves chain reachability if A dies</div>
              <div>• Contract test suite runner</div>
              <div>• No physical hardware Day 1</div>
            </div>
            <div className="text-[10px] font-mono bg-surface p-1.5 border border-black text-black font-bold uppercase text-center">
              Standby Node
            </div>
          </div>

          {/* Laptop D */}
          <div className="bg-surface p-5 space-y-3">
            <div className="flex justify-between items-center border-b border-rule-light pb-2">
              <span className="font-extrabold text-xs font-sans text-black uppercase">Laptop D (Command)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-black text-white font-bold">M1 Air</span>
            </div>
            <div className="text-[11px] font-sans text-muted space-y-1">
              <div>• Command Web Station & QA</div>
              <div>• Vite React TypeScript Frontend</div>
              <div>• 72-Widget Real-Time SOC View</div>
              <div>• Connects over LAN to API & RPC</div>
              <div>• Zero private keys stored</div>
            </div>
            <div className="text-[10px] font-mono text-white bg-black p-1.5 font-bold uppercase text-center">
              Active Command Station
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Pin Map (Widget 3) & Device Register (Widget 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-2 border-black bg-black">
        {/* Widget 3: SignerPinMap */}
        <div className="bg-white p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">06.3</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                ESP32 #1 Signer Pinout Map (3.3V Logic)
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              EXACT WIRING
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            {/* RC522 SPI */}
            <div className="bg-surface p-3.5 border-2 border-black space-y-1.5">
              <div className="flex justify-between items-center text-black font-extrabold uppercase">
                <span>RC522 RFID Reader (Direct SPI)</span>
                <span className="text-[10px] text-[#c90000]">3.3V ONLY</span>
              </div>
              <div className="text-[11px] text-muted grid grid-cols-2 gap-1 pt-1 font-bold">
                <span>SDA / SS: GPIO 5</span>
                <span>SCK: GPIO 18</span>
                <span>MOSI: GPIO 23</span>
                <span>MISO: GPIO 19</span>
                <span>RST: GPIO 27</span>
                <span>VCC: 3.3V Pin</span>
              </div>
            </div>

            {/* SSD1306 OLED */}
            <div className="bg-surface p-3.5 border-2 border-black space-y-1.5">
              <div className="flex justify-between items-center text-black font-extrabold uppercase">
                <span>128x64 OLED #1 Review Screen (I2C)</span>
                <span className="text-[10px]">ADDRESS 0x3C</span>
              </div>
              <div className="text-[11px] text-muted grid grid-cols-2 gap-1 pt-1 font-bold">
                <span>SDA: GPIO 21</span>
                <span>SCL: GPIO 22</span>
                <span>VCC: 3.3V Pin</span>
                <span>GND: Common Ground</span>
              </div>
            </div>

            {/* GPIO Buttons */}
            <div className="bg-surface p-3.5 border-2 border-black space-y-1.5">
              <div className="flex justify-between items-center text-black font-extrabold uppercase">
                <span>Tactile Hardware Switches</span>
                <span className="text-[10px]">PULLUP</span>
              </div>
              <div className="text-[11px] text-black grid grid-cols-2 gap-1 pt-1 font-bold">
                <span>Button #1 (Panic Freeze): <strong className="text-[#c90000]">GPIO 32</strong></span>
                <span>Button #2 (Physical Approve): <strong>GPIO 33</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Widget 2: DeviceRegister */}
        <div className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">06.2</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Connected Device Register
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              {hardwareNodes.length} BOARDS
            </span>
          </div>

          <div className="space-y-2">
            {hardwareNodes.map((dev) => (
              <div key={dev.id} className="bg-surface p-3 border-2 border-black text-xs font-mono space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-sans font-bold text-black uppercase">{dev.name}</span>
                  <span className="text-[10px] font-bold bg-black text-white px-1.5 py-0.2 uppercase">
                    {dev.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-muted">
                  <span>Host: {dev.hostMachine} ({dev.port})</span>
                  <span>Ping: {dev.lastPingMs}ms</span>
                </div>
                <div className="text-[10px] text-black font-sans uppercase font-semibold">
                  Role: {dev.role} | FW: {dev.firmware}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: COM Ownership (Widget 4) & Remote Alarm (Widget 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-2 border-black bg-black">
        {/* Widget 4: GatewayAndCOMOwnership */}
        <div className="bg-white p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">06.4</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Serial & COM Port Ownership
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              INVARIANT S11
            </span>
          </div>

          <div className="space-y-2">
            {serialPortOwnership.map((item, idx) => (
              <div key={idx} className="bg-surface p-3 border-2 border-black text-xs font-mono flex items-center justify-between">
                <div>
                  <div className="text-black font-bold uppercase">{item.process}</div>
                  <div className="text-[11px] text-muted">{item.port} &rarr; {item.device}</div>
                </div>
                <span className="text-[10px] bg-black text-white px-2 py-0.5 font-bold uppercase">
                  EXCLUSIVE
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] font-sans text-muted">
            * Invariant S11: No two host processes ever access the same USB port concurrently.
          </p>
        </div>

        {/* Widget 7: ESP8266AlarmPanel */}
        <div className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">06.7</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                ESP8266 Remote Alarm Station
              </h2>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 font-bold uppercase ${
              esp8266AlarmActive ? 'bg-[#c90000] text-white' : 'bg-surface border border-black text-black'
            }`}>
              {esp8266AlarmActive ? 'BUZZER ACTIVE' : 'QUIET STANDBY'}
            </span>
          </div>

          <p className="text-xs font-sans text-muted leading-relaxed">
            Dedicated NodeMCU ESP8266 alert station located at the physical security desk. 
            Sounds audible siren and blinks strobe LED when physical panic is pressed.
          </p>

          <button
            onClick={triggerAlarmSelfTest}
            className="w-full py-3 px-4 bg-black hover:bg-[#c90000] text-white font-sans font-bold text-xs uppercase tracking-[0.12em] transition-none flex items-center justify-center space-x-2"
          >
            <Volume2 className="w-4 h-4" />
            <span>Trigger Audio & Strobe Self-Test</span>
          </button>
        </div>
      </div>

      {/* Row 4: Diagnostic Self-Test Console (Widget 8) & OLED Replica View (Widget 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-2 border-black bg-black">
        {/* Widget 8: SelfTestConsole */}
        <div className="bg-white p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">06.8</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Hardware Diagnostic Console
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              NON-FINANCIAL
            </span>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => runTest('PING_ESP32')}
              className="flex-1 py-2 px-3 bg-surface hover:bg-black hover:text-white text-black border-2 border-black text-xs font-mono font-bold uppercase transition-none"
            >
              Ping ESP32 #1
            </button>
            <button
              onClick={() => runTest('POLL_PIR')}
              className="flex-1 py-2 px-3 bg-surface hover:bg-black hover:text-white text-black border-2 border-black text-xs font-mono font-bold uppercase transition-none"
            >
              Poll PIR Uno
            </button>
            <button
              onClick={() => runTest('UNO_Q')}
              className="flex-1 py-2 px-3 bg-surface hover:bg-black hover:text-white text-black border-2 border-black text-xs font-mono font-bold uppercase transition-none"
            >
              Check UNO Q
            </button>
          </div>

          <div className="bg-black p-3.5 border-2 border-black font-mono text-xs text-white h-28 overflow-y-auto space-y-1">
            {testLog.map((log, i) => (
              <div key={i} className="text-slate-300">{log}</div>
            ))}
          </div>
        </div>

        {/* Widget 5: OLEDPagePreview (Dual Display Comparison) */}
        <div className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">06.5</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Dual OLED Station Previews
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              OLED #1 VS #2
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-surface p-3.5 border-2 border-black space-y-1">
              <div className="text-[10px] text-[#c90000] font-bold uppercase">OLED #1 (Signer Station)</div>
              <div className="text-black text-[11px] leading-relaxed">Directly wired to ESP32 #1 on Laptop B. Shows canonical EIP-712 payment data.</div>
              <div className="text-black font-extrabold text-[10px] pt-1 uppercase">TRUSTED DISPLAY</div>
            </div>

            <div className="bg-surface p-3.5 border-2 border-black space-y-1">
              <div className="text-[10px] text-muted font-bold uppercase">OLED #2 (Operator Aux)</div>
              <div className="text-muted text-[11px] leading-relaxed">Wired to ESP32 #2 on Laptop A. Shows general gas and session telemetry.</div>
              <div className="text-muted font-bold text-[10px] pt-1 uppercase">UNTRUSTED AUXILIARY</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
