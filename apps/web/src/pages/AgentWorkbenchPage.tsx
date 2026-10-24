import React, { useState } from 'react';
import { useBastionStore } from '../store/useBastionStore';
import { 
  Send, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertOctagon, 
  Flame, 
  Copy, 
  Check, 
  FileCode,
  Layers
} from 'lucide-react';

export const AgentWorkbenchPage: React.FC<{ onNavigate: (route: string) => void }> = ({ onNavigate }) => {
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

  // Form State
  const [tokenSymbol, setTokenSymbol] = useState('USDC');
  const [selectedRecipient, setSelectedRecipient] = useState(whitelistedVendors[0].address);
  const [customAddress, setCustomAddress] = useState('');
  const [useCustomRecipient, setUseCustomRecipient] = useState(false);
  const [amountUsd, setAmountUsd] = useState(15.0);
  const [memo, setMemo] = useState('Monthly compute instance reservation');
  const [copiedTx, setCopiedTx] = useState(false);
  const [simulatedPrecheck, setSimulatedPrecheck] = useState<'IDLE' | 'PASS' | 'EXCEED'>('IDLE');

  const finalRecipient = useCustomRecipient ? customAddress : selectedRecipient;
  const isOverLimit = amountUsd > maxPerTxUsd;

  const handlePrecheck = () => {
    if (isOverLimit || useCustomRecipient) {
      setSimulatedPrecheck('EXCEED');
    } else {
      setSimulatedPrecheck('PASS');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPaymentIntent({
      tokenSymbol,
      recipient: finalRecipient,
      amountUsd: Number(amountUsd),
      memo
    });
  };

  const handleCopyTx = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Swiss Header Grid */}
      <div className="border-b-2 border-black pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-[#c90000] mb-2 flex items-center space-x-2">
              <span className="w-2 h-2 bg-[#c90000] inline-block" />
              <span>SECTION 02 / AGENT WORKBENCH & SAFE ATTACK LAB</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-black leading-none uppercase">
              DELEGATED SESSION OPERATION.
            </h1>
            <p className="text-base text-muted font-normal mt-3 leading-relaxed max-w-2xl">
              Dispatch autonomous operations within session bounds, or execute safe compromised-key attack vectors to verify on-chain smart account policy rejection.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <span className="px-4 py-2 border-2 border-black bg-surface text-black font-mono font-bold text-xs uppercase tracking-wider">
              AUTONOMOUS CAP: <strong className="text-black">${maxPerTxUsd}.00 USDC</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Row 1: Composer (Widget 1) & EIP-712 Canonical Payload (Widget 3, 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-2 border-black bg-black">
        {/* Widget 1: RequestComposer */}
        <div className="bg-white p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">02.1</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Request Composer (Agent Payment Intent)
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              SESSION DELEGATED
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-black mb-1">
                  Target Token
                </label>
                <select
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                  className="w-full bg-surface border-2 border-black p-2 text-xs font-mono font-bold text-black focus:outline-none"
                >
                  <option value="USDC">USDC (Mock Contract 0x00...22)</option>
                  <option value="BASTION">BASTION Token (0x00...88)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-black mb-1">
                  Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-black text-xs font-mono font-bold">$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={amountUsd}
                    onChange={(e) => setAmountUsd(parseFloat(e.target.value) || 0)}
                    className="w-full bg-surface border-2 border-black p-2 pl-7 text-xs font-mono font-bold text-black focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-black">
                  Target Recipient Vendor
                </label>
                <button
                  type="button"
                  onClick={() => setUseCustomRecipient(!useCustomRecipient)}
                  className="text-[10px] font-mono font-bold uppercase text-[#c90000] underline"
                >
                  {useCustomRecipient ? 'SELECT WHITELIST' : 'ENTER CUSTOM ADDRESS'}
                </button>
              </div>

              {useCustomRecipient ? (
                <input
                  type="text"
                  placeholder="0x..."
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  className="w-full bg-surface border-2 border-[#c90000] p-2 text-xs font-mono font-bold text-black focus:outline-none"
                />
              ) : (
                <select
                  value={selectedRecipient}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  className="w-full bg-surface border-2 border-black p-2 text-xs font-mono font-bold text-black focus:outline-none"
                >
                  {whitelistedVendors.map((vendor) => (
                    <option key={vendor.address} value={vendor.address}>
                      {vendor.label} ({vendor.address.substring(0, 10)}...)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-black mb-1">
                Execution Memo / Reasoning
              </label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full bg-surface border-2 border-black p-2 text-xs font-sans text-black focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <button
                type="button"
                onClick={handlePrecheck}
                className="flex-1 py-2.5 px-3 bg-white hover:bg-black hover:text-white text-black border-2 border-black text-xs font-sans font-bold uppercase tracking-[0.12em] transition-none"
              >
                Simulate Policy Pre-Check
              </button>

              <button
                type="submit"
                className={`flex-1 py-2.5 px-3 text-white text-xs font-sans font-bold uppercase tracking-[0.12em] transition-none border-2 border-black flex items-center justify-center space-x-2 ${
                  isOverLimit 
                    ? 'bg-[#c90000] hover:bg-black' 
                    : 'bg-black hover:bg-[#c90000]'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isOverLimit ? 'Queue Hardware Approval' : 'Submit Autonomous UserOp'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Policy Advisory (Widget 4) & Canonical Payload (Widget 3) */}
        <div className="bg-white flex flex-col justify-between divide-y-2 divide-black">
          {/* Widget 4: AdvisoryPolicyPrecheck */}
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-[#c90000]">02.4</span>
                <span className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                  Advisory Policy Pre-Check
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-surface border border-black font-bold text-black">
                PROJECTION ONLY
              </span>
            </div>

            {isOverLimit || simulatedPrecheck === 'EXCEED' ? (
              <div className="bg-[#c90000] text-white p-4 border-2 border-black space-y-1">
                <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-white" />
                  <span>REQUIRES ESP32 HARDWARE APPROVAL</span>
                </div>
                <p className="text-xs font-sans leading-relaxed text-white">
                  Amount (${amountUsd}) exceeds autonomous session cap (${maxPerTxUsd}.00). 
                  Account.sol policy demands physical OLED review and GPIO33 tactile button confirmation.
                </p>
              </div>
            ) : (
              <div className="bg-black text-white p-4 border-2 border-black space-y-1">
                <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-wider text-white">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>WITHIN AUTONOMOUS POLICY BOUNDS</span>
                </div>
                <p className="text-xs font-sans leading-relaxed text-white">
                  Amount (${amountUsd}) &lt;= limit (${maxPerTxUsd}.00). Recipient is registered in whitelist. 
                  Will execute directly on-chain via EntryPoint without human intervention.
                </p>
              </div>
            )}
          </div>

          {/* Widget 3: ParsedCanonicalIntent */}
          <div className="p-6 space-y-3 bg-surface">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-[#c90000]">02.3</span>
                <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                  Canonical EIP-712 Payload
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold">
                DOMAIN: BASTIONV2
              </span>
            </div>

            <pre className="bg-white p-4 border-2 border-black text-[11px] font-mono text-black overflow-x-auto leading-relaxed">
{JSON.stringify({
  verifyingAccount: "0x7F2c0B47...BA011",
  targetContract: "0x0000000000000000000000000000000000000022",
  functionSelector: "0xa9059cbb",
  recipientAddress: finalRecipient,
  amountBaseUnits: (amountUsd * 1000000).toString(),
  deadline: Math.floor(Date.now() / 1000) + 3600,
  approvalTier: isOverLimit ? "JUNIOR_EXCEPTION" : "AUTONOMOUS_TIER_0"
}, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Row 2: Reasoning Trace (Widget 2) & UserOp Stepper (Widget 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-2 border-black bg-black">
        {/* Widget 2: ReasoningAndTools */}
        <div className="bg-white p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">02.2</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Agent Internal Reasoning Trace
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              SCRIPTED FALLBACK
            </span>
          </div>

          <div className="bg-black p-4 border-2 border-black font-mono text-xs text-white space-y-2 h-44 overflow-y-auto">
            {reasoningTrace.map((line, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <span className="text-[#c90000] font-bold select-none">&gt;</span>
                <span className={idx === 0 ? 'text-white font-bold' : 'text-slate-300'}>{line}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 5: UserOpLifecycle */}
        <div className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">02.5</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                ERC-4337 UserOp Lifecycle
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              6-STAGE PIPELINE
            </span>
          </div>

          {/* Numbered steps sharing a continuous ruled field instead of separate cards */}
          <div className="border-2 border-black divide-y-2 divide-black">
            {[
              { num: '01', step: 'Intent Created', desc: 'Canonical payload encoded' },
              { num: '02', step: 'EIP-712 Digested', desc: 'Domain separator hashed' },
              { num: '03', step: 'Session Signed', desc: 'Delegated key signature' },
              { num: '04', step: 'Bundler Relayed', desc: 'Accepted in local 4337 mempool' },
              { num: '05', step: 'Block Included', desc: 'Mined into Anvil block' },
              { num: '06', step: 'Executed On-Chain', desc: 'Account.sol execution receipt' },
            ].map((s) => (
              <div key={s.num} className="flex items-center justify-between p-2.5 bg-white text-xs font-mono">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-[#c90000]">{s.num}</span>
                  <span className="font-bold text-black">{s.step}</span>
                </div>
                <span className="text-[11px] font-sans text-muted">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: SAFE ATTACK LAB (Widget 7) & Transaction Receipt (Widget 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-2 border-black bg-black">
        {/* Widget 7: SafeAttackLab (Takes 2 Columns) */}
        <div className="lg:col-span-2 bg-white p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">02.7</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Safe Attack Simulation Lab (Judge Verification)
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#c90000] text-white font-bold uppercase">
              STOLEN KEY TESTING
            </span>
          </div>

          <p className="text-xs font-sans text-muted leading-relaxed">
            Simulate what happens when an adversary completely compromises Laptop A and steals the agent’s session key. 
            The real smart account (<span className="font-mono font-bold text-black">Account.sol</span>) enforces policies on-chain!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => runSafeAttack('NON_WHITELISTED')}
              className="p-4 border-2 border-black bg-white hover:bg-black hover:text-white text-left transition-none"
            >
              <div className="text-[11px] font-sans font-extrabold uppercase tracking-wider text-black group-hover:text-white">
                [Attack 1] Bad Recipient
              </div>
              <div className="text-[10px] font-mono text-muted mt-1">
                Send to 0xDead...6666
              </div>
            </button>

            <button
              onClick={() => runSafeAttack('OVER_LIMIT')}
              className="p-4 border-2 border-black bg-white hover:bg-black hover:text-white text-left transition-none"
            >
              <div className="text-[11px] font-sans font-extrabold uppercase tracking-wider text-black group-hover:text-white">
                [Attack 2] Bypass $25 Cap
              </div>
              <div className="text-[10px] font-mono text-muted mt-1">
                Attempt $99,999.00 Drain
              </div>
            </button>

            <button
              onClick={() => runSafeAttack('UNAUTHORIZED_SELECTOR')}
              className="p-4 border-2 border-black bg-white hover:bg-black hover:text-white text-left transition-none"
            >
              <div className="text-[11px] font-sans font-extrabold uppercase tracking-wider text-black group-hover:text-white">
                [Attack 3] Forbidden Function
              </div>
              <div className="text-[10px] font-mono text-muted mt-1">
                Call approve() 0x095ea7b3
              </div>
            </button>
          </div>

          {/* Interactive Attack Output */}
          {attackLabOutput ? (
            <div className="bg-surface p-4 border-2 border-[#c90000] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 bg-[#c90000] inline-block" />
                  <span className="text-xs font-mono font-bold uppercase text-black">
                    {attackLabOutput.attackType}
                  </span>
                </div>
                <button
                  onClick={clearAttackLab}
                  className="text-[10px] font-mono font-bold uppercase underline hover:text-[#c90000]"
                >
                  Clear Output
                </button>
              </div>

              <div className="font-mono text-xs text-white font-bold bg-[#c90000] p-2.5 border border-black">
                {attackLabOutput.reason}
              </div>

              <p className="text-[11px] font-sans text-black leading-relaxed">
                {attackLabOutput.details}
              </p>
            </div>
          ) : (
            <div className="bg-surface p-3 border border-black text-[11px] font-mono text-muted text-center uppercase tracking-wider">
              Click an attack button above to test smart contract policy rejection.
            </div>
          )}
        </div>

        {/* Widget 6: TransactionReceiptCard */}
        <div className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">02.6</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                On-Chain Receipt
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              CONFIRMED
            </span>
          </div>

          {lastTxReceipt ? (
            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-[10px] font-sans uppercase font-bold text-muted">Transaction Hash</span>
                <div className="flex items-center justify-between bg-surface p-2 border border-black mt-1">
                  <span className="truncate mr-2 font-bold text-black">{lastTxReceipt.txHash}</span>
                  <button onClick={() => handleCopyTx(lastTxReceipt.txHash)}>
                    {copiedTx ? <Check className="w-3.5 h-3.5 text-[#c90000]" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-sans uppercase font-bold text-muted">UserOp Hash</span>
                <div className="bg-surface p-2 border border-black text-black font-bold truncate mt-1">
                  {lastTxReceipt.userOpHash}
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] border-t border-rule-light pt-2">
                <span className="font-sans font-bold uppercase text-muted">Gas Used:</span>
                <span className="text-black font-extrabold">{lastTxReceipt.gasUsed}</span>
              </div>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-surface border border-black text-xs font-sans">
              <Layers className="w-6 h-6 text-black mb-2" />
              <span className="text-muted font-bold uppercase tracking-wider text-[11px]">No transactions executed in current session.</span>
            </div>
          )}
        </div>
      </div>

      {/* Row 4: TaskHistory (Widget 8) */}
      <div className="border-2 border-black bg-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-[#c90000]">02.8</span>
            <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
              Agent Execution History
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
            {recentUserOps.length} ENTRIES
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-2 border-black">
            <thead>
              <tr className="bg-surface border-b-2 border-black text-black font-sans text-[11px] uppercase tracking-wider">
                <th className="p-3 border-r border-black font-bold">Time (UTC)</th>
                <th className="p-3 border-r border-black font-bold">Target Recipient</th>
                <th className="p-3 border-r border-black font-bold">Amount</th>
                <th className="p-3 border-r border-black font-bold">UserOp Hash</th>
                <th className="p-3 font-bold text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y border-t border-black divide-black">
              {recentUserOps.map((op) => (
                <tr key={op.intentId} className="hover:bg-surface">
                  <td className="p-3 border-r border-black text-muted">{op.timestampUtc.substring(11, 19)} UTC</td>
                  <td className="p-3 border-r border-black font-sans font-bold text-black">{op.target}</td>
                  <td className="p-3 border-r border-black font-bold text-black">{op.amount}</td>
                  <td className="p-3 border-r border-black font-bold text-black">{op.userOpHash}</td>
                  <td className="p-3 text-right">
                    <span className="px-2 py-0.5 bg-black text-white font-mono font-bold text-[10px] uppercase">
                      SUCCESS
                    </span>
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
