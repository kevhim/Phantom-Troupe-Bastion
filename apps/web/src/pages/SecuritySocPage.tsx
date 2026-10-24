import React from 'react';
import { useBastionStore } from '../store/useBastionStore';
import { 
  Radio, 
  ShieldAlert, 
  Eye, 
  Thermometer, 
  Droplets, 
  Activity, 
  AlertOctagon, 
  Lock, 
  ArrowRight,
  RotateCcw,
  Network,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { EmergencyState } from '../types/bastion';

export const SecuritySocPage: React.FC = () => {
  const {
    riskLevel,
    emergencyState,
    panicTimestampUtc,
    securityIncidents,
    incidentFilter,
    setIncidentFilter,
    pirMotionActive,
    togglePirMotion,
    opticalFaceDetected,
    toggleOpticalFace,
    temperatureC,
    humidityPct,
    directRpcChannelActive,
    directRpcGasBalance,
    stepEmergencyState,
    resetEmergencyState
  } = useBastionStore();

  const emergencySteps: EmergencyState[] = [
    'NORMAL',
    'PANIC_LOCAL',
    'REVOKE_SIGNED',
    'REVOKE_SUBMITTED',
    'REVOKE_CONFIRMED'
  ];

  const filteredIncidents = securityIncidents.filter(inc => {
    if (incidentFilter === 'PANIC') return inc.type === 'PANIC_TRIGGERED';
    if (incidentFilter === 'UNAUTHORIZED') return inc.type === 'UNAUTHORIZED_SELECTOR' || inc.type === 'NON_WHITELISTED_RECIPIENT';
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Swiss Header Grid */}
      <div className="border-b-2 border-black pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-[#c90000] mb-2 flex items-center space-x-2">
              <span className="w-2 h-2 bg-[#c90000] inline-block" />
              <span>SECTION 05 / SECURITY OPERATIONS CENTER & CONTAINMENT</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-black leading-none uppercase">
              ZERO-TRUST SOC MATRIX.
            </h1>
            <p className="text-base text-muted font-normal mt-3 leading-relaxed max-w-2xl">
              Real-time environmental sensor correlation, observable 5-stage emergency freeze lifecycle, and independent direct RPC revocation without application dependency.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={resetEmergencyState}
              className="flex items-center space-x-2 px-5 py-2.5 bg-black hover:bg-[#c90000] text-white font-sans font-bold text-xs uppercase tracking-[0.12em] transition-none"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Threat Posture</span>
            </button>
          </div>
        </div>
      </div>

      {/* Widget 1: RiskStateBanner */}
      <div className={`p-6 border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between select-none ${
        riskLevel === 'CRITICAL' ? 'bg-[#c90000] text-white' : 'bg-surface text-black'
      }`}>
        <div className="flex items-center space-x-4">
          <ShieldAlert className={`w-8 h-8 ${riskLevel === 'CRITICAL' ? 'text-white' : 'text-black'}`} />
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-sans font-extrabold uppercase tracking-[0.12em]">
                05.1 / SYSTEM RISK POSTURE:
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-mono font-bold uppercase border-2 ${
                riskLevel === 'CRITICAL' ? 'bg-black text-white border-white' : 'bg-black text-white border-black'
              }`}>
                {riskLevel}
              </span>
            </div>
            <p className={`text-xs font-sans mt-1 leading-relaxed ${riskLevel === 'CRITICAL' ? 'text-white' : 'text-muted'}`}>
              {riskLevel === 'TRUSTED' && 'All peripheral sensors nominal. Autonomous session keys within hardcoded budget.'}
              {riskLevel === 'SUSPICIOUS' && 'Soft anomaly or over-limit intent queued. Smart account policy guard intact.'}
              {riskLevel === 'CRITICAL' && `Physical panic button triggered at ${panicTimestampUtc || 'recently'}! Signing pipeline locked.`}
            </p>
          </div>
        </div>

        <div className="mt-4 sm:mt-0 font-mono text-xs font-bold uppercase text-right">
          STATE: <span className="underline decoration-2">{emergencyState}</span>
        </div>
      </div>

      {/* Row 2: Threat Signal Matrix (Widget 2) & Direct RPC (Widget 6) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-black bg-black">
        {/* Widget 2: ThreatSignalMatrix (Takes 2 Columns) */}
        <div className="md:col-span-2 bg-white p-6 border-b-2 md:border-b-0 md:border-r-2 border-black space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">05.2</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Threat Signal Matrix (Laptop B Sensor Array)
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              REAL TELEMETRY
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Camera Optical Challenge */}
            <div className="bg-surface p-3.5 border-2 border-black space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="uppercase text-[10px] text-muted">Camera Vision:</span>
                <Eye className="w-3.5 h-3.5 text-black" />
              </div>
              <div className={`font-mono text-xs font-extrabold ${opticalFaceDetected ? 'text-black' : 'text-[#c90000]'}`}>
                {opticalFaceDetected ? 'FACE PRESENT' : 'UNVERIFIED'}
              </div>
              <button
                onClick={toggleOpticalFace}
                className="w-full text-[10px] font-mono font-bold uppercase py-1 bg-white hover:bg-black hover:text-white text-black border border-black transition-none"
              >
                Toggle Face
              </button>
            </div>

            {/* PIR Motion Uno #1 */}
            <div className="bg-surface p-3.5 border-2 border-black space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="uppercase text-[10px] text-muted">PIR Uno #1:</span>
                <Radio className="w-3.5 h-3.5 text-black" />
              </div>
              <div className={`font-mono text-xs font-extrabold ${pirMotionActive ? 'text-black' : 'text-[#c90000]'}`}>
                {pirMotionActive ? 'CLEAR' : 'MOTION'}
              </div>
              <button
                onClick={togglePirMotion}
                className="w-full text-[10px] font-mono font-bold uppercase py-1 bg-white hover:bg-black hover:text-white text-black border border-black transition-none"
              >
                Toggle Motion
              </button>
            </div>

            {/* DHT11 Temperature */}
            <div className="bg-surface p-3.5 border-2 border-black space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="uppercase text-[10px] text-muted">Temp Ambient:</span>
                <Thermometer className="w-3.5 h-3.5 text-black" />
              </div>
              <div className="font-mono text-base font-extrabold text-black">
                {temperatureC}°C
              </div>
              <span className="text-[10px] font-mono text-muted uppercase font-bold block pt-1">NOMINAL</span>
            </div>

            {/* DHT11 Humidity */}
            <div className="bg-surface p-3.5 border-2 border-black space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="uppercase text-[10px] text-muted">Humidity:</span>
                <Droplets className="w-3.5 h-3.5 text-black" />
              </div>
              <div className="font-mono text-base font-extrabold text-black">
                {humidityPct}%
              </div>
              <span className="text-[10px] font-mono text-muted uppercase font-bold block pt-1">NOMINAL</span>
            </div>
          </div>

          <p className="text-[11px] font-sans text-muted">
            * Invariant S7: Peripheral sensors provide soft threat context only. Authorization decisions strictly adhere to on-chain smart contract policies and hardware-bound signatures.
          </p>
        </div>

        {/* Widget 6: DirectRPCStatus */}
        <div className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">05.6</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                ESP32 Direct RPC
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              BYPASSES A
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="bg-surface p-3 border border-black">
              <span className="text-[10px] font-sans uppercase font-bold text-muted">Independent Channel:</span>
              <div className="text-black font-extrabold mt-0.5">Direct Socket to Anvil RPC</div>
            </div>
            <div className="bg-surface p-3 border border-black">
              <span className="text-[10px] font-sans uppercase font-bold text-muted">Gas Balance:</span>
              <div className="text-black font-extrabold mt-0.5">{directRpcGasBalance}</div>
            </div>
            <p className="text-[11px] font-sans text-muted leading-relaxed">
              Even if Laptop A’s software is killed, the physical ESP32 broadcasts <span className="font-mono font-bold text-black">revokeSession()</span> directly.
            </p>
          </div>
        </div>
      </div>

      {/* Widget 5: EmergencyStateMachine (5 observable stages sharing a continuous field) */}
      <div className="border-2 border-black bg-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-[#c90000]">05.5</span>
            <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
              Emergency Freeze State Machine (Truth Lifecycle)
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
            5 OBSERVABLE STAGES
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-0 border-2 border-black bg-black">
          {emergencySteps.map((step, idx) => {
            const isCurrent = emergencyState === step;
            return (
              <button
                key={step}
                onClick={() => stepEmergencyState(step)}
                className={`p-4 text-left transition-none font-mono border-b-2 sm:border-b-0 sm:border-r-2 border-black last:border-r-0 ${
                  isCurrent 
                    ? 'bg-black text-white font-extrabold' 
                    : 'bg-white text-black hover:bg-surface'
                }`}
              >
                <div className={`text-[10px] font-sans font-bold uppercase ${isCurrent ? 'text-[#c90000]' : 'text-muted'}`}>
                  Stage 0{idx + 1}
                </div>
                <div className="font-extrabold text-xs mt-1 truncate uppercase">{step}</div>
                <div className="text-[10px] font-sans mt-2 opacity-80">
                  {idx === 0 && 'Normal ops'}
                  {idx === 1 && 'GPIO32 pressed'}
                  {idx === 2 && 'Revoke tx signed'}
                  {idx === 3 && 'Relayed to RPC'}
                  {idx === 4 && 'Confirmed on chain'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 4: Incident Feed (Widget 3) & Physical Topology (Widget 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-2 border-black bg-black">
        {/* Widget 3: IncidentFeed */}
        <div className="bg-white p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">05.3</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Security Incident Feed
              </h2>
            </div>
            <div className="flex border-2 border-black">
              {['ALL', 'PANIC', 'UNAUTHORIZED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setIncidentFilter(f)}
                  className={`px-3 py-1 text-[10px] font-mono font-bold uppercase transition-none ${
                    incidentFilter === f 
                      ? 'bg-black text-white' 
                      : 'bg-white text-black hover:bg-surface border-r-2 last:border-r-0 border-black'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {filteredIncidents.map((inc) => (
              <div key={inc.id} className="bg-surface p-3 border-2 border-black text-xs font-mono space-y-1">
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 uppercase ${
                    inc.severity === 'CRITICAL' ? 'bg-[#c90000] text-white' :
                    inc.severity === 'WARNING' ? 'bg-black text-white' :
                    'bg-white text-black border border-black'
                  }`}>
                    {inc.type}
                  </span>
                  <span className="text-[10px] text-muted font-bold">{inc.timestampUtc.substring(11, 19)} UTC</span>
                </div>
                <p className="text-[11px] font-sans text-black font-semibold">{inc.description}</p>
                <div className="text-[10px] text-muted font-sans uppercase">Source: {inc.sourceNode}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 4: PhysicalNetworkTopology */}
        <div className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">05.4</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Physical Network Topology
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              LAN ISOLATED
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="bg-surface p-3 border-2 border-black space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-sans font-bold text-black uppercase">Laptop A (RTX 5060)</span>
                <span className="text-black font-bold">192.168.1.101</span>
              </div>
              <div className="text-[11px] text-muted font-sans">
                Role: Untrusted App & Anvil Chain Lab. USB: ESP32 #2 OLED Auxiliary.
              </div>
            </div>

            <div className="bg-surface p-3 border-2 border-black space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-sans font-bold text-black uppercase">Laptop B (Intel Ultra 7)</span>
                <span className="text-black font-bold">192.168.1.102</span>
              </div>
              <div className="text-[11px] text-muted font-sans">
                Role: Physical Security Station. USB: ESP32 #1 Signer + RC522 + UNO Q 4GB.
              </div>
            </div>

            <div className="bg-surface p-3 border-2 border-black space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-sans font-bold text-black uppercase">Laptop D (MacBook Air M1 — Command)</span>
                <span className="text-black font-bold">192.168.1.104</span>
              </div>
              <div className="text-[11px] text-muted font-sans">
                Role: Command Web Station & QA Inspector. Zero private keys stored.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: Attack Timeline (Widget 7) & Privacy Indicator (Widget 8) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-black bg-black">
        {/* Widget 7: AttackTimeline */}
        <div className="bg-white p-6 border-b-2 md:border-b-0 md:border-r-2 border-black space-y-3">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">05.7</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Attack Timeline & Policy Invariant
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              DEFENSES ACTIVE
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-start space-x-2.5">
              <span className="text-black font-bold">✓</span>
              <div>
                <span className="text-black font-bold uppercase text-[11px]">Bypass-of-Agent Invariant Verified:</span>
                <p className="text-[11px] text-muted font-sans mt-0.5 leading-relaxed">
                  Direct raw UserOp submissions with stolen agent session keys are blocked by Account.sol contract logic.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Widget 8: PrivacyIndicator */}
        <div className="bg-white p-6 space-y-3">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">05.8</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Privacy & Data Retention Invariant
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              S10 COMPLIANT
            </span>
          </div>

          <p className="text-xs font-sans text-black leading-relaxed">
            Strict compliance with Invariant S10: No raw wallet keys, full LLM prompts, camera images, or biometric records 
            are ever written to the blockchain or exposed across network boundaries.
          </p>
        </div>
      </div>
    </div>
  );
};
