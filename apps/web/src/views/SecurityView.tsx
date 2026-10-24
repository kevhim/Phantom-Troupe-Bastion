import React, { useState } from 'react';
import { useBastionStore } from '../store/useBastionStore';
import { EmergencyState } from '../types/bastion';
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
  Zap,
  Cpu,
  Laptop,
  Terminal,
  Volume2,
  CheckCircle2,
  Layers,
  Server,
  FileCheck2,
  Link2,
  Download,
  XCircle,
  Flame
} from 'lucide-react';

// ─── MODULE A: Security Posture & Emergency Controls ────────────────
const SecurityPosture: React.FC = () => {
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
    stepEmergencyState,
    resetEmergencyState,
    pressPanicButton,
    revokeSessionKey,
    activeSession,
    topologyNodes,
    esp8266AlarmActive
  } = useBastionStore();

  const emergencySteps: { state: EmergencyState; label: string }[] = [
    { state: 'NORMAL', label: 'Normal' },
    { state: 'PANIC_LOCAL', label: 'Panic Triggered' },
    { state: 'REVOKE_SIGNED', label: 'Revoke Signed' },
    { state: 'REVOKE_SUBMITTED', label: 'Revoke TX Submitted' },
    { state: 'REVOKE_CONFIRMED', label: 'Revoke Confirmed' },
  ];

  const currentStepIdx = emergencySteps.findIndex(s => s.state === emergencyState);

  const filteredIncidents = incidentFilter === 'ALL'
    ? securityIncidents
    : securityIncidents.filter(i => i.type === incidentFilter);

  return (
    <div className="space-y-4">
      {/* Posture Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Risk Level */}
        <div className={`border-2 border-black p-4 ${
          riskLevel === 'TRUSTED' ? 'bg-white' : 'bg-[#c90000]'
        }`}>
          <div className={`text-[11px] font-mono font-bold uppercase tracking-[0.12em] mb-2 ${
            riskLevel === 'TRUSTED' ? 'text-muted' : 'text-white/70'
          }`}>
            Security Posture
          </div>
          <div className={`text-3xl font-extrabold font-mono ${
            riskLevel === 'TRUSTED' ? 'text-black' : 'text-white'
          }`}>
            {riskLevel}
          </div>
        </div>

        {/* Emergency State */}
        <div className="border-2 border-black p-4 bg-white">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-2">
            Emergency State
          </div>
          <div className="text-lg font-extrabold font-mono text-black mb-2">
            {emergencyState}
          </div>
          {panicTimestampUtc && (
            <div className="text-[10px] font-mono text-[#c90000]">
              Triggered: {panicTimestampUtc}
            </div>
          )}
        </div>

        {/* Alarm Status */}
        <div className={`border-2 border-black p-4 ${
          esp8266AlarmActive ? 'bg-[#c90000]' : 'bg-white'
        }`}>
          <div className={`text-[11px] font-mono font-bold uppercase tracking-[0.12em] mb-2 ${
            esp8266AlarmActive ? 'text-white/70' : 'text-muted'
          }`}>
            ESP8266 Alarm
          </div>
          <div className={`text-3xl font-extrabold font-mono ${
            esp8266AlarmActive ? 'text-white' : 'text-black'
          }`}>
            {esp8266AlarmActive ? 'ACTIVE' : 'SILENT'}
          </div>
        </div>
      </div>

      {/* Emergency Pipeline */}
      <div className="border-2 border-black p-4 bg-white">
        <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-3 border-b border-rule-light pb-1.5">
          Emergency Containment Pipeline
        </div>
        <div className="flex items-center space-x-1 mb-3 overflow-x-auto">
          {emergencySteps.map((step, i) => (
            <React.Fragment key={step.state}>
              <button
                onClick={() => stepEmergencyState(step.state)}
                className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border-2 border-black shrink-0 transition-none ${
                  i <= currentStepIdx
                    ? 'bg-black text-white'
                    : 'bg-white text-muted hover:bg-surface'
                }`}
              >
                {step.label}
              </button>
              {i < emergencySteps.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={pressPanicButton}
            className="px-4 py-2 text-xs font-extrabold uppercase tracking-wider border-2 border-[#c90000] bg-[#c90000] text-white hover:bg-black transition-none"
          >
            Trigger Panic
          </button>
          <button
            onClick={revokeSessionKey}
            disabled={activeSession.status !== 'ACTIVE'}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-black bg-black text-white hover:bg-[#c90000] transition-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Revoke Session Key
          </button>
          <button
            onClick={resetEmergencyState}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-black bg-surface text-black hover:bg-black hover:text-white transition-none"
          >
            Reset (Demo)
          </button>
        </div>
      </div>

      {/* Sensor Grid + Network Topology */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sensor Telemetry */}
        <div className="border-2 border-black p-4 bg-white">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-3 border-b border-rule-light pb-1.5">
            Environmental Sensors (UNO #1)
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={togglePirMotion}
              className={`p-3 border-2 border-black text-center transition-none ${
                pirMotionActive ? 'bg-black text-white' : 'bg-surface text-muted'
              }`}
            >
              <Eye className="w-5 h-5 mx-auto mb-1" />
              <div className="text-[10px] font-mono font-bold uppercase">PIR</div>
              <div className="text-xs font-bold">{pirMotionActive ? 'MOTION' : 'CLEAR'}</div>
            </button>
            <button
              onClick={toggleOpticalFace}
              className={`p-3 border-2 border-black text-center transition-none ${
                opticalFaceDetected ? 'bg-black text-white' : 'bg-surface text-muted'
              }`}
            >
              <Eye className="w-5 h-5 mx-auto mb-1" />
              <div className="text-[10px] font-mono font-bold uppercase">FACE</div>
              <div className="text-xs font-bold">{opticalFaceDetected ? 'DETECTED' : 'NONE'}</div>
            </button>
            <div className="p-3 border-2 border-black text-center bg-white">
              <Thermometer className="w-5 h-5 mx-auto mb-1 text-black" />
              <div className="text-[10px] font-mono font-bold uppercase text-muted">TEMP</div>
              <div className="text-lg font-extrabold font-mono text-black">{temperatureC.toFixed(1)}°C</div>
            </div>
            <div className="p-3 border-2 border-black text-center bg-white">
              <Droplets className="w-5 h-5 mx-auto mb-1 text-black" />
              <div className="text-[10px] font-mono font-bold uppercase text-muted">HUMIDITY</div>
              <div className="text-lg font-extrabold font-mono text-black">{humidityPct.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Network Topology */}
        <div className="border-2 border-black p-4 bg-white">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-3 border-b border-rule-light pb-1.5 flex items-center space-x-2">
            <Network className="w-3.5 h-3.5" />
            <span>LAN Topology</span>
          </div>
          <div className="space-y-2">
            {topologyNodes.map(node => (
              <div key={node.id} className="border-2 border-black p-2.5 bg-white hover:bg-surface transition-none">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-sans font-bold text-black">{node.label}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 ${
                    node.status === 'HEALTHY' ? 'bg-black text-white' : 'bg-[#c90000] text-white'
                  }`}>
                    {node.status}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-muted">{node.ip} — {node.role}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {node.hardwareAttached.map((hw, i) => (
                    <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 bg-surface border border-black text-black">
                      {hw}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Incident Log */}
      <div className="border-2 border-black p-4 bg-white">
        <div className="flex items-center justify-between mb-3 border-b border-rule-light pb-1.5">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted flex items-center space-x-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Security Incidents ({filteredIncidents.length})</span>
          </div>
          <div className="flex space-x-1">
            {['ALL', 'OVER_LIMIT_ATTEMPT', 'NON_WHITELISTED_RECIPIENT', 'PANIC_TRIGGERED'].map(f => (
              <button
                key={f}
                onClick={() => setIncidentFilter(f)}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold border border-black transition-none ${
                  incidentFilter === f ? 'bg-black text-white' : 'bg-white text-muted hover:bg-surface'
                }`}
              >
                {f === 'ALL' ? 'All' : f.replace(/_/g, ' ').substring(0, 12)}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filteredIncidents.map(inc => (
            <div
              key={inc.id}
              className={`p-2.5 border-2 border-black text-xs font-mono ${
                inc.severity === 'CRITICAL' ? 'border-l-4 border-l-[#c90000]' :
                inc.severity === 'WARNING' ? 'border-l-4 border-l-black' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 ${
                  inc.severity === 'CRITICAL' ? 'bg-[#c90000] text-white' :
                  inc.severity === 'WARNING' ? 'bg-black text-white' :
                  'bg-surface text-black border border-black'
                }`}>
                  {inc.severity}
                </span>
                <span className="text-[10px] text-muted">{inc.timestampUtc.substring(11, 19)}</span>
              </div>
              <div className="text-black">{inc.description}</div>
              <div className="text-[10px] text-muted mt-0.5">Source: {inc.sourceNode}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── MODULE B: Hardware Devices & Diagnostics ───────────────────────
const HardwareDevices: React.FC = () => {
  const {
    hardwareNodes,
    serialPortOwnership,
    esp8266AlarmActive,
    triggerAlarmSelfTest,
    pingDevice,
    directRpcChannelActive,
    directRpcGasBalance,
  } = useBastionStore();

  const [testLog, setTestLog] = useState<string[]>(['Bus initialized at 115200 baud.']);

  const runTest = (type: string) => {
    const ts = new Date().toISOString().substring(11, 19);
    if (type === 'PING_ESP32') {
      pingDevice('esp32-signer');
      setTestLog(prev => [`[${ts}] PING ESP32 #1 → pong (4ms, GPIO32/33 active).`, ...prev]);
    } else if (type === 'POLL_PIR') {
      setTestLog(prev => [`[${ts}] POLL UNO #1 PIR → stationary presence.`, ...prev]);
    } else if (type === 'ALARM') {
      triggerAlarmSelfTest();
      setTestLog(prev => [`[${ts}] ESP8266 alarm self-test (2.5s burst).`, ...prev]);
    } else if (type === 'READ_TEMP') {
      setTestLog(prev => [`[${ts}] DHT11 → 22.4°C / 46.2% RH.`, ...prev]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b-2 border-black pb-3">
        <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted flex items-center space-x-2">
          <span className="w-2 h-2 bg-black inline-block" />
          <span>HARDWARE DEVICES & DIAGNOSTICS</span>
        </div>
      </div>

      {/* Device Roster */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {hardwareNodes.map(node => (
          <div key={node.id} className="border-2 border-black p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-black" />
                <span className="text-xs font-sans font-bold text-black">{node.name}</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 ${
                node.status === 'ONLINE' ? 'bg-black text-white' :
                node.status === 'DEGRADED' ? 'bg-surface text-black border border-black' :
                'bg-[#c90000] text-white'
              }`}>
                {node.status}
              </span>
            </div>
            <div className="text-[10px] font-mono text-muted space-y-0.5">
              <div>Role: {node.role}</div>
              <div>Host: {node.hostMachine} | Port: {node.port}</div>
              <div>FW: {node.firmware} | Ping: {node.lastPingMs}ms</div>
            </div>
            <button
              onClick={() => {
                pingDevice(node.id);
                const ts = new Date().toISOString().substring(11, 19);
                setTestLog(prev => [`[${ts}] PING ${node.name} → ${Math.floor(Math.random() * 10) + 3}ms.`, ...prev]);
              }}
              className="mt-2 w-full py-1 text-[10px] font-bold uppercase tracking-wider border-2 border-black bg-surface hover:bg-black hover:text-white text-black transition-none"
            >
              Ping Device
            </button>
          </div>
        ))}
      </div>

      {/* Direct RPC Channel */}
      <div className="border-2 border-black p-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5" />
            <span>ESP32 Direct RPC Channel</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 ${
              directRpcChannelActive ? 'bg-black text-white' : 'bg-[#c90000] text-white'
            }`}>
              {directRpcChannelActive ? 'ACTIVE' : 'DOWN'}
            </span>
            <span className="text-[10px] font-mono text-muted">Gas: {directRpcGasBalance}</span>
          </div>
        </div>
      </div>

      {/* Serial Port Ownership */}
      <div className="border-2 border-black p-3 bg-white">
        <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-2 border-b border-rule-light pb-1.5">
          Serial Port Assignments
        </div>
        <div className="space-y-1.5">
          {serialPortOwnership.map((sp, i) => (
            <div key={i} className="flex items-center justify-between text-xs font-mono py-1 border-b border-rule-light">
              <span className="text-black font-bold">{sp.port}</span>
              <span className="text-muted">{sp.device}</span>
              <span className="text-[10px] text-muted">{sp.process}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 ${
                sp.safe ? 'bg-black text-white' : 'bg-[#c90000] text-white'
              }`}>
                {sp.safe ? 'SAFE' : 'CONFLICT'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Diagnostic Console */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="border-2 border-black p-3 bg-white">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-2">
            Diagnostic Tests
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'PING_ESP32', label: 'Ping ESP32' },
              { id: 'POLL_PIR', label: 'Poll PIR Sensor' },
              { id: 'ALARM', label: 'Alarm Self-Test' },
              { id: 'READ_TEMP', label: 'Read DHT11' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => runTest(t.id)}
                className="py-2 text-[10px] font-bold uppercase tracking-wider border-2 border-black bg-surface hover:bg-black hover:text-white text-black transition-none"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="border-2 border-black p-3 bg-black text-white">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            Test Console
          </div>
          <div className="space-y-0.5 max-h-32 overflow-y-auto font-mono text-[10px]">
            {testLog.map((line, i) => (
              <div key={i} className="text-green-400">{line}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MODULE C: Evidence & Audit Chain ───────────────────────────────
const EvidenceAudit: React.FC = () => {
  const {
    auditChain,
    tamperCorruptedIndex,
    mutateAuditRecord,
    resetAuditRecord,
    exportAuditData,
    lastAnchoredBlock
  } = useBastionStore();

  const [copiedExport, setCopiedExport] = useState<string | null>(null);

  const handleExport = (format: 'json' | 'markdown') => {
    const data = exportAuditData(format);
    navigator.clipboard.writeText(data);
    setCopiedExport(format);
    setTimeout(() => setCopiedExport(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="border-b-2 border-black pb-3">
        <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted flex items-center space-x-2">
          <span className="w-2 h-2 bg-black inline-block" />
          <span>FORENSIC EVIDENCE & AUDIT CHAIN</span>
        </div>
      </div>

      {/* Audit Chain Table */}
      <div className="border-2 border-black p-4 bg-white">
        <div className="flex items-center justify-between mb-3 border-b border-rule-light pb-1.5">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted flex items-center space-x-2">
            <Link2 className="w-3.5 h-3.5" />
            <span>Hash-Linked Audit Chain ({auditChain.length} entries)</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleExport('json')}
              className="px-2.5 py-1 text-[10px] font-bold uppercase border-2 border-black bg-surface hover:bg-black hover:text-white text-black transition-none"
            >
              {copiedExport === 'json' ? '✓ Copied JSON' : 'Export JSON'}
            </button>
            <button
              onClick={() => handleExport('markdown')}
              className="px-2.5 py-1 text-[10px] font-bold uppercase border-2 border-black bg-surface hover:bg-black hover:text-white text-black transition-none"
            >
              {copiedExport === 'markdown' ? '✓ Copied MD' : 'Export MD'}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {auditChain.map((entry, idx) => (
            <div
              key={entry.sequence}
              className={`border-2 p-2.5 text-xs font-mono ${
                entry.isCorrupted
                  ? 'border-[#c90000] bg-[#c90000]/5'
                  : 'border-black bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-black text-white">
                    SEQ {entry.sequence}
                  </span>
                  <span className={`text-[10px] font-bold ${
                    entry.isCorrupted ? 'text-[#c90000]' : 'text-black'
                  }`}>
                    {entry.eventType}
                  </span>
                </div>
                <span className="text-[10px] text-muted">
                  {entry.timestampUtc.substring(11, 19)}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[10px]">
                <div>
                  <span className="text-muted">Source:</span>{' '}
                  <span className="text-black">{entry.sourceNode}</span>
                </div>
                <div>
                  <span className="text-muted">Digest:</span>{' '}
                  <span className={entry.isCorrupted ? 'text-[#c90000] font-bold' : 'text-black'}>
                    {entry.payloadDigest}
                  </span>
                </div>
              </div>
              {entry.isCorrupted && (
                <div className="mt-1 text-[10px] text-[#c90000] font-bold flex items-center space-x-1">
                  <XCircle className="w-3 h-3" />
                  <span>TAMPER DETECTED — Hash chain integrity violation</span>
                </div>
              )}
              {!entry.isCorrupted && (
                <button
                  onClick={() => mutateAuditRecord(idx)}
                  className="mt-1.5 text-[9px] font-bold uppercase text-muted hover:text-[#c90000] underline"
                >
                  Simulate Tamper
                </button>
              )}
            </div>
          ))}
        </div>

        {tamperCorruptedIndex !== null && (
          <button
            onClick={resetAuditRecord}
            className="mt-3 flex items-center space-x-1.5 px-3 py-1.5 border-2 border-black bg-surface hover:bg-black hover:text-white text-black text-[11px] font-bold uppercase tracking-wider transition-none"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Audit Chain</span>
          </button>
        )}
      </div>

      {/* Block Anchor */}
      <div className="border-2 border-black p-3 bg-surface">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted flex items-center space-x-2">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Latest Anchored Block</span>
          </div>
          <span className="text-lg font-extrabold font-mono text-black">
            #{lastAnchoredBlock}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── VIEW EXPORT ────────────────────────────────────────────────────
export const SecurityView: React.FC = () => {
  const [tab, setTab] = useState<'posture' | 'devices' | 'evidence'>('posture');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b-2 border-black pb-4">
        <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-[#c90000] mb-1.5 flex items-center space-x-2">
          <span className="w-2 h-2 bg-[#c90000] inline-block" />
          <span>03 / SECURITY & DEVICES</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black leading-none uppercase">
          CONTAINMENT & TELEMETRY.
        </h1>
        <p className="text-sm font-sans text-muted mt-2 max-w-2xl">
          Security operations center, hardware diagnostics, and tamper-evident audit chain.
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex border-2 border-black">
        {[
          { id: 'posture' as const, label: 'Security Posture' },
          { id: 'devices' as const, label: 'Hardware Devices' },
          { id: 'evidence' as const, label: 'Evidence & Audit' },
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

      {/* Tab Content */}
      {tab === 'posture' && <SecurityPosture />}
      {tab === 'devices' && <HardwareDevices />}
      {tab === 'evidence' && <EvidenceAudit />}
    </div>
  );
};
