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
  UserCheck
} from 'lucide-react';

export const WalletPolicyPage: React.FC = () => {
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
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [proposeMessage, setProposeMessage] = useState('');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(id);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  const handlePropose = (e: React.FormEvent) => {
    e.preventDefault();
    setProposeMessage('Policy update proposal drafted! Requires independent Owner signature on Laptop B.');
    setTimeout(() => {
      setShowProposeModal(false);
      setProposeMessage('');
    }, 2500);
  };

  return (
    <div className="space-y-8">
      {/* Swiss Header Grid */}
      <div className="border-b-2 border-black pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-[#c90000] mb-2 flex items-center space-x-2">
              <span className="w-2 h-2 bg-[#c90000] inline-block" />
              <span>SECTION 03 / SMART ACCOUNT & ON-CHAIN POLICIES</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-black leading-none uppercase">
              THE SIX SPENDING DIMENSIONS.
            </h1>
            <p className="text-base text-muted font-normal mt-3 leading-relaxed max-w-2xl">
              Hard financial constraints enforced directly inside <span className="font-mono font-bold text-black">Account.sol</span> storage. Unchecked alternative execute, batch, delegatecall or approve calls are completely disabled.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setShowProposeModal(true)}
              className="flex items-center space-x-2 px-5 py-2.5 bg-black hover:bg-[#c90000] text-white font-sans font-bold text-xs uppercase tracking-[0.12em] transition-none"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Propose Policy Change</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: Contract Identity (Widget 1) & Caps (Widgets 5, 6) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-black bg-black">
        {/* Widget 1: ContractIdentity */}
        <div className="bg-white p-6 space-y-4 border-b-2 md:border-b-0 md:border-r-2 border-black">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">03.1</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Contract Identity
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              VERIFIED
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <span className="text-[10px] text-muted font-sans uppercase font-bold">Smart Account</span>
              <div className="flex items-center justify-between bg-surface p-2 border border-black mt-1">
                <span className="text-black font-bold truncate mr-2">{smartAccountAddress}</span>
                <button onClick={() => handleCopy(smartAccountAddress, 'acct')}>
                  {copiedAddr === 'acct' ? <Check className="w-3.5 h-3.5 text-[#c90000]" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-muted font-sans uppercase font-bold">EntryPoint</span>
              <div className="bg-surface p-2 border border-black text-black font-bold truncate mt-1">
                {entryPointAddress}
              </div>
            </div>

            <div className="text-[11px] font-sans text-muted pt-1">
              Bytecode: <span className="font-mono font-bold text-black">Solidity 0.8.24 (OpenZeppelin v5)</span>
            </div>
          </div>
        </div>

        {/* Widget 5: MaxPerTx */}
        <div className="bg-white p-6 space-y-4 border-b-2 md:border-b-0 md:border-r-2 border-black">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">03.5</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Max Per-Tx Allowance
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              HARD CAP
            </span>
          </div>

          <div>
            <div className="text-4xl font-mono font-extrabold text-black">
              ${maxPerTxUsd.toFixed(2)} <span className="text-base font-bold">USDC</span>
            </div>
            <p className="text-xs font-sans text-muted mt-2 leading-relaxed">
              Any UserOperation above ${maxPerTxUsd}.00 submitted by the agent key is rejected by 
              <span className="font-mono font-bold text-black"> validateUserOp()</span> unless accompanied by an ESP32 physical signature.
            </p>
          </div>
        </div>

        {/* Widget 6: DailyAllowance */}
        <div className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">03.6</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                24h UTC Daily Budget
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              CALENDAR DAY
            </span>
          </div>

          <div>
            <div className="text-4xl font-mono font-extrabold text-black">
              ${dailyAllowanceUsd.toFixed(2)} <span className="text-base font-bold">USDC</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono font-bold text-black mt-3 border-t border-rule-light pt-2">
              <span>Spent Today: ${spentTodayUsd.toFixed(2)}</span>
              <span className="text-[#c90000]">Remaining: ${(dailyAllowanceUsd - spentTodayUsd).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Target Contracts (Widget 2), Selectors (Widget 3), Recipients (Widget 4) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-black bg-black">
        {/* Widget 2: AllowlistedTargets */}
        <div className="bg-white p-6 space-y-4 border-b-2 md:border-b-0 md:border-r-2 border-black">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">03.2</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Target Contracts
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-surface border border-black font-bold uppercase">
              CONTRACT SCOPE
            </span>
          </div>

          <div className="space-y-2">
            {allowlistedTargets.map((t) => (
              <div key={t.address} className="bg-surface p-3 border border-black text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-sans font-bold text-black">{t.label}</span>
                  {t.allowed ? (
                    <span className="text-[10px] font-mono bg-black text-white px-1.5 py-0.2 font-bold uppercase">
                      PERMITTED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono bg-[#c90000] text-white px-1.5 py-0.2 font-bold uppercase">
                      FORBIDDEN
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-muted truncate mt-1">
                  {t.address}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 3: AllowedSelectors */}
        <div className="bg-white p-6 space-y-4 border-b-2 md:border-b-0 md:border-r-2 border-black">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">03.3</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Allowed Selectors
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-surface border border-black font-bold uppercase">
              FUNCTION SCOPE
            </span>
          </div>

          <div className="space-y-2">
            {allowedSelectors.map((s) => (
              <div key={s.selector} className="bg-surface p-3 border border-black text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-extrabold text-black">{s.selector}</span>
                  {s.allowed ? (
                    <span className="text-[10px] font-mono bg-black text-white px-1.5 py-0.2 font-bold uppercase">
                      ALLOWED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono bg-[#c90000] text-white px-1.5 py-0.2 font-bold uppercase">
                      REVERT
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-muted truncate mt-1">
                  {s.signature}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 4: RecipientPolicy */}
        <div className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">03.4</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Recipient Whitelist
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              {whitelistedVendors.length} VERIFIED
            </span>
          </div>

          <div className="space-y-2">
            {whitelistedVendors.map((v) => (
              <div key={v.address} className="bg-surface p-3 border border-black text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-sans font-bold text-black">{v.label}</span>
                  <span className="text-[10px] font-mono bg-white px-1 border border-black font-bold uppercase">
                    {v.category}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-muted truncate mt-1">
                  {v.address}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Session Registry (Widget 7) & Approval Tiers (Widget 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-2 border-black bg-black">
        {/* Widget 7: SessionKeyRegistry */}
        <div className="bg-white p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">03.7</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Session Key Registry
              </h2>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 font-bold uppercase ${
              activeSession.status === 'ACTIVE' ? 'bg-black text-white' : 'bg-[#c90000] text-white'
            }`}>
              {activeSession.status}
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="bg-surface p-4 border border-black space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-sans uppercase font-bold text-muted text-[10px]">Actor Session:</span>
                <span className="text-black font-bold">{activeSession.actorSession}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-sans uppercase font-bold text-muted text-[10px]">Key Hash:</span>
                <span className="text-black font-bold truncate ml-2">{activeSession.publicKey.substring(0, 18)}...</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-sans uppercase font-bold text-muted text-[10px]">Valid Until:</span>
                <span className="text-black font-bold">{activeSession.expiresAtUtc}</span>
              </div>
            </div>
            <p className="text-[11px] font-sans text-muted">
              The agent holds only this limited session key. It cannot change policies, add recipients, or spend above policy limits.
            </p>
          </div>

          <div className="pt-3 border-t-2 border-black flex justify-end">
            <button
              onClick={revokeSessionKey}
              className="px-4 py-2 bg-black hover:bg-[#c90000] text-white font-sans font-bold text-xs uppercase tracking-wider transition-none"
            >
              Emergency Revoke Key
            </button>
          </div>
        </div>

        {/* Widget 8: ApprovalTierRegistry */}
        <div className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">03.8</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Approval Tier Registry
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              3 TIERS
            </span>
          </div>

          <div className="space-y-2">
            {approvalTiers.map((t) => (
              <div key={t.tierNumber} className="bg-surface p-3 border border-black text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-sans font-bold text-black">{t.name}</span>
                  <span className="font-mono text-black font-extrabold">UP TO ${t.maxCeilingUsd}.00</span>
                </div>
                <div className="text-[11px] font-mono text-muted flex items-center space-x-3">
                  <span>Card: {t.cardName}</span>
                  <span>OLED: {t.requiresOledReview ? 'Yes' : 'No'}</span>
                  <span>Co-Sign: {t.requiresOwnerCosign ? 'Required' : 'No'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Policy Diff (Widget 9) & Session Revoke Panel (Widget 10) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-2 border-black bg-black">
        {/* Widget 9: OnChainPolicyDiff */}
        <div className="bg-white p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">03.9</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                On-Chain Policy Diff (Active vs Pending)
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
              SYNCHRONIZED
            </span>
          </div>

          <div className="bg-surface p-4 border border-black font-mono text-xs text-black space-y-1.5 leading-relaxed">
            <div className="text-muted">// Active Contract State vs Local Proposal</div>
            <div>max_per_tx_allowance = 25_000_000 (25.00 USDC)</div>
            <div>utc_daily_budget = 100_000_000 (100.00 USDC)</div>
            <div>whitelisted_recipients_count = 3</div>
            <div className="font-bold text-black pt-1">✓ No uncommitted on-chain proposals pending</div>
          </div>
        </div>

        {/* Widget 10: SessionRevokePanel */}
        <div className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#c90000]">03.10</span>
              <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                Direct Revocation Panel
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#c90000] text-white font-bold uppercase">
              SMART ACCOUNT CALL
            </span>
          </div>

          <p className="text-xs font-sans text-muted leading-relaxed">
            In the event of an agent anomaly, the session key can be permanently invalidated directly on-chain 
            without needing the AI host’s cooperation.
          </p>

          <button
            onClick={revokeSessionKey}
            className="w-full py-3 px-4 bg-black hover:bg-[#c90000] text-white font-sans font-bold text-xs uppercase tracking-[0.12em] transition-none"
          >
            Broadcast RevokeSession() Transaction
          </button>
        </div>
      </div>

      {/* Propose Policy Modal */}
      {showProposeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black p-6 max-w-md w-full text-black space-y-4">
            <h3 className="text-sm font-sans font-extrabold uppercase tracking-[0.12em] border-b-2 border-black pb-2">
              Propose New Spend Policy
            </h3>
            {proposeMessage ? (
              <div className="p-3 bg-surface border-2 border-black text-xs font-mono font-bold text-black">
                {proposeMessage}
              </div>
            ) : (
              <form onSubmit={handlePropose} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-black mb-1">
                    Proposed Max-Per-Tx ($)
                  </label>
                  <input type="number" defaultValue={50} className="w-full bg-surface border-2 border-black p-2 text-xs font-mono font-bold text-black focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-black mb-1">
                    Proposed Daily Budget ($)
                  </label>
                  <input type="number" defaultValue={200} className="w-full bg-surface border-2 border-black p-2 text-xs font-mono font-bold text-black focus:outline-none" />
                </div>
                <p className="text-[11px] text-[#c90000] font-sans font-semibold">
                  * Any policy change requires cryptographically verified Owner signature on Laptop B.
                </p>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowProposeModal(false)} className="px-4 py-2 border-2 border-black bg-white hover:bg-surface text-xs font-sans font-bold uppercase">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-black hover:bg-[#c90000] text-white text-xs font-sans font-bold uppercase tracking-wider">
                    Draft Proposal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
