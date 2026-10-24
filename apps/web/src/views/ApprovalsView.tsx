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
  Clock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

// ─── OLED Page Content ──────────────────────────────────────────────
const OledDisplay: React.FC<{
  page: 1 | 2 | 3;
  intent: {
    displayAmount: number;
    tokenSymbol: string;
    recipientLabel: string;
    recipient: string;
    calldataHash: string;
    chainId: number;
    functionSelector: string;
    memo: string;
  };
  nonce: number;
  displayDigest: string;
}> = ({ page, intent, nonce, displayDigest }) => {
  return (
    <div className="oled-screen p-4 font-mono text-[11px] leading-relaxed min-h-[180px]">
      <div className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider">
        ESP32 #1 SSD1306 — Page {page}/3
      </div>
      <div className="border-t border-gray-700 pt-2">
        {page === 1 && (
          <>
            <div className="text-white font-bold text-sm mb-2">PAYMENT REVIEW</div>
            <div className="space-y-1">
              <div><span className="text-gray-400">Amount:</span> <span className="text-white font-bold">${intent.displayAmount.toFixed(2)} {intent.tokenSymbol}</span></div>
              <div><span className="text-gray-400">To:</span> <span className="text-white">{intent.recipientLabel}</span></div>
              <div><span className="text-gray-400">Addr:</span> <span className="text-white text-[10px]">{intent.recipient.substring(0, 20)}...</span></div>
              <div><span className="text-gray-400">Memo:</span> <span className="text-white">{intent.memo}</span></div>
            </div>
          </>
        )}
        {page === 2 && (
          <>
            <div className="text-white font-bold text-sm mb-2">CALLDATA DIGEST</div>
            <div className="space-y-1">
              <div><span className="text-gray-400">Chain:</span> <span className="text-white">{intent.chainId}</span></div>
              <div><span className="text-gray-400">Selector:</span> <span className="text-white">{intent.functionSelector}</span></div>
              <div><span className="text-gray-400">Nonce:</span> <span className="text-white">{nonce}</span></div>
              <div className="pt-1"><span className="text-gray-400">Hash:</span></div>
              <div className="text-white text-[9px] break-all">{intent.calldataHash}</div>
            </div>
          </>
        )}
        {page === 3 && (
          <>
            <div className="text-white font-bold text-sm mb-2">SIGNING CONFIRMATION</div>
            <div className="space-y-1">
              <div><span className="text-gray-400">Display Digest:</span></div>
              <div className="text-white text-[9px] break-all">{displayDigest}</div>
              <div className="pt-2 text-[#c90000] font-bold">
                ▶ Press GPIO33 to APPROVE
              </div>
              <div className="text-gray-400">
                ▶ Press GPIO32 to PANIC HALT
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Signing Progress ───────────────────────────────────────────────
const SigningProgress: React.FC<{
  pagesScrolled: [boolean, boolean, boolean];
  cardObserved: string;
  esp32Signed: boolean;
  ownerCosigned: boolean;
  tierRequired: string;
}> = ({ pagesScrolled, cardObserved, esp32Signed, ownerCosigned, tierRequired }) => {
  const steps = [
    { label: 'Page 1 Viewed', done: pagesScrolled[0] },
    { label: 'Page 2 Viewed', done: pagesScrolled[1] },
    { label: 'Page 3 Viewed', done: pagesScrolled[2] },
    { label: 'RFID Card Tapped', done: cardObserved !== 'NO_CARD' },
    { label: 'GPIO33 Button Press', done: esp32Signed },
    ...(tierRequired === 'TIER_2_SENIOR' ? [
      { label: 'Owner Co-Sign', done: ownerCosigned }
    ] : []),
  ];

  return (
    <div className="border-2 border-black p-3 bg-white">
      <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-2">
        Signing Pipeline
      </div>
      <div className="space-y-1">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center space-x-2">
            <span className={`w-4 h-4 flex items-center justify-center border-2 border-black text-[10px] font-bold ${
              step.done ? 'bg-black text-white' : 'bg-white text-muted'
            }`}>
              {step.done ? '✓' : i + 1}
            </span>
            <span className={`text-xs font-mono ${step.done ? 'text-black font-bold' : 'text-muted'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── VIEW EXPORT ────────────────────────────────────────────────────
export const ApprovalsView: React.FC = () => {
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

  // Empty state
  if (!activeItem) {
    return (
      <div className="space-y-4">
        <div className="border-b-2 border-black pb-4">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-[#c90000] mb-1.5 flex items-center space-x-2">
            <span className="w-2 h-2 bg-[#c90000] inline-block" />
            <span>02 / HARDWARE APPROVAL STATION</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black leading-none uppercase">
            ESP32 PHYSICAL SIGNING.
          </h1>
        </div>
        <div className="h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-white border-2 border-black">
          <CheckSquare className="w-10 h-10 text-black mb-3" />
          <h2 className="text-base font-sans font-extrabold uppercase tracking-[0.12em] text-black">
            No Pending Hardware Approvals
          </h2>
          <p className="text-xs font-sans text-muted mt-2 max-w-sm">
            Submit an over-$25 payment in the Dashboard to queue a hardware approval.
          </p>
        </div>
      </div>
    );
  }

  const { intent, currentOledPage, pagesScrolled, weakCardRoleObserved, esp32Signature, ownerCosignVerified } = activeItem;
  const allPagesScrolled = pagesScrolled[0] && pagesScrolled[1] && pagesScrolled[2];
  const isReadyToSubmit = esp32Signature && (activeItem.tierRequired === 'TIER_1_JUNIOR' || ownerCosignVerified);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b-2 border-black pb-4">
        <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-[#c90000] mb-1.5 flex items-center space-x-2">
          <span className="w-2 h-2 bg-[#c90000] inline-block" />
          <span>02 / HARDWARE APPROVAL STATION</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black leading-none uppercase">
          ESP32 PHYSICAL SIGNING.
        </h1>
        <p className="text-sm font-sans text-muted mt-2 max-w-2xl">
          Review the canonical EIP-712 payload on the 128×64 OLED, tap your RFID card, and physically press GPIO33 to authorize.
        </p>
      </div>

      {/* Queue Selector */}
      {approvalQueue.length > 1 && (
        <div className="border-2 border-black p-3 bg-surface">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-2">
            Pending Queue ({approvalQueue.length})
          </div>
          <div className="flex space-x-2">
            {approvalQueue.map(item => (
              <button
                key={item.id}
                onClick={() => selectApprovalForReview(item.id)}
                className={`px-3 py-1.5 text-xs font-mono font-bold border-2 border-black transition-none ${
                  item.id === activeApprovalId
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-surface'
                }`}
              >
                ${item.intent.displayAmount.toFixed(2)} → {item.intent.recipientLabel}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* OLED Simulation */}
        <div className="xl:col-span-2 space-y-4">
          <div className="border-2 border-black bg-white p-4">
            <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-3 border-b border-rule-light pb-1.5 flex items-center space-x-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>SSD1306 OLED Display (128×64)</span>
            </div>

            {/* OLED Screen */}
            <OledDisplay
              page={currentOledPage}
              intent={intent}
              nonce={activeItem.nonce}
              displayDigest={activeItem.displayDigest}
            />

            {/* Page Navigation */}
            <div className="flex items-center space-x-2 mt-3">
              {([1, 2, 3] as const).map(p => (
                <button
                  key={p}
                  onClick={() => cycleOledPage(p)}
                  className={`flex-1 py-2 text-xs font-mono font-bold border-2 border-black transition-none ${
                    currentOledPage === p
                      ? 'bg-black text-white'
                      : pagesScrolled[p - 1]
                      ? 'bg-surface text-black'
                      : 'bg-white text-muted hover:bg-surface'
                  }`}
                >
                  Page {p} {pagesScrolled[p - 1] ? '✓' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Physical Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RFID */}
            <div className="border-2 border-black p-4 bg-white">
              <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-3 border-b border-rule-light pb-1.5 flex items-center space-x-2">
                <CreditCard className="w-3.5 h-3.5" />
                <span>RC522 RFID Reader</span>
              </div>
              <div className="mb-3">
                <span className="text-[10px] font-mono uppercase text-muted">Card Status: </span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 ${
                  weakCardRoleObserved === 'NO_CARD' ? 'bg-surface text-muted border border-black' : 'bg-black text-white'
                }`}>
                  {weakCardRoleObserved.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => tapRfidCard('CARD_1_JUNIOR')}
                  disabled={!allPagesScrolled}
                  className="w-full py-2 text-xs font-bold uppercase tracking-wider border-2 border-black bg-surface hover:bg-black hover:text-white text-black transition-none disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Tap Junior Card (UID-based)
                </button>
                <button
                  onClick={() => tapRfidCard('CARD_2_SENIOR')}
                  disabled={!allPagesScrolled}
                  className="w-full py-2 text-xs font-bold uppercase tracking-wider border-2 border-black bg-surface hover:bg-black hover:text-white text-black transition-none disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Tap Senior Card (UID-based)
                </button>
              </div>
              {!allPagesScrolled && (
                <p className="text-[10px] font-mono text-[#c90000] mt-2">
                  ⚠ Must view all 3 OLED pages first
                </p>
              )}
            </div>

            {/* GPIO Buttons */}
            <div className="border-2 border-black p-4 bg-white">
              <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-3 border-b border-rule-light pb-1.5 flex items-center space-x-2">
                <Radio className="w-3.5 h-3.5" />
                <span>GPIO Hardware Buttons</span>
              </div>
              <div className="space-y-2">
                <button
                  onClick={pressApproveButton}
                  disabled={weakCardRoleObserved === 'NO_CARD' || !allPagesScrolled}
                  className="w-full py-3 text-sm font-extrabold uppercase tracking-wider border-2 border-black bg-black text-white hover:bg-[#c90000] transition-none disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  GPIO33: APPROVE & SIGN
                </button>
                <button
                  onClick={pressPanicButton}
                  className="w-full py-3 text-sm font-extrabold uppercase tracking-wider border-2 border-[#c90000] bg-[#c90000] text-white hover:bg-black transition-none"
                >
                  GPIO32: PANIC HALT
                </button>
              </div>
              {activeItem.tierRequired === 'TIER_2_SENIOR' && esp32Signature && !ownerCosignVerified && (
                <button
                  onClick={signOwnerCoSignature}
                  className="w-full mt-3 py-2.5 text-xs font-bold uppercase tracking-wider border-2 border-black bg-surface hover:bg-black hover:text-white text-black transition-none"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Key className="w-3.5 h-3.5" />
                    <span>Owner Co-Sign (Tier 2 Required)</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* ESP32 Signature Output */}
          {esp32Signature && (
            <div className="border-2 border-black p-4 bg-white">
              <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-2 flex items-center space-x-2">
                <Fingerprint className="w-3.5 h-3.5" />
                <span>ESP32 EIP-712 Signature</span>
              </div>
              <div className="bg-surface p-2 border border-black text-[10px] font-mono break-all text-black">
                {esp32Signature}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold">VERIFIED</span>
                <span className="text-[10px] font-mono text-muted">
                  Signer: {activeItem.esp32SignerAddress}
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {isReadyToSubmit && (
            <button
              onClick={() => submitApprovedIntent(activeItem.id)}
              className="w-full py-4 text-base font-extrabold uppercase tracking-[0.12em] border-2 border-black bg-black text-white hover:bg-[#c90000] transition-none flex items-center justify-center space-x-3"
            >
              <Send className="w-5 h-5" />
              <span>SUBMIT APPROVED INTENT TO BUNDLER</span>
            </button>
          )}
        </div>

        {/* Right Column: Signing Progress */}
        <div className="space-y-4">
          <SigningProgress
            pagesScrolled={pagesScrolled}
            cardObserved={weakCardRoleObserved}
            esp32Signed={!!esp32Signature}
            ownerCosigned={ownerCosignVerified}
            tierRequired={activeItem.tierRequired}
          />

          {/* Intent Summary */}
          <div className="border-2 border-black p-3 bg-white">
            <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-2">
              Intent Summary
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted">Status</span>
                <span className="font-bold px-1.5 py-0.5 bg-black text-white text-[10px]">
                  {activeItem.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Amount</span>
                <span className="font-bold text-black">${intent.displayAmount.toFixed(2)} {intent.tokenSymbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Tier</span>
                <span className="font-bold text-black">{activeItem.tierRequired}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Nonce</span>
                <span className="font-bold text-black">{activeItem.nonce}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Deadline</span>
                <span className="font-bold text-black text-[10px]">
                  {new Date(activeItem.validityDeadlineUtc).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Tier Requirements */}
          <div className="border-2 border-black p-3 bg-surface">
            <div className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-muted mb-2">
              Approval Tier Requirements
            </div>
            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 border-2 border-black ${allPagesScrolled ? 'bg-black' : 'bg-white'}`} />
                <span className={allPagesScrolled ? 'text-black font-bold' : 'text-muted'}>OLED 3-Page Review</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 border-2 border-black ${weakCardRoleObserved !== 'NO_CARD' ? 'bg-black' : 'bg-white'}`} />
                <span className={weakCardRoleObserved !== 'NO_CARD' ? 'text-black font-bold' : 'text-muted'}>RFID Card Tap (UID-only)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 border-2 border-black ${esp32Signature ? 'bg-black' : 'bg-white'}`} />
                <span className={esp32Signature ? 'text-black font-bold' : 'text-muted'}>GPIO33 Button + EIP-712 Sign</span>
              </div>
              {activeItem.tierRequired === 'TIER_2_SENIOR' && (
                <div className="flex items-center space-x-2">
                  <span className={`w-3 h-3 border-2 border-black ${ownerCosignVerified ? 'bg-black' : 'bg-white'}`} />
                  <span className={ownerCosignVerified ? 'text-black font-bold' : 'text-muted'}>Owner EOA Co-Signature</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
