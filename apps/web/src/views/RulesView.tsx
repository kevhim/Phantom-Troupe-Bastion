import React from 'react';
import { useBastionStore } from '../store/useBastionStore';

export const RulesView: React.FC = () => {
  const store = useBastionStore();

  const isKeyActive = store.sessionKeyStatus === 'ACTIVE';

  return (
    <div className="space-y-8">
      {/* ═══ TOP SECTION: ON-CHAIN SPENDING LIMITS ═══ */}
      <div className="glass p-6 text-white/90 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-bold tracking-wide uppercase text-white/90">
                On-Chain Spending Limits & Invariants
              </h2>
              <span className="font-serif italic text-xs text-white/45">§ 3.1</span>
            </div>
            <p className="text-xs text-white/60 mt-0.5">
              Enforced independently by BastionAccount.sol smart contract
            </p>
          </div>
          <span className="text-[10px] font-mono text-white/45 uppercase tracking-widest">
            Account: {store.smartAccountAddress.slice(0, 6)}...{store.smartAccountAddress.slice(-4)}
          </span>
        </div>

        {/* 4-Box Glass Spec Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Box 1: Auto-Pay Limit */}
          <div className="glass rounded-[8px] p-4 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium block">
                Auto-Pay Ceiling
              </span>
              <div className="text-2xl font-bold font-mono text-white/90 mt-1.5 tabular-nums">
                ${store.maxPerTx}{' '}
                <span className="text-xs font-normal text-white/45 font-sans">/ tx</span>
              </div>
            </div>
            <div className="text-[11px] text-white/60 pt-2 border-t border-white/[0.08]">
              Payments &gt;$25 route to physical ESP32 OLED signer
            </div>
          </div>

          {/* Box 2: Daily Allowance */}
          <div className="glass rounded-[8px] p-4 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium block">
                Daily Allowance
              </span>
              <div className="text-2xl font-bold font-mono text-white/90 mt-1.5 tabular-nums">
                ${store.dailyLimit}{' '}
                <span className="text-xs font-normal text-white/45 font-sans">/ day</span>
              </div>
            </div>
            <div className="text-[11px] text-white/60 pt-2 border-t border-white/[0.08] tabular-nums">
              ${store.dailySpent.toFixed(2)} spent today across all agent intents
            </div>
          </div>

          {/* Box 3: Velocity Protection */}
          <div className="glass rounded-[8px] p-4 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium block">
                Velocity Circuit
              </span>
              <div className="text-2xl font-bold font-mono text-white/90 mt-1.5 tabular-nums">
                {store.velocityMax10m}{' '}
                <span className="text-xs font-normal text-white/45 font-sans">tx / 10m</span>
              </div>
            </div>
            <div className="text-[11px] text-white/60 pt-2 border-t border-white/[0.08]">
              Curbs high-frequency automated salami-slicing attacks
            </div>
          </div>

          {/* Box 4: Session Key Status */}
          <div className="glass rounded-[8px] p-4 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium block">
                Session Key Status
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-none ${
                    isKeyActive ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span
                  className={`text-lg font-bold font-mono uppercase tracking-wider ${
                    isKeyActive ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {isKeyActive ? 'Active' : 'Revoked'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.08]">
              {isKeyActive ? (
                <button
                  onClick={() => store.revokeSessionKey()}
                  className="glass-status-crimson w-full py-1.5 px-3 text-rose-300 font-mono text-[10px] uppercase tracking-widest font-bold rounded-[8px] transition-all cursor-pointer text-center"
                >
                  Revoke Key
                </button>
              ) : (
                <button
                  onClick={() => store.restoreSessionKey()}
                  className="glass-status-emerald w-full py-1.5 px-3 text-emerald-300 font-mono text-[10px] uppercase tracking-widest font-bold rounded-[8px] transition-all cursor-pointer text-center"
                >
                  Reactivate Key
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM SECTION: VERIFIED MERCHANT REGISTRY ═══ */}
      <div className="glass p-6 text-white/90 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-bold tracking-wide uppercase text-white/90">
                Verified Merchant Identity Register
              </h2>
              <span className="font-serif italic text-xs text-white/45">§ 3.2</span>
            </div>
            <p className="text-xs text-white/60 mt-0.5">
              3-Point Proof: KYB + EIP-712 Signature + On-Chain Registry
            </p>
          </div>
          <span className="text-[10px] font-mono text-white/45 uppercase tracking-widest">
            Identity Vault
          </span>
        </div>

        {/* Glass Table */}
        <div className="glass rounded-[8px] overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium">
                <th className="py-3 px-4">Merchant Entity</th>
                <th className="py-3 px-4">Wallet Address</th>
                <th className="py-3 px-4">Cryptographic Proofs</th>
                <th className="py-3 px-4 text-right">Policy Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-white/80">
              {store.merchants.map((merchant) => (
                <tr key={merchant.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white/90 uppercase tracking-tight">
                    {merchant.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-white/60">
                    {merchant.address}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span className={merchant.kybVerified ? 'text-emerald-300 font-semibold' : 'text-white/30'}>
                        [KYB: {merchant.kybVerified ? 'ATTESTED' : 'NONE'}]
                      </span>
                      <span className={merchant.walletSigVerified ? 'text-emerald-300 font-semibold' : 'text-white/30'}>
                        [EIP712: {merchant.walletSigVerified ? 'VERIFIED' : 'NONE'}]
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-none inline-block ${
                          merchant.trusted ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-white/70 font-semibold">
                        {merchant.trusted ? 'VERIFIED' : 'UNVERIFIED'}
                      </span>
                    </div>
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
