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
              <div className="bg-zinc-950 border border-zinc-800 rounded-[8px] p-5 font-mono min-h-[160px] flex flex-col justify-between text-emerald-400 relative overflow-hidden select-none shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
                {/* Header bar on OLED */}
                <div className="flex justify-between items-center text-[10px] text-emerald-500/80 border-b border-emerald-950 pb-1.5 mb-2">
                  <span className="font-bold tracking-wider">BASTION HW SIGNER v2.3</span>
                  <span>{approval ? `PAGE ${store.oledPage}/3` : 'IDLE'}</span>
                </div>

                {/* OLED Content based on state & page */}
                <div className="flex-1 flex flex-col justify-center py-1">
                  {store.rfidError ? (
                    <div className="space-y-1 py-1">
                      <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                        <span>⚠️</span>
                        <span>NFC AUTHENTICATION REQUIRED</span>
                      </div>
                      <div className="text-[10px] text-white/90 leading-tight font-sans">
                        {store.rfidError}
                      </div>
                      <div className="text-[9px] text-emerald-400 uppercase tracking-widest mt-1">
                        &gt; Tap Card 1 or Card 2 Below
                      </div>
                    </div>
                  ) : !approval ? (
                    <div className="space-y-1 text-center py-2">
                      <div className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">
                        TRUSTED SIGNER: IDLE
                      </div>
                      <div className="text-base font-bold text-emerald-300">
                        NO PENDING EXCEPTIONS
                      </div>
                      <div className="text-[9px] text-emerald-600 uppercase tracking-wider">
                        STATUS: ONLINE • FIRMWARE v2.3
                      </div>
                      <div className="text-[9px] text-white/50 pt-0.5">
                        {store.rfidState === 'NO_CARD' ? 'NFC SENSOR READY • TAP CARD' : `NFC CARD SCANNED: ${store.rfidState.replace('_', ' ')}`}
                      </div>
                    </div>
                  ) : (
                    <>
                      {store.oledPage === 1 && (
                        <div className="space-y-1">
                          <div className="text-[10px] text-emerald-500 uppercase tracking-widest">
                            AMOUNT REVIEW:
                          </div>
                          <div className="text-2xl font-bold text-emerald-300 tracking-wide tabular-nums">
                            ${approval.amountUsdc.toFixed(2)} USDC
                          </div>
                          <div className="text-[9px] text-emerald-600 uppercase tracking-wider">
                            POLICY: EXCEEDS ${store.maxPerTx.toFixed(2)} AUTONOMOUS
                          </div>
                        </div>
                      )}

                      {store.oledPage === 2 && (
                        <div className="space-y-1">
                          <div className="text-[10px] text-emerald-500 uppercase tracking-widest">
                            RECIPIENT REVIEW:
                          </div>
                          <div className="text-[11px] font-bold text-emerald-300 break-all leading-tight">
                            {approval.recipientAddress}
                          </div>
                          <div className="text-[9px] text-emerald-600 uppercase tracking-wider">
                            ENTITY: {approval.merchantName}
                          </div>
                        </div>
                      )}

                      {store.oledPage === 3 && (
                        <div className="space-y-1">
                          <div className="text-[10px] text-emerald-500 uppercase tracking-widest">
                            CALLDATA DIGEST:
                          </div>
                          <div className="text-[10px] text-emerald-300 break-all leading-tight font-mono">
                            {approval.calldataDigest.slice(0, 36)}...
                          </div>
                          {store.rfidState === 'NO_CARD' ? (
                            <div className="text-[9px] text-amber-400 font-bold uppercase tracking-wider mt-1 animate-pulse">
                              [AWAITING NFC CARD PRESENTATION]
                            </div>
                          ) : (
                            <div className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider mt-1 bg-emerald-950/70 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                              ✓ NFC PRESENT: {store.rfidState === 'CARD_1_JUNIOR' ? 'JUNIOR ($2K CAP)' : 'SENIOR ($10K CAP)'} → READY TO SIGN
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer status on OLED */}
                <div className="flex justify-between items-center text-[9px] border-t border-emerald-950 pt-1.5 mt-2">
                  <span className={store.rfidState === 'NO_CARD' ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    RFID: {store.rfidState === 'NO_CARD' ? 'NO CARD' : store.rfidState === 'CARD_1_JUNIOR' ? 'CARD 1 (JUNIOR)' : 'CARD 2 (SENIOR)'}
                  </span>
                  <span className={store.rfidState !== 'NO_CARD' && approval ? 'text-emerald-300 font-bold' : 'text-emerald-600'}>
                    {!approval ? 'IDLE' : store.rfidState === 'NO_CARD' ? 'WAITING_CARD' : store.gpio33Approve ? 'SIG_MINED' : 'READY_GPIO33'}
                  </span>
                </div>
              </div>

              {/* Prev / Next Page Buttons */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2">
                  {[1, 2, 3].map((page) => (
                    <button
                      key={page}
                      onClick={() => store.setOledPage(page as 1 | 2 | 3)}
                      disabled={!approval}
                      className={`px-3 py-1 text-[11px] font-mono transition-all rounded-[8px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
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
                    disabled={!approval}
                    className="glass-btn px-2.5 py-1 text-xs font-mono cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← PREV
                  </button>
                  <button
                    onClick={() => store.setOledPage(store.oledPage < 3 ? (store.oledPage + 1 as 1 | 2 | 3) : 1)}
                    disabled={!approval}
                    className="glass-btn px-2.5 py-1 text-xs font-mono cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
                    <span className={`w-1.5 h-1.5 rounded-none inline-block ${store.rfidState === 'NO_CARD' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <span className="uppercase tracking-wider font-bold">
                      {store.rfidState === 'NO_CARD' ? 'NO CARD PRESENT' : store.rfidState === 'CARD_1_JUNIOR' ? 'CARD 1: JUNIOR (UID: A1B2C3D4)' : 'CARD 2: SENIOR (UID: E5F6G7H8)'}
                    </span>
                  </div>
                </div>

                {/* RFID Selector Keys */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => store.setRfidState('NO_CARD')}
                    className={`py-2 px-2 text-[10px] uppercase tracking-wider font-mono transition-all rounded-[8px] cursor-pointer ${
                      store.rfidState === 'NO_CARD'
                        ? 'glass-btn-primary font-bold shadow-sm'
                        : 'glass-btn text-white/70'
                    }`}
                  >
                    Eject Card
                  </button>
                  <button
                    onClick={() => store.setRfidState('CARD_1_JUNIOR')}
                    className={`py-2 px-2 text-[10px] uppercase tracking-wider font-mono transition-all rounded-[8px] cursor-pointer ${
                      store.rfidState === 'CARD_1_JUNIOR'
                        ? 'glass-btn-primary font-bold shadow-sm'
                        : 'glass-btn text-white/70 hover:border-emerald-500/50'
                    }`}
                  >
                    ⚡ Tap Card 1 (Junior)
                  </button>
                  <button
                    onClick={() => store.setRfidState('CARD_2_SENIOR')}
                    className={`py-2 px-2 text-[10px] uppercase tracking-wider font-mono transition-all rounded-[8px] cursor-pointer ${
                      store.rfidState === 'CARD_2_SENIOR'
                        ? 'glass-btn-primary font-bold shadow-sm'
                        : 'glass-btn text-white/70 hover:border-emerald-500/50'
                    }`}
                  >
                    ⚡ Tap Card 2 (Senior)
                  </button>
                </div>
              </div>

              {/* GPIO Tactile Buttons */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium mb-1">
                  <span>Physical Tactile Key Switches</span>
                  {approval && (
                    <span className="text-emerald-400 font-bold lowercase italic text-[10px]">
                      * tap card above to auto-approve & sign
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* GPIO 33 Approve */}
                  <button
                    onClick={handleApprove}
                    disabled={!approval}
                    className={`py-3 px-3 rounded-[8px] font-mono text-xs uppercase tracking-widest font-bold transition-all cursor-pointer text-center ${
                      !approval
                        ? 'opacity-30 pointer-events-none glass text-white/40'
                        : 'glass-status-emerald text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:bg-emerald-900/50'
                    }`}
                  >
                    GPIO 33: Approve & Sign
                  </button>

                  {/* GPIO 32 Panic: Tinted Crimson Glass */}
                  <button
                    onClick={handlePanic}
                    className="glass-status-crimson py-3 px-3 rounded-[8px] text-rose-300 font-mono text-xs uppercase tracking-widest font-bold transition-all cursor-pointer text-center hover:bg-rose-950/60"
                  >
                    GPIO 32: Panic
                  </button>
                </div>
              </div>

              {/* Generated secp256k1 Signature Hex */}
              {store.deviceSignature && (
                <div className="glass-well p-3 space-y-1.5 border border-emerald-500/30">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-emerald-300 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-none inline-block" />
                    <span>secp256k1 Hardware Signature Generated:</span>
                  </div>
                  <div className="font-mono text-[10px] text-white/80 break-all bg-black/40 p-2 rounded border border-white/5">
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
