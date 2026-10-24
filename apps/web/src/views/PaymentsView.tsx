import React, { useState } from 'react';
import { useBastionStore } from '../store/useBastionStore';

export const PaymentsView: React.FC = () => {
  const store = useBastionStore();

  const [selectedMerchant, setSelectedMerchant] = useState(
    store.merchants[0]?.address || '0xABCD000000000000000000000000000000001234'
  );
  const [amount, setAmount] = useState('15');
  const [invoiceId, setInvoiceId] = useState('INV-2026-CLOUD-981');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    store.sendPayment(selectedMerchant, num, invoiceId);
  };

  const handleRunDemo = (exampleIndex: 1 | 2 | 3) => {
    if (exampleIndex === 1) {
      setSelectedMerchant('0xABCD000000000000000000000000000000001234');
      setAmount('15');
      setInvoiceId('INV-2026-CLOUD-981');
      store.runDemoExample(1);
    } else if (exampleIndex === 2) {
      setSelectedMerchant('0xABCD000000000000000000000000000000001234');
      setAmount('50');
      setInvoiceId('INV-2026-GPU-CLUSTER');
      store.runDemoExample(2);
    } else if (exampleIndex === 3) {
      setSelectedMerchant('0xFAKE000000000000000000000000000000009999');
      setAmount('20');
      setInvoiceId('INV-UNVERIFIED-TEST');
      store.runDemoExample(3);
    }
  };

  const activeStatus = store.activeTxStatus;

  return (
    <div className="space-y-8">
      {/* ═══ TWO-COLUMN REAL GLASS CARDS (24px PADDING) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ═══ LEFT CARD: AGENT PAYMENT DISPATCH ═══ */}
        <div className="glass p-6 text-white/90 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-sm font-bold tracking-wide uppercase text-white/90">
                  Send Agent Payment
                </h2>
                <span className="font-serif italic text-xs text-white/45">§ 1.1</span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Issue intent via smart session key
              </p>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/60">
              <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 inline-block" />
              <span>MAX AUTO: ${store.maxPerTx}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Merchant Select */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium mb-1.5">
                Recipient Merchant
              </label>
              <select
                value={selectedMerchant}
                onChange={(e) => setSelectedMerchant(e.target.value)}
                className="glass-well w-full px-3.5 py-2.5 text-xs font-mono transition-colors outline-none cursor-pointer"
              >
                <option value="0xABCD000000000000000000000000000000001234" className="bg-[#0e101a] text-white">
                  Verified Demo Cloud (0xABCD...1234 — Verified)
                </option>
                <option value="0x771A0000000000000000000000000000000088C2" className="bg-[#0e101a] text-white">
                  Sub-Vendor Compute (0x771A...88C2 — Verified)
                </option>
                <option value="0xFAKE000000000000000000000000000000009999" className="bg-[#0e101a] text-white">
                  Unknown Address (0xFAKE...9999 — Unverified)
                </option>
              </select>
            </div>

            {/* Amount (USDC) */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium mb-1.5">
                Amount (USDC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="25.00"
                  className="glass-well w-full pl-3.5 pr-14 py-2.5 text-xs font-mono tabular-nums transition-colors outline-none"
                />
                <span className="absolute right-3.5 top-2.5 text-[10px] font-mono uppercase text-white/45 font-medium pointer-events-none">
                  USDC
                </span>
              </div>
            </div>

            {/* Invoice Reference ID */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium mb-1.5">
                Invoice / Reference ID
              </label>
              <input
                type="text"
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
                placeholder="INV-2026-CLOUD-981"
                className="glass-well w-full px-3.5 py-2.5 text-xs font-mono transition-colors outline-none"
              />
            </div>

            {/* Primary Action Button (Solid Frosted White, Dark Text) */}
            <button
              type="submit"
              className="glass-btn-primary w-full py-3 px-4 text-xs uppercase tracking-[0.18em] font-semibold transition-all cursor-pointer mt-1"
            >
              Send Payment Intent
            </button>
          </form>

          {/* ═══ QUICK ACTION DEMO RUNNER ═══ */}
          <div className="pt-5 border-t border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium">
                Quick Action Demo Runner
              </span>
              <span className="text-[10px] font-mono text-white/45">
                TEST SCENARIOS
              </span>
            </div>

            <div className="space-y-2">
              {/* Example 1 ($15 Auto-Pay): Tinted Emerald Glass */}
              <button
                onClick={() => handleRunDemo(1)}
                className="glass-status-emerald w-full text-left p-3.5 rounded-[8px] flex items-center justify-between transition-all group cursor-pointer"
              >
                <div>
                  <div className="font-mono text-xs font-bold tracking-wide text-emerald-300 uppercase">
                    01 / $15 Auto-Pay — Instant Approval
                  </div>
                  <div className="text-[11px] text-white/60 mt-0.5">
                    Within $25 ceiling • Autonomous settlement on-chain
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-300 group-hover:translate-x-0.5 transition-transform">
                  EXECUTE →
                </span>
              </button>

              {/* Example 2 ($50 Over-Limit): Tinted Amber Glass */}
              <button
                onClick={() => handleRunDemo(2)}
                className="glass-status-amber w-full text-left p-3.5 rounded-[8px] flex items-center justify-between transition-all group cursor-pointer"
              >
                <div>
                  <div className="font-mono text-xs font-bold tracking-wide text-amber-300 uppercase">
                    02 / $50 Over-Limit — Route to ESP32 OLED
                  </div>
                  <div className="text-[11px] text-white/60 mt-0.5">
                    Exceeds $25 threshold • Requires dual-auth hardware approval
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-amber-300 group-hover:translate-x-0.5 transition-transform">
                  EXECUTE →
                </span>
              </button>

              {/* Example 3 (Unverified Vendor): Tinted Crimson Glass */}
              <button
                onClick={() => handleRunDemo(3)}
                className="glass-status-crimson w-full text-left p-3.5 rounded-[8px] flex items-center justify-between transition-all group cursor-pointer"
              >
                <div>
                  <div className="font-mono text-xs font-bold tracking-wide text-rose-300 uppercase">
                    03 / Unverified Vendor — Contract Revert
                  </div>
                  <div className="text-[11px] text-white/60 mt-0.5">
                    0xFAKE address • Reverted on-chain by BastionAccount.sol
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-rose-300 group-hover:translate-x-0.5 transition-transform">
                  EXECUTE →
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT CARD: TRANSACTION LIFECYCLE & ACTIVITY ═══ */}
        <div className="glass p-6 text-white/90 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-sm font-bold tracking-wide uppercase text-white/90">
                  Live Execution & Activity
                </h2>
                <span className="font-serif italic text-xs text-white/45">§ 1.2</span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                On-chain settlement & validation events
              </p>
            </div>
            <span className="text-[10px] font-mono text-white/45 uppercase tracking-widest tabular-nums">
              {store.recentTransactions.length} Recorded
            </span>
          </div>

          {/* Active Transaction Status Banner */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium mb-2">
              Active Transaction Lifecycle
            </div>

            {activeStatus.state === 'APPROVED_MINED' && (
              <div className="glass-status-emerald p-4 rounded-[8px] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 inline-block" />
                    <span className="font-mono text-xs uppercase tracking-widest font-bold text-emerald-300">
                      Mined On-Chain
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-emerald-300 font-bold">
                    SUCCESS
                  </span>
                </div>
                <div className="text-sm font-semibold tracking-tight text-white/90">
                  {activeStatus.title}
                </div>
                <p className="text-xs text-white/70 leading-relaxed font-sans">
                  {activeStatus.details}
                </p>
                {activeStatus.txHash && (
                  <div className="pt-2 border-t border-emerald-500/20 font-mono text-[11px] text-emerald-300/80 flex items-center justify-between break-all">
                    <span>TxHash: {activeStatus.txHash}</span>
                  </div>
                )}
              </div>
            )}

            {activeStatus.state === 'WAITING_HARDWARE' && (
              <div className="glass-status-amber p-4 rounded-[8px] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-none bg-amber-400 inline-block" />
                    <span className="font-mono text-xs uppercase tracking-widest font-bold text-amber-300">
                      Awaiting Hardware Signature
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-amber-300 font-bold">
                    ESP32 OLED
                  </span>
                </div>
                <div className="text-sm font-semibold tracking-tight text-white/90">
                  {activeStatus.title}
                </div>
                <p className="text-xs text-white/70 leading-relaxed font-sans">
                  {activeStatus.details}
                </p>
                <div className="pt-2 border-t border-amber-500/20 font-mono text-[11px] text-amber-300/80">
                  Switch to "02. HARDWARE SIGNER" tab to review & approve.
                </div>
              </div>
            )}

            {activeStatus.state === 'BLOCKED_POLICY' && (
              <div className="glass-status-crimson p-4 rounded-[8px] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-none bg-rose-400 inline-block" />
                    <span className="font-mono text-xs uppercase tracking-widest font-bold text-rose-300">
                      Reverted By Policy
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-rose-300 font-bold">
                    REVERT
                  </span>
                </div>
                <div className="text-sm font-semibold tracking-tight text-white/90">
                  {activeStatus.title}
                </div>
                <p className="text-xs text-white/70 leading-relaxed font-sans">
                  {activeStatus.details}
                </p>
                {activeStatus.txHash && (
                  <div className="pt-2 border-t border-rose-500/20 font-mono text-[11px] text-rose-300/80 break-all">
                    Tx: {activeStatus.txHash}
                  </div>
                )}
              </div>
            )}

            {activeStatus.state === 'IDLE' && (
              <div className="glass p-4 rounded-[8px] space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/90 uppercase tracking-wider font-mono">
                    {activeStatus.title}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-none bg-white/45 inline-block" />
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  {activeStatus.details}
                </p>
              </div>
            )}
          </div>

          {/* Recent Transactions List */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium mb-2">
              Recent Transactions
            </div>

            <div className="space-y-2">
              {store.recentTransactions.slice(0, 5).map((tx) => {
                const isSuccess = tx.status === 'SUCCESS';
                const isWaiting = tx.status === 'WAITING_HARDWARE';

                return (
                  <div
                    key={tx.id}
                    className="glass p-3.5 rounded-[8px] flex items-center justify-between transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white/90 uppercase tracking-tight">
                        {tx.merchantName}
                      </div>
                      <div className="text-[10px] font-mono text-white/45">
                        {tx.txHash} • {tx.timestamp}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="font-mono text-xs font-bold text-white/90 tabular-nums">
                        ${tx.amountUsdc.toFixed(2)} USDC
                      </div>
                      <div className="flex items-center justify-end gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-none inline-block ${
                            isSuccess
                              ? 'bg-emerald-400'
                              : isWaiting
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`}
                        />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-white/70 font-medium">
                          {isSuccess ? 'MINED' : isWaiting ? 'PENDING OLED' : 'BLOCKED'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {store.recentTransactions.length === 0 && (
                <div className="p-8 text-center glass rounded-[8px] text-xs text-white/45 font-mono">
                  No transactions recorded yet in current session.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsView;
