import React, { useState } from 'react';
import { useBastionStore } from '../store/useBastionStore';
import { 
  FileCheck2, 
  Link2, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  RotateCcw,
  ShieldCheck,
  Cpu,
  Layers
} from 'lucide-react';

export const EvidenceForensicsPage: React.FC = () => {
  const {
    auditChain,
    tamperCorruptedIndex,
    mutateAuditRecord,
    resetAuditRecord,
    exportAuditData,
    recentUserOps,
    lastAnchoredBlock
  } = useBastionStore();

  const [copiedExport, setCopiedExport] = useState<string | null>(null);

  const handleExport = (format: 'json' | 'markdown') => {
    const data = exportAuditData(format);
    navigator.clipboard.writeText(data);
    setCopiedExport(format);
    setTimeout(() => setCopiedExport(null), 2000);
  };

  const isHashChainIntact = tamperCorruptedIndex === null;

  return (
    <div className="space-y-8">
      {/* Swiss Header Grid */}
      <div className="border-b-2 border-black pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-[#c90000] mb-2 flex items-center space-x-2">
              <span className="w-2 h-2 bg-[#c90000] inline-block" />
              <span>SECTION 07 / FORENSICS, AUDIT TRAIL & TAMPER LAB</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-black leading-none uppercase">
              CRYPTOGRAPHIC EVIDENCE.
            </h1>
            <p className="text-base text-muted font-normal mt-3 leading-relaxed max-w-2xl">
              Forward SHA-256 hash chaining of physical and contract events with on-chain anchored commitments and interactive forensic tampering verification.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => handleExport('json')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-black hover:text-white text-black border-2 border-black font-sans font-bold text-xs uppercase tracking-[0.12em] transition-none"
            >
              <Download className="w-4 h-4" />
              <span>{copiedExport === 'json' ? 'Copied JSON!' : 'Export JSON Audit'}</span>
            </button>
            <button
              onClick={() => handleExport('markdown')}
              className="flex items-center space-x-2 px-5 py-2.5 bg-black hover:bg-[#c90000] text-white font-sans font-bold text-xs uppercase tracking-[0.12em] transition-none"
            >
              <Download className="w-4 h-4" />
              <span>{copiedExport === 'markdown' ? 'Copied Report!' : 'Generate Judge Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Widget 4: AuditChainVerifier & Widget 7: TamperTestLab (HERO EVIDENCE INTERACTION) */}
      <div className="border-2 border-black bg-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-[#c90000]">07.4</span>
            <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
              Cryptographic Hash Chain Verifier & Tamper Lab
            </h2>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 font-bold uppercase ${
            isHashChainIntact 
              ? 'bg-black text-white' 
              : 'bg-[#c90000] text-white animate-pulse'
          }`}>
            {isHashChainIntact ? 'HASH CHAIN INTACT (0 CORRUPTIONS)' : 'CORRUPTION DETECTED: RECORD 3 ALTERED'}
          </span>
        </div>

        {/* Tamper Test Lab Action Bar (Widget 7) */}
        <div className="bg-surface p-5 border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-[#c90000] inline-block" />
              <span className="font-sans font-extrabold text-xs uppercase tracking-wider text-black">
                07.7 / Tamper Test Demonstration
              </span>
            </div>
            <p className="text-xs font-sans text-muted mt-1 max-w-xl">
              Simulate an adversary modifying a log record in the database. 
              The SHA-256 forward hash chain immediately breaks and highlights the altered sequence in signal red.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => mutateAuditRecord(2)}
              className="px-4 py-2 bg-[#c90000] hover:bg-black text-white font-sans text-xs font-bold uppercase tracking-[0.12em] transition-none border-2 border-black"
            >
              Mutate Record #3
            </button>
            <button
              onClick={resetAuditRecord}
              className="flex items-center space-x-1 px-4 py-2 bg-white text-black hover:bg-black hover:text-white border-2 border-black text-xs font-sans font-bold uppercase tracking-[0.12em] transition-none"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Logs</span>
            </button>
          </div>
        </div>

        {/* Visual Cryptographic Hash Chain Table */}
        <div className="space-y-3 pt-2">
          {auditChain.map((entry) => {
            const isCorrupted = entry.isCorrupted;
            return (
              <div
                key={entry.sequence}
                className={`p-4 border-2 transition-none font-mono text-xs ${
                  isCorrupted 
                    ? 'border-[#c90000] bg-[#c90000] text-white' 
                    : 'border-black bg-white text-black'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-extrabold uppercase">Seq #{entry.sequence}: {entry.eventType}</span>
                  <span className={`text-[11px] ${isCorrupted ? 'text-white' : 'text-muted'}`}>{entry.timestampUtc}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>Prev Hash: <span className="font-bold">{entry.prevHash}</span></div>
                  <div>Calculated Digest: <span className="font-extrabold">{entry.payloadDigest}</span></div>
                </div>
                <div className={`text-[10px] font-sans uppercase font-bold mt-1 ${isCorrupted ? 'text-white' : 'text-muted'}`}>
                  Source Node: {entry.sourceNode}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 2: Transaction Evidence (Widget 1) & Approval Evidence (Widget 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-2 border-black bg-black">
        {/* Widget 1: TransactionEvidence */}
        <div className="bg-white p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">07.1</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Transaction UserOp Inspector
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              ERC-4337
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            {recentUserOps.slice(0, 2).map((op) => (
              <div key={op.intentId} className="bg-surface p-3.5 border-2 border-black space-y-1">
                <div className="flex justify-between text-black font-extrabold">
                  <span>Target: {op.target}</span>
                  <span>{op.amount}</span>
                </div>
                <div className="text-[11px] text-muted">TxHash: {op.txHash}</div>
                <div className="text-[11px] text-muted">UserOpHash: {op.userOpHash}</div>
                <div className="text-[10px] font-bold text-black uppercase">Gas: {op.gasUsed} in block #{op.blockNumber}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 2: ApprovalEvidence */}
        <div className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">07.2</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Hardware Approval Proofs
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              EIP-712 TYPED
            </span>
          </div>

          <div className="bg-surface p-4 border-2 border-black font-mono text-xs text-black space-y-2 leading-relaxed">
            <div className="text-[10px] font-sans uppercase font-bold text-muted">EIP-712 Type Hash:</div>
            <div className="font-extrabold truncate">0x9a8f2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b</div>
            <div className="text-[10px] font-sans uppercase font-bold text-muted pt-1">Provisioned Signer:</div>
            <div className="font-extrabold">0xE5P3200000000000000000000000000000000001</div>
            <div className="text-[10px] font-sans uppercase font-bold text-muted pt-1">Recovery ID:</div>
            <div className="font-bold">v = 27 (secp256k1 canonical signature verified)</div>
          </div>
        </div>
      </div>

      {/* Row 3: Hardware Event Timeline (Widget 3) & Anchored Checkpoint (Widget 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-2 border-black bg-black">
        {/* Widget 3: HardwareEventTimeline */}
        <div className="bg-white p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">07.3</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Hardware Event Timeline (Signed vs Observed)
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              PROVENANCE
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="bg-surface p-3 border-2 border-black">
              <div className="flex justify-between font-extrabold uppercase">
                <span>[CRYPTOGRAPHICALLY SIGNED]</span>
                <span className="text-[10px]">ESP32 #1 SIGNER</span>
              </div>
              <div className="text-[11px] mt-1 text-muted">EIP-712 PaymentIntent approved via GPIO33 tactile button.</div>
            </div>

            <div className="bg-surface p-3 border-2 border-black">
              <div className="flex justify-between font-extrabold uppercase">
                <span>[UNAUTHENTICATED OBSERVATION]</span>
                <span className="text-[10px]">UNO #1 GATEWAY</span>
              </div>
              <div className="text-[11px] mt-1 text-muted">PIR motion presence sensed. Soft telemetry only.</div>
            </div>
          </div>
        </div>

        {/* Widget 5: AnchoredCheckpointStatus */}
        <div className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">07.5</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                On-Chain Anchored State Roots
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              BLOCK #{lastAnchoredBlock}
            </span>
          </div>

          <p className="text-xs font-sans text-muted leading-relaxed">
            State roots are periodically anchored to the local Anvil blockchain. 
            Any tampering with local database projections is immediately detectable against the on-chain checkpoint.
          </p>

          <div className="bg-surface p-3 border-2 border-black font-mono text-xs text-black flex justify-between items-center">
            <span className="font-sans uppercase font-bold text-muted text-[10px]">Root Digest:</span>
            <span className="font-bold">0x4444...4444 (Anchored)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
