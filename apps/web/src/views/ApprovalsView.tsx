import React from 'react';
import { useBastionStore } from '../store/useBastionStore';

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
      {/* ═══ TWO-COLUMN REAL GLASS CARDS (24px PADDING) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ═══ LEFT CARD: PENDING HARDWARE REVIEW ═══ */}
        <div className="glass p-6 text-white/90 space-y-6 flex flex-col justify-between min-h-[520px]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-sm font-bold tracking-wide uppercase text-white/90">
                    Exception Review Queue
                  </h2>
                  <span className="font-serif italic text-xs text-white/45">§ 2.1</span>
                </div>
                <p className="text-xs text-white/60 mt-0.5">
                  Dual-authorization gate for policy overrides
                </p>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-amber-300">
                <span className="w-1.5 h-1.5 rounded-none bg-amber-400 inline-block" />
                <span className="uppercase tracking-wider font-bold">
                  {store.approvalQueue.length} QUEUED
                </span>
              </div>
            </div>

            {approval ? (
              <div className="space-y-6">
                {/* Tinted Amber Review Header */}
                <div className="glass-status-amber p-4 rounded-[8px] space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold">
                    <span>Awaiting Dual-Key Signature</span>
                    <span>Policy Exceeded</span>
                  </div>
                  <div className="text-3xl font-mono font-bold tracking-tight text-white mt-1 tabular-nums">
                    ${approval.amountUsdc.toFixed(2)}{' '}
                    <span className="text-xs font-normal text-amber-200/70 font-sans">USDC</span>
                  </div>
                  <div className="text-[11px] text-white/70 font-sans pt-1">
                    Exceeds the $25.00 auto-pay limit. Physical cryptographic signature required on-chain.
                  </div>
                </div>

                {/* Glass Spec Table */}
                <div className="glass rounded-[8px] divide-y divide-white/[0.08] text-xs overflow-hidden">
                  <div className="p-3.5 flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium">
                      Merchant Entity
                    </span>
                    <span className="text-white/90 font-bold uppercase tracking-tight">
                      {approval.merchantName}
                    </span>
                  </div>
                  <div className="p-3.5 flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium">
                      Recipient Address
                    </span>
                    <span className="text-white/70 font-mono text-[11px]">
                      {approval.recipientAddress.slice(0, 10)}...{approval.recipientAddress.slice(-6)}
                    </span>
                  </div>
                  <div className="p-3.5 flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium">
                      Invoice Reference
                    </span>
                    <span className="text-white/70 font-mono text-[11px]">
                      {approval.invoiceId}
                    </span>
                  </div>
                  <div className="p-3.5 flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium">
                      Validity Window
                    </span>
                    <span className="text-emerald-300 font-mono font-bold text-[11px]">
                      59M 30S REMAINING
                    </span>
                  </div>
                </div>

                <div className="glass rounded-[8px] p-3 text-[11px] text-white/70 leading-relaxed font-sans">
                  Inspect the 3 OLED pages on the right terminal. Verify transaction digest, select an authorized RFID tier, and press <strong>GPIO 33</strong> to sign.
                </div>
              </div>
            ) : (
              <div className="py-16 text-center space-y-4">
                <div className="w-10 h-10 rounded-[8px] glass flex items-center justify-center mx-auto text-emerald-400 font-mono text-xs font-bold">
                  ✓
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] font-bold text-white/90">
                    No Pending Exceptions
                  </div>
                  <p className="text-xs text-white/60 mt-1 max-w-xs mx-auto">
                    All transactions under $25 are autonomously settled. Any transaction &gt;$25 routes here.
                  </p>
                </div>
                <button
                  onClick={handleQueueTestItem}
                  className="glass-btn-primary py-2.5 px-4 text-xs uppercase tracking-[0.15em] font-medium transition-all cursor-pointer"
                >
                  Queue $50 Over-Limit Test Tx →
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/[0.08] text-[10px] font-mono text-white/45 uppercase tracking-widest flex items-center justify-between">
            <span>Hardware: ESP32-WROOM-32D</span>
            <span>Port: /dev/ttyUSB0 (Laptop B)</span>
          </div>
        </div>

        {/* ═══ RIGHT CARD: ESP32 PHYSICAL TERMINAL TWIN ═══ */}
        <div className="glass p-6 text-white/90 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
              <div>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-sm font-bold tracking-wide uppercase text-white/90">
                    Physical Signing Terminal
                  </h2>
                  <span className="font-serif italic text-xs text-white/45">§ 2.2</span>
                </div>
                <p className="text-xs text-white/60 mt-0.5">
                  ESP32 hardware station twin
                </p>
              </div>
              <span className="text-[10px] font-mono text-white/45 uppercase tracking-widest">
                SSD1306 128x64
              </span>
            </div>

            {/* ═══ 128x64 SSD1306 OLED SCREEN (OPAQUE BG-ZINC-950 HARDWARE INSET) ═══ */}
            <div className="mb-6">
              <div className="bg-zinc-950 border border-zinc-800 rounded-[8px] p-5 font-mono min-h-[154px] flex flex-col justify-between text-emerald-400 relative overflow-hidden select-none shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
                {/* Header bar on OLED */}
                <div className="flex justify-between items-center text-[10px] text-emerald-500/80 border-b border-emerald-950 pb-1.5 mb-2">
                  <span>BASTION HW SIGNER v2</span>
                  <span>PAGE {store.oledPage}/3</span>
                </div>

                {/* OLED Content based on page */}
                <div className="flex-1 flex flex-col justify-center py-1">
                  {store.oledPage === 1 && (
                    <div className="space-y-1">
                      <div className="text-[10px] text-emerald-500 uppercase tracking-widest">
                        AMOUNT REVIEW:
                      </div>
                      <div className="text-2xl font-bold text-emerald-300 tracking-wide tabular-nums">
                        {approval ? `$${approval.amountUsdc.toFixed(2)} USDC` : '$50.00 USDC'}
                      </div>
                      <div className="text-[9px] text-emerald-600 uppercase tracking-wider">
                        POLICY: EXCEEDS $25 AUTONOMOUS
                      </div>
                    </div>
                  )}

                  {store.oledPage === 2 && (
                    <div className="space-y-1">
                      <div className="text-[10px] text-emerald-500 uppercase tracking-widest">
                        RECIPIENT REVIEW:
                      </div>
                      <div className="text-[11px] font-bold text-emerald-300 break-all leading-tight">
                        {approval?.recipientAddress || '0xABCD000000000000000000000000000000001234'}
                      </div>
                      <div className="text-[9px] text-emerald-600 uppercase tracking-wider">
                        LABEL: {approval?.merchantName || 'Verified Demo Cloud'}
                      </div>
                    </div>
                  )}

                  {store.oledPage === 3 && (
                    <div className="space-y-1">
                      <div className="text-[10px] text-emerald-500 uppercase tracking-widest">
                        CALLDATA DIGEST:
                      </div>
                      <div className="text-[10px] text-emerald-300 break-all leading-tight font-mono">
                        {approval?.calldataDigest.slice(0, 36) || '0x22F100000000000000000000000000000000'}...
                      </div>
                      <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mt-1">
                        TAP RFID &gt; PRESS GPIO 33
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer status on OLED */}
                <div className="flex justify-between items-center text-[9px] text-emerald-600 border-t border-emerald-950 pt-1.5 mt-2">
                  <span>RFID: {store.rfidState.replace('_', ' ')}</span>
                  <span>{store.gpio33Approve ? 'SIG_READY' : 'WAITING_BTN'}</span>
                </div>
              </div>

              {/* Prev / Next Page Buttons */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2">
                  {[1, 2, 3].map((page) => (
                    <button
                      key={page}
                      onClick={() => store.setOledPage(page as 1 | 2 | 3)}
                      className={`px-3 py-1 text-[11px] font-mono transition-all rounded-[8px] cursor-pointer ${
                        store.oledPage === page
                          ? 'glass-btn-primary font-bold shadow-sm'
                          : 'glass-btn text-white/70'
                      }`}
                    >
                      P0{page}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => store.setOledPage(store.oledPage > 1 ? (store.oledPage - 1 as 1 | 2 | 3) : 3)}
                    className="glass-btn px-2.5 py-1 text-xs font-mono cursor-pointer"
                  >
                    ← PREV
                  </button>
                  <button
                    onClick={() => store.setOledPage(store.oledPage < 3 ? (store.oledPage + 1 as 1 | 2 | 3) : 1)}
                    className="glass-btn px-2.5 py-1 text-xs font-mono cursor-pointer"
                  >
                    NEXT →
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ RFID & GPIO HARDWARE KEYS ═══ */}
            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              {/* RC522 RFID Reader */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium">
                    RC522 RFID Authorization Tier
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/90">
                    <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 inline-block" />
                    <span className="uppercase tracking-wider font-bold">
                      {store.rfidState === 'NO_CARD' ? 'NO CARD' : store.rfidState === 'CARD_1_JUNIOR' ? 'CARD 1 (JUNIOR)' : 'CARD 2 (SENIOR)'}
                    </span>
                  </div>
                </div>

                {/* RFID Selector Keys */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => store.setRfidState('NO_CARD')}
                    className={`py-2 px-2 text-[10px] uppercase tracking-wider font-mono transition-all rounded-[8px] cursor-pointer ${
                      store.rfidState === 'NO_CARD'
                        ? 'glass-btn-primary font-bold'
                        : 'glass-btn text-white/70'
                    }`}
                  >
                    Eject Card
                  </button>
                  <button
                    onClick={() => store.setRfidState('CARD_1_JUNIOR')}
                    className={`py-2 px-2 text-[10px] uppercase tracking-wider font-mono transition-all rounded-[8px] cursor-pointer ${
                      store.rfidState === 'CARD_1_JUNIOR'
                        ? 'glass-btn-primary font-bold'
                        : 'glass-btn text-white/70'
                    }`}
                  >
                    Tap Card 1
                  </button>
                  <button
                    onClick={() => store.setRfidState('CARD_2_SENIOR')}
                    className={`py-2 px-2 text-[10px] uppercase tracking-wider font-mono transition-all rounded-[8px] cursor-pointer ${
                      store.rfidState === 'CARD_2_SENIOR'
                        ? 'glass-btn-primary font-bold'
                        : 'glass-btn text-white/70'
                    }`}
                  >
                    Tap Card 2
                  </button>
                </div>
              </div>

              {/* GPIO Tactile Buttons */}
              <div className="space-y-2 pt-2">
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium mb-1">
                  Physical Tactile Key Switches
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* GPIO 33 Approve: Tinted Emerald Glass */}
                  <button
                    onClick={handleApprove}
                    disabled={!approval}
                    className="glass-status-emerald py-3 px-3 rounded-[8px] disabled:opacity-30 disabled:pointer-events-none text-emerald-300 font-mono text-xs uppercase tracking-widest font-bold transition-all cursor-pointer text-center"
                  >
                    GPIO 33: Approve
                  </button>

                  {/* GPIO 32 Panic: Tinted Crimson Glass */}
                  <button
                    onClick={handlePanic}
                    className="glass-status-crimson py-3 px-3 rounded-[8px] text-rose-300 font-mono text-xs uppercase tracking-widest font-bold transition-all cursor-pointer text-center"
                  >
                    GPIO 32: Panic
                  </button>
                </div>
              </div>

              {/* Generated secp256k1 Signature Hex */}
              {store.deviceSignature && (
                <div className="glass-well p-3 space-y-1.5">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-emerald-300 font-bold">
                    Generated secp256k1 Hardware Signature:
                  </div>
                  <div className="font-mono text-[10px] text-white/80 break-all">
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
