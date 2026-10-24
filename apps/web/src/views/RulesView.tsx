import React from 'react';
import { useBastionStore } from '../store/useBastionStore';
import { 
  Sliders, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle,
} from 'lucide-react';

export const RulesView: React.FC = () => {
  const store = useBastionStore();

  const isKeyActive = store.sessionKeyStatus === 'ACTIVE';

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Wallet Rules & Policy Vault
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Strict spending invariants and verified identity registers enforced on-chain by BastionAccount.sol.
        </p>
      </div>

      {/* ═══ TOP SECTION: ON-CHAIN SPENDING LIMITS ═══ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-slate-700" />
            <h2 className="text-base font-semibold text-slate-900">On-Chain Spending Limits</h2>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200/70 px-2.5 py-0.5 rounded-full">
            Account: {store.smartAccountAddress.slice(0, 8)}...
          </span>
        </div>

        {/* 4-Box Metric Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Box 1: Auto-Pay Limit */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1">
            <div className="text-xs text-slate-500 font-medium">Auto-Pay Limit</div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              ${store.maxPerTx}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">/ tx</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              Payments &gt;$25 route to physical ESP32 OLED
            </div>
          </div>

          {/* Box 2: Daily Allowance */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1">
            <div className="text-xs text-slate-500 font-medium">Daily Allowance</div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              ${store.dailyLimit}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">/ day</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              ${store.dailySpent.toFixed(2)} spent today across all intents
            </div>
          </div>

          {/* Box 3: Velocity Protection */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1">
            <div className="text-xs text-slate-500 font-medium">Velocity Protection</div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {store.velocityMax10m}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">tx / 10 mins</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              Curbs high-frequency salami slicing drains
            </div>
          </div>

          {/* Box 4: Session Key Status */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium mb-1">Session Key Status</div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isKeyActive ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
                  }`}
                />
                <span
                  className={`text-lg font-bold font-mono ${
                    isKeyActive ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {isKeyActive ? 'Active' : 'Revoked'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              {isKeyActive ? (
                <button
                  onClick={() => store.revokeSessionKey()}
                  className="w-full py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70 text-xs font-medium transition-colors"
                >
                  Revoke Key
                </button>
              ) : (
                <button
                  onClick={() => store.restoreSessionKey()}
                  className="w-full py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/70 text-xs font-medium transition-colors"
                >
                  Reactivate Key
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM SECTION: VERIFIED MERCHANT REGISTRY ═══ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-slate-700" />
            <h2 className="text-base font-semibold text-slate-900">Verified Merchant Registry</h2>
          </div>
          <span className="text-xs text-slate-500">
            3-Point Proof: KYB + Wallet Sig + On-Chain Registry
          </span>
        </div>

        {/* Clean Modern Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-medium">
                <th className="pb-3 pl-2">Merchant Entity</th>
                <th className="pb-3">Wallet Address</th>
                <th className="pb-3">Verification Details</th>
                <th className="pb-3 pr-2 text-right">Policy Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {store.merchants.map((merchant) => (
                <tr key={merchant.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 pl-2 font-medium text-slate-900">
                    {merchant.name}
                  </td>
                  <td className="py-3.5 font-mono text-slate-600">
                    {merchant.address}
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                        {merchant.kybVerified ? (
                          <CheckCircle2 size={13} className="text-emerald-600" />
                        ) : (
                          <XCircle size={13} className="text-slate-400" />
                        )}
                        KYB Attested
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                        {merchant.walletSigVerified ? (
                          <CheckCircle2 size={13} className="text-emerald-600" />
                        ) : (
                          <XCircle size={13} className="text-slate-400" />
                        )}
                        EIP-712 Sig
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-2 text-right font-mono">
                    {merchant.trusted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-sans">
                        <CheckCircle2 size={12} />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60 font-sans">
                        <XCircle size={12} />
                        <span>Unverified</span>
                      </span>
                    )}
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

export default RulesView;
