import React, { useState } from 'react';
import { useBastionStore } from '../store/useBastionStore';
import { 
  CheckSquare, 
  Cpu, 
  CreditCard, 
  Radio, 
  Send, 
  Key, 
  Fingerprint, 
  Check, 
  Copy, 
  Clock
} from 'lucide-react';

export const ApprovalsPage: React.FC = () => {
  const {
    approvalQueue,
    activeApprovalId,
    selectApprovalForReview,
    cycleOledPage,
    tapRfidCard,
    pressApproveButton,
    pressPanicButton,
    signOwnerCoSignature,
    submitApprovedIntent
  } = useBastionStore();

  const [copiedAddr, setCopiedAddr] = useState(false);
  const activeItem = approvalQueue.find(q => q.id === activeApprovalId) || approvalQueue[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  if (!activeItem) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white border-2 border-black">
        <CheckSquare className="w-12 h-12 text-black mb-3" />
        <h2 className="text-base font-sans font-extrabold uppercase tracking-[0.12em] text-black">
          No Pending Hardware Approvals
        </h2>
        <p className="text-xs font-sans text-muted mt-2 max-w-sm">
          All autonomous agent requests have been within policy. Initiate an over-$25 payment in the Agent Workbench to queue a hardware approval.
        </p>
      </div>
    );
  }

  const { intent, currentOledPage, pagesScrolled, weakCardRoleObserved, esp32Signature, ownerCosignVerified } = activeItem;
  const allPagesScrolled = pagesScrolled[0] && pagesScrolled[1] && pagesScrolled[2];
  const isReadyToSubmit = esp32Signature && (activeItem.tierRequired === 'TIER_1_JUNIOR' || ownerCosignVerified);

  return (
    <div className="space-y-8">
      {/* Swiss Header Grid */}
      <div className="border-b-2 border-black pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-[#c90000] mb-2 flex items-center space-x-2">
              <span className="w-2 h-2 bg-[#c90000] inline-block" />
              <span>SECTION 04 / PHYSICAL HARDWARE SIGNING STATION</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-black leading-none uppercase">
              OLED REVIEW & PHYSICAL GPIO.
            </h1>
            <p className="text-base text-muted font-normal mt-3 leading-relaxed max-w-2xl">
              Canonical operation is independently decoded on ESP32 #1, reviewed across pages on the direct I2C OLED, and signed on-device strictly following physical button actuation.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <span className="px-4 py-2 border-2 border-black bg-surface text-black font-mono font-bold text-xs uppercase tracking-wider">
              AUTHORITY TIER: <strong className="text-black">{activeItem.tierRequired.replace('_', ' ')}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (OLED Replica & Physical Controls) | Right Column (Intent & Signatures) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-2 border-black bg-black">
        
        {/* LEFT COLUMN: Physical Hardware Twins */}
        <div className="bg-white p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-6">
          
          {/* Widget 3: HardwareOLEDPreview (128x64 SSD1306 Screen Digital Twin) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-[#c90000]">04.3</span>
                <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                  Hardware OLED Preview (128x64 SSD1306 Replica)
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
                DIRECT I2C 0x3C
              </span>
            </div>

            {/* The Pixelated Pure Black Screen Frame */}
            <div className="border-4 border-black bg-black p-5 font-mono select-none">
              <div className="text-[11px] text-white/70 flex justify-between border-b border-white/20 pb-1.5 mb-3 font-bold uppercase">
                <span>ESP32 #1 SIGNER STATION</span>
                <span>PAGE {currentOledPage}/3</span>
              </div>

              {currentOledPage === 1 && (
                <div className="space-y-2 py-2 text-white">
                  <div className="text-[11px] text-[#c90000] font-bold uppercase tracking-wider">[01 / OPERATION REVIEW]</div>
                  <div className="text-2xl font-bold tracking-tight">
                    PAY: ${intent.displayAmount.toFixed(2)} {intent.tokenSymbol}
                  </div>
                  <div className="text-xs font-bold text-slate-200">
                    TO: {intent.recipientLabel}
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1 font-mono">
                    CHAIN ID: 31337 (ANVIL LOCAL)
                  </div>
                </div>
              )}

              {currentOledPage === 2 && (
                <div className="space-y-2 py-2 text-white">
                  <div className="text-[11px] text-[#c90000] font-bold uppercase tracking-wider">[02 / FULL RECIPIENT ADDR]</div>
                  <div className="text-xs font-mono text-white break-all leading-relaxed font-bold">
                    {intent.recipient}
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    SELECTOR: {intent.functionSelector} (transfer)
                  </div>
                </div>
              )}

              {currentOledPage === 3 && (
                <div className="space-y-2 py-2 text-white">
                  <div className="text-[11px] text-[#c90000] font-bold uppercase tracking-wider">[03 / CANONICAL DIGEST]</div>
                  <div className="text-[11px] font-mono text-white break-all leading-tight font-bold">
                    {activeItem.displayDigest}
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    NONCE: {activeItem.nonce} | TIER: {activeItem.tierRequired}
                  </div>
                </div>
              )}

              <div className="text-[10px] text-slate-400 pt-2 mt-2 border-t border-white/20 flex justify-between uppercase font-bold">
                <span>SCROLL VIA PHYSICAL ENCODER</span>
                <span className="text-[#c90000]">READY</span>
              </div>
            </div>

            {/* Read-Only Disclaimer */}
            <div className="text-xs font-sans text-black bg-surface p-3 border-2 border-black leading-relaxed">
              <strong>MANDATORY PROTOCOL:</strong> This display is a read-only secondary replica. 
              The supervisor must directly inspect the physical OLED screen on Laptop B before activating Button #2.
            </div>

            {/* Page Scrolling Controls */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-sans font-bold uppercase tracking-wider text-black">
                Simulate Hardware Encoder Page:
              </span>
              <div className="flex border-2 border-black">
                {[1, 2, 3].map((p) => (
                  <button
                    key={p}
                    onClick={() => cycleOledPage(p as any)}
                    className={`px-3 py-1 text-xs font-mono font-bold transition-none ${
                      currentOledPage === p 
                        ? 'bg-black text-white' 
                        : 'bg-white text-black hover:bg-surface border-r-2 last:border-r-0 border-black'
                    }`}
                  >
                    Page {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Widget 4: ReviewPagesChecklist */}
          <div className="space-y-2 pt-2 border-t-2 border-black">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                4. Review Pages Verification
              </span>
              <span className={`text-[10px] font-mono font-bold uppercase ${
                allPagesScrolled ? 'text-black' : 'text-[#c90000]'
              }`}>
                {allPagesScrolled ? 'ALL 3 PAGES SCROLLED' : 'SCROLL ALL 3 PAGES'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {['P1: Amount', 'P2: Address', 'P3: Digest'].map((name, i) => (
                <div key={i} className={`p-2.5 border-2 border-black flex items-center justify-center space-x-1.5 font-bold ${
                  pagesScrolled[i] ? 'bg-black text-white' : 'bg-surface text-muted'
                }`}>
                  <Check className="w-3.5 h-3.5" />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 5: RFIDRoleState (RC522 SPI) */}
          <div className="space-y-3 pt-2 border-t-2 border-black">
            <div className="flex items-center justify-between border-b border-rule-light pb-2">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-[#c90000]">04.5</span>
                <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                  RFID Role Credential (RC522 SPI)
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold">3.3V BUS</span>
            </div>

            <div className="flex items-center justify-between bg-surface p-4 border-2 border-black">
              <div>
                <div className="text-[10px] font-sans uppercase font-bold text-muted">Card Observed</div>
                <div className="text-sm font-mono font-extrabold text-black mt-0.5 uppercase">
                  {weakCardRoleObserved === 'NO_CARD' && 'NO CARD PRESENT'}
                  {weakCardRoleObserved === 'CARD_1_JUNIOR' && 'CARD 1: JUNIOR TIER'}
                  {weakCardRoleObserved === 'CARD_2_SENIOR' && 'CARD 2: SENIOR TIER'}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => tapRfidCard('CARD_1_JUNIOR')}
                  className="px-3 py-1.5 bg-white hover:bg-black hover:text-white text-black border-2 border-black text-xs font-mono font-bold uppercase transition-none"
                >
                  Tap Card 1
                </button>
                <button
                  onClick={() => tapRfidCard('CARD_2_SENIOR')}
                  className="px-3 py-1.5 bg-white hover:bg-black hover:text-white text-black border-2 border-black text-xs font-mono font-bold uppercase transition-none"
                >
                  Tap Card 2
                </button>
              </div>
            </div>

            <p className="text-[11px] font-sans text-muted">
              * Invariant S7: RFID UID is a tier selector, not cryptographic proof. Financial ceilings are enforced on-chain.
            </p>
          </div>

          {/* Widget 6: PhysicalButtonStatus (GPIO32 Panic & GPIO33 Approve) */}
          <div className="space-y-3 pt-2 border-t-2 border-black">
            <div className="flex items-center justify-between border-b border-rule-light pb-2">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-[#c90000]">04.6</span>
                <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                  Physical Button Actuation (Direct GPIO)
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold">DEBOUNCED</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Button 2: Approve GPIO33 */}
              <div className="bg-surface p-3.5 border-2 border-black space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-sans font-bold uppercase text-[10px]">Button #2 (Approve)</span>
                  <span className="font-bold">GPIO33</span>
                </div>
                <div className="font-mono text-xs font-bold uppercase">
                  {activeItem.buttonApprovePressed ? '✓ PRESSED ON DEVICE' : 'WAITING FOR PRESS'}
                </div>
                <button
                  onClick={pressApproveButton}
                  className="w-full py-2 px-3 bg-black hover:bg-[#c90000] text-white font-sans text-xs font-bold uppercase tracking-wider transition-none"
                >
                  Simulate GPIO33 Press
                </button>
              </div>

              {/* Button 1: Panic GPIO32 */}
              <div className="bg-surface p-3.5 border-2 border-black space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-sans font-bold uppercase text-[10px]">Button #1 (Panic)</span>
                  <span className="font-bold text-[#c90000]">GPIO32</span>
                </div>
                <div className="font-mono text-xs font-bold uppercase text-muted">
                  RELEASED
                </div>
                <button
                  onClick={pressPanicButton}
                  className="w-full py-2 px-3 bg-white hover:bg-[#c90000] hover:text-white text-black border-2 border-black font-sans text-xs font-bold uppercase tracking-wider transition-none"
                >
                  Trigger Panic GPIO32
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Intent Verification, Signatures & Execution */}
        <div className="bg-white p-6 space-y-6">
          
          {/* Widget 1: ExceptionQueue */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-[#c90000]">04.1</span>
                <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                  Exception Request Queue
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
                {approvalQueue.length} QUEUED
              </span>
            </div>

            <div className="space-y-2">
              {approvalQueue.map((item) => (
                <div
                  key={item.id}
                  onClick={() => selectApprovalForReview(item.id)}
                  className={`p-4 border-2 border-black cursor-pointer transition-none text-xs ${
                    item.id === activeApprovalId
                      ? 'bg-black text-white'
                      : 'bg-white text-black hover:bg-surface'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold font-mono text-sm">
                      ${item.intent.displayAmount.toFixed(2)} {item.intent.tokenSymbol}
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-sans mt-1 opacity-90 truncate">
                    To: {item.intent.recipientLabel} ({item.intent.recipient.substring(0, 10)}...)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 2: CanonicalIntentSummary */}
          <div className="space-y-3 pt-2 border-t-2 border-black">
            <div className="flex items-center justify-between border-b border-rule-light pb-2">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-[#c90000]">04.2</span>
                <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                  Canonical Intent Summary
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold">EIP-712 TYPED</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-surface p-3 border-2 border-black">
                <span className="text-[10px] font-sans uppercase font-bold text-muted">Full Recipient Address</span>
                <div className="flex items-center justify-between text-black font-extrabold mt-1">
                  <span className="break-all mr-2">{intent.recipient}</span>
                  <button onClick={() => handleCopy(intent.recipient)}>
                    {copiedAddr ? <Check className="w-3.5 h-3.5 text-[#c90000]" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-surface p-2.5 border border-black">
                  <span className="text-[10px] font-sans uppercase font-bold text-muted">Base Units</span>
                  <div className="text-black font-extrabold">{intent.amountUnits}</div>
                </div>
                <div className="bg-surface p-2.5 border border-black">
                  <span className="text-[10px] font-sans uppercase font-bold text-muted">Selector</span>
                  <div className="text-black font-extrabold">{intent.functionSelector}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 7 & 8: Signatures */}
          <div className="space-y-4 pt-2 border-t-2 border-black">
            <div className="flex items-center justify-between border-b border-rule-light pb-2">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-[#c90000]">04.7</span>
                <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                  Dual Authority Signatures
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase">
                HARDWARE + OWNER
              </span>
            </div>

            {/* ESP32 Device Signature */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-sans font-bold text-black uppercase text-[11px]">ESP32 #1 Hardware Signature:</span>
                <span className={`font-mono text-[10px] font-bold ${
                  esp32Signature ? 'text-black' : 'text-[#c90000]'
                }`}>
                  {esp32Signature ? '● VERIFIED SECP256K1' : 'AWAITING BUTTON PRESS'}
                </span>
              </div>
              <div className="bg-surface p-2.5 border border-black font-mono text-[11px] text-black font-bold truncate">
                {esp32Signature || '0x... (Awaiting GPIO33 physical approve button)'}
              </div>
            </div>

            {/* Owner Co-Signature (Laptop B Independent Wallet) */}
            <div className="space-y-2 pt-2 border-t border-rule-light">
              <div className="flex justify-between items-center text-xs">
                <span className="font-sans font-bold text-black uppercase text-[11px]">Owner Co-Signature (Laptop B):</span>
                <span className={`font-mono text-[10px] font-bold ${
                  ownerCosignVerified ? 'text-black' : 'text-[#c90000]'
                }`}>
                  {ownerCosignVerified ? '● CO-SIGNED' : 'REQUIRED FOR SENIOR'}
                </span>
              </div>
              <button
                onClick={signOwnerCoSignature}
                className="w-full py-2 px-3 bg-white hover:bg-black hover:text-white text-black border-2 border-black font-sans text-xs font-bold uppercase tracking-wider transition-none"
              >
                Sign Co-Authorization EIP-712 as Owner
              </button>
            </div>
          </div>

          {/* Widget 9 & 10: Nonce, Expiry & Submission */}
          <div className="space-y-4 pt-2 border-t-2 border-black">
            <div className="flex items-center justify-between border-b border-rule-light pb-2">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-[#c90000]">04.9</span>
                <h2 className="text-xs font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                  Replay Protection & Final Submission
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold">NONCE {activeItem.nonce}</span>
            </div>

            <div className="flex justify-between items-center text-xs font-mono bg-surface p-2.5 border border-black">
              <span className="font-sans uppercase font-bold text-muted text-[10px]">Nonce:</span>
              <span className="font-bold text-black">{activeItem.nonce}</span>
              <span className="font-sans uppercase font-bold text-muted text-[10px] ml-4">Expires In:</span>
              <span className="font-bold text-black">58m 22s</span>
            </div>

            <button
              onClick={() => submitApprovedIntent(activeItem.id)}
              disabled={!isReadyToSubmit}
              className={`w-full py-3.5 px-4 font-sans font-extrabold text-xs uppercase tracking-[0.12em] transition-none border-2 border-black flex items-center justify-center space-x-2 ${
                isReadyToSubmit
                  ? 'bg-black hover:bg-[#c90000] text-white cursor-pointer'
                  : 'bg-surface text-muted cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Submit Fully Authorized UserOp to Chain</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
