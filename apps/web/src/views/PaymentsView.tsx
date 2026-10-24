import React, { useState } from 'react';
import { useBastionStore } from '../store/useBastionStore';
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Play, 
  ExternalLink,
  Info
} from 'lucide-react';

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
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Agent Payment Dispatch
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Issue payments via smart session key or test policy enforcement with one-click demo flows.
        </p>
      </div>

      {/* Two Clean Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ═══ LEFT CARD: SEND AGENT PAYMENT ═══ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h2 className="text-base font-semibold text-slate-900">Send Agent Payment</h2>
              <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100/80 border border-slate-200/60 px-2.5 py-0.5 rounded-full">
                Max Auto-Pay: ${store.maxPerTx}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Merchant Select */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Recipient Merchant
                </label>
                <select
                  value={selectedMerchant}
                  onChange={(e) => setSelectedMerchant(e.target.value)}
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-mono transition-all outline-none"
                >
                  <option value="0xABCD000000000000000000000000000000001234">
                    Verified Demo Cloud (0xABCD...1234 — Verified)
                  </option>
                  <option value="0x771A0000000000000000000000000000000088C2">
                    Sub-Vendor Compute (0x771A...88C2 — Verified)
                  </option>
                  <option value="0xFAKE000000000000000000000000000000009999">
                    Unknown Address (0xFAKE...9999 — Unverified)
                  </option>
                </select>
              </div>

              {/* Amount (USDC) */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
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
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-3.5 pr-14 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-mono transition-all outline-none"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-mono font-medium">
                    USDC
                  </span>
                </div>
              </div>

              {/* Invoice / Reference ID */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Invoice / Reference ID
                </label>
                <input
                  type="text"
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  placeholder="INV-2026-CLOUD-981"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-mono transition-all outline-none"
                />
              </div>

              {/* Primary Send Button */}
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm mt-2"
              >
                <Send size={15} />
                <span>Send Payment</span>
              </button>
            </form>
          </div>

          {/* ═══ ONE SINGLE DEMO RUNNER BAR ═══ */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              <Play size={12} className="text-slate-700" />
              <span>Quick Demo Runner</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => handleRunDemo(1)}
                className="w-full text-left p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 hover:bg-slate-100/70 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-800 group-hover:text-slate-900">
                    Example 1: $15 Auto-Pay
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Within $25 policy ceiling • Instant On-Chain Approval
                  </div>
                </div>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-mono">
                  Run
                </span>
              </button>

              <button
                onClick={() => handleRunDemo(2)}
                className="w-full text-left p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 hover:bg-slate-100/70 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-800 group-hover:text-slate-900">
                    Example 2: $50 Over-Limit
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Exceeds $25 threshold • Routes to ESP32 OLED Signer
                  </div>
                </div>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 font-mono">
                  Run
                </span>
              </button>

              <button
                onClick={() => handleRunDemo(3)}
                className="w-full text-left p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 hover:bg-slate-100/70 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-800 group-hover:text-slate-900">
                    Example 3: Unverified / Violation
                  </div>
                  <div className="text-[11px] text-slate-500">
                    0xFAKE address • Reverted on-chain by BastionAccount.sol
                  </div>
                </div>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 font-mono">
                  Run
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT CARD: LIVE EXECUTION & ACTIVITY ═══ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h2 className="text-base font-semibold text-slate-900">Live Execution & Activity</h2>
              <span className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md">
                {store.recentTransactions.length} recorded
              </span>
            </div>

            {/* Active Transaction Status Box */}
            <div className="mb-6">
              <div className="text-xs font-medium text-slate-500 mb-2">Active Transaction Status</div>
              {activeStatus.state === 'APPROVED_MINED' && (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span className="font-semibold text-xs tracking-tight">{activeStatus.title}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{activeStatus.details}</p>
                  {activeStatus.txHash && (
                    <div className="mt-2.5 pt-2 border-t border-emerald-200/60 text-[11px] font-mono text-emerald-700 flex items-center justify-between">
                      <span>TxHash: {activeStatus.txHash}</span>
                      <ExternalLink size={11} className="opacity-70" />
                    </div>
                  )}
                </div>
              )}

              {activeStatus.state === 'WAITING_HARDWARE' && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Clock size={16} className="text-amber-600 animate-pulse" />
                    <span className="font-semibold text-xs tracking-tight">{activeStatus.title}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{activeStatus.details}</p>
                  <div className="mt-2.5 pt-2 border-t border-amber-200/60 text-[11px] text-amber-800 flex items-center gap-1.5">
                    <Info size={12} />
                    <span>Switch to the "Hardware Signer" tab to review & approve on the ESP32 OLED twin.</span>
                  </div>
                </div>
              )}

              {activeStatus.state === 'BLOCKED_POLICY' && (
                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 text-rose-950">
                  <div className="flex items-center gap-2 mb-1.5">
                    <ShieldAlert size={16} className="text-rose-600" />
                    <span className="font-semibold text-xs tracking-tight">{activeStatus.title}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{activeStatus.details}</p>
                  {activeStatus.txHash && (
                    <div className="mt-2.5 pt-2 border-t border-rose-200/60 text-[11px] font-mono text-rose-700">
                      Reverted Tx: {activeStatus.txHash}
                    </div>
                  )}
                </div>
              )}

              {activeStatus.state === 'IDLE' && (
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 text-slate-600 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={15} className="text-slate-400" />
                    <span className="font-medium text-slate-800">{activeStatus.title}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{activeStatus.details}</p>
                </div>
              )}
            </div>

            {/* Bottom Section: Recent Transactions */}
            <div>
              <div className="text-xs font-medium text-slate-500 mb-2">Recent Transactions</div>
              <div className="border border-slate-200/70 rounded-xl overflow-hidden divide-y divide-slate-100">
                {store.recentTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="p-3 bg-white flex items-center justify-between text-xs hover:bg-slate-50/70 transition-colors">
                    <div className="space-y-0.5">
                      <div className="font-medium text-slate-800">{tx.merchantName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {tx.txHash} • {tx.timestamp}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-mono font-medium text-slate-900">
                        ${tx.amountUsdc.toFixed(2)} USDC
                      </div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                          tx.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : tx.status === 'WAITING_HARDWARE'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        }`}
                      >
                        {tx.status === 'SUCCESS' ? 'Mined' : tx.status === 'WAITING_HARDWARE' ? 'Pending OLED' : 'Blocked'}
                      </span>
                    </div>
                  </div>
                ))}

                {store.recentTransactions.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No transactions executed yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsView;
