import React from 'react';
import { useBastionStore } from '../store/useBastionStore';
import { 
  Cpu, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertOctagon, 
  CreditCard,
  Check,
  ShieldCheck,
  PlusCircle
} from 'lucide-react';

export const ApprovalsView: React.FC = () => {
  const store = useBastionStore();
  const approval = store.activeApproval;

  const handleApprove = () => {
    store.pressGpioApprove();
  };

  const handlePanic = () => {
    store.pressGpioPanic();
  };

  const handleQueueTestItem = () => {
    store.runDemoExample(2);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Hardware Signer Station
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Physical ESP32 #1 terminal with 128x64 OLED display, RC522 RFID reader, and GPIO hardware buttons.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ═══ LEFT CARD: PENDING HARDWARE REVIEW ═══ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] p-6 flex flex-col justify-between min-h-[480px]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-500" />
                <h2 className="text-base font-semibold text-slate-900">Pending Hardware Review</h2>
              </div>
              <span className="text-xs font-mono font-medium text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full">
                {store.approvalQueue.length} Queued
              </span>
            </div>

            {approval ? (
              <div className="space-y-5">
                {/* Amount Banner */}
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-950">
                  <div className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">
                    Amount Awaiting Authorization
                  </div>
                  <div className="text-3xl font-mono font-bold text-slate-900">
                    ${approval.amountUsdc.toFixed(2)}{' '}
                    <span className="text-sm font-normal text-slate-500">USDC</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-2">
                    Exceeds the $25.00 auto-pay limit. Dual-authorization policy enforced.
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Merchant Name</span>
                    <span className="text-slate-900 font-medium">{approval.merchantName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Recipient Address</span>
                    <span className="text-slate-700 font-mono">
                      {approval.recipientAddress.slice(0, 10)}...{approval.recipientAddress.slice(-6)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Invoice Reference</span>
                    <span className="text-slate-700 font-mono">{approval.invoiceId}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Validity Window</span>
                    <span className="text-emerald-700 font-mono font-medium">59m 30s remaining</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 text-[11px] text-slate-600 leading-relaxed">
                  Review the 3 OLED pages on the right, tap an authorized RFID credential, and press <strong>GPIO 33</strong> to sign.
                </div>
              </div>
            ) : (
              <div className="py-16 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <Check size={20} className="text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    No Pending Exceptions
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    All transactions under $25 are autonomously settled. Any transaction &gt;$25 routes here.
                  </p>
                </div>
                <button
                  onClick={handleQueueTestItem}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-medium text-white transition-all shadow-sm"
                >
                  <PlusCircle size={14} />
                  <span>Queue $50 Over-Limit Test Tx</span>
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Hardware Model: ESP32-WROOM-32D</span>
            <span>Port: /dev/ttyUSB0 (Laptop B)</span>
          </div>
        </div>

        {/* ═══ RIGHT CARD: ESP32 #1 PHYSICAL TERMINAL ═══ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-emerald-600" />
                <h2 className="text-base font-semibold text-slate-900">ESP32 #1 Physical Terminal</h2>
              </div>
              <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                SSD1306 128x64
              </span>
            </div>

            {/* ═══ 128x64 SSD1306 OLED SCREEN (PHYSICAL HARDWARE HOUSING) ═══ */}
            <div className="mb-6">
              <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-5 oled-screen-housing relative overflow-hidden font-mono min-h-[148px] flex flex-col justify-between">
                {/* Header bar on OLED */}
                <div className="flex justify-between items-center text-[10px] text-emerald-400/70 border-b border-emerald-950/80 pb-1.5 mb-2">
                  <span>BASTION HW SIGNER v2</span>
                  <span>PAGE {store.oledPage}/3</span>
                </div>

                {/* OLED Content based on page */}
                <div className="flex-1 flex flex-col justify-center py-1">
                  {store.oledPage === 1 && (
                    <div className="space-y-1">
                      <div className="text-[11px] text-emerald-400 font-bold tracking-wider">
                        AMOUNT REVIEW:
                      </div>
                      <div className="text-xl font-bold text-emerald-300 tracking-wide drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">
                        {approval ? `$${approval.amountUsdc.toFixed(2)} USDC` : '$50.00 USDC'}
                      </div>
                      <div className="text-[10px] text-emerald-500/80">
                        POLICY: EXCEEDS $25 AUTONOMOUS
                      </div>
                    </div>
                  )}

                  {store.oledPage === 2 && (
                    <div className="space-y-1">
                      <div className="text-[11px] text-emerald-400 font-bold tracking-wider">
                        RECIPIENT REVIEW:
                      </div>
                      <div className="text-xs font-bold text-emerald-300 break-all leading-relaxed">
                        {approval?.recipientAddress || '0xABCD000000000000000000000000000000001234'}
                      </div>
                      <div className="text-[10px] text-emerald-500/80">
                        LABEL: {approval?.merchantName || 'Verified Demo Cloud'}
                      </div>
                    </div>
                  )}

                  {store.oledPage === 3 && (
                    <div className="space-y-1">
                      <div className="text-[11px] text-emerald-400 font-bold tracking-wider">
                        CALLLDATA DIGEST:
                      </div>
                      <div className="text-[10px] text-emerald-300 break-all leading-normal font-mono">
                        {approval?.calldataDigest.slice(0, 36) || '0x22F100000000000000000000000000000000'}...
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                        TAP RFID &gt; PRESS GPIO 33
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer status on OLED */}
                <div className="flex justify-between items-center text-[9px] text-emerald-600/70 border-t border-emerald-950/80 pt-1.5 mt-2">
                  <span>RFID: {store.rfidState.replace('_', ' ')}</span>
                  <span>{store.gpio33Approve ? 'SIG_READY' : 'WAITING_BTN'}</span>
                </div>
              </div>

              {/* Prev / Next Page Buttons */}
              <div className="flex items-center justify-between mt-3 px-1">
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((page) => (
                    <button
                      key={page}
                      onClick={() => store.setOledPage(page as 1 | 2 | 3)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                        store.oledPage === page
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                      }`}
                    >
                      Page {page}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => store.setOledPage(store.oledPage > 1 ? (store.oledPage - 1 as 1 | 2 | 3) : 3)}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200/70 transition-colors"
                    title="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => store.setOledPage(store.oledPage < 3 ? (store.oledPage + 1 as 1 | 2 | 3) : 1)}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200/70 transition-colors"
                    title="Next page"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ HARDWARE STATUS STRIP: RFID & GPIO BUTTONS ═══ */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              {/* RC522 RFID Reader */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <CreditCard size={14} className="text-slate-400" />
                    <span>RC522 RFID Reader</span>
                  </div>
                  <span
                    className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-medium ${
                      store.rfidState === 'CARD_2_SENIOR'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : store.rfidState === 'CARD_1_JUNIOR'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                        : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                    }`}
                  >
                    {store.rfidState === 'NO_CARD' ? 'No Card' : store.rfidState === 'CARD_1_JUNIOR' ? 'Card 1 (Junior Tier)' : 'Card 2 (Senior Tier)'}
                  </span>
                </div>

                {/* RFID Selector Pills */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => store.setRfidState('NO_CARD')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-medium transition-all ${
                      store.rfidState === 'NO_CARD'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    Remove Card
                  </button>
                  <button
                    onClick={() => store.setRfidState('CARD_1_JUNIOR')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-medium transition-all ${
                      store.rfidState === 'CARD_1_JUNIOR'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    Tap Card 1
                  </button>
                  <button
                    onClick={() => store.setRfidState('CARD_2_SENIOR')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-medium transition-all ${
                      store.rfidState === 'CARD_2_SENIOR'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    Tap Card 2
                  </button>
                </div>
              </div>

              {/* GPIO Buttons */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-medium text-slate-500 mb-1">
                  Physical Tactile Switches
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* GPIO 33 Approve */}
                  <button
                    onClick={handleApprove}
                    disabled={!approval}
                    className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <CheckCircle size={15} />
                    <span>GPIO 33: Approve</span>
                  </button>

                  {/* GPIO 32 Panic */}
                  <button
                    onClick={handlePanic}
                    className="py-3 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <AlertOctagon size={15} />
                    <span>GPIO 32: Panic</span>
                  </button>
                </div>
              </div>

              {/* Generated secp256k1 Signature Hex */}
              {store.deviceSignature && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="text-[11px] text-emerald-700 font-medium mb-1 flex items-center gap-1.5">
                    <CheckCircle size={13} />
                    <span>Generated secp256k1 Hardware Signature:</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-700 break-all bg-white p-2 rounded-lg border border-slate-200">
                    {store.deviceSignature}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalsView;
