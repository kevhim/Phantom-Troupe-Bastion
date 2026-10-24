import React from 'react';
import { useBastionStore } from '../../store/useBastionStore';
import { X, ShieldAlert, CheckSquare, Clock, ArrowRight, ExternalLink } from 'lucide-react';

interface ApprovalDrawerProps {
  onOpenApprovalsRoute: () => void;
}

export const ApprovalDrawer: React.FC<ApprovalDrawerProps> = ({ onOpenApprovalsRoute }) => {
  const { isApprovalDrawerOpen, toggleApprovalDrawer, approvalQueue, selectApprovalForReview } = useBastionStore();

  if (!isApprovalDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 transition-none"
        onClick={() => toggleApprovalDrawer(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l-2 border-black text-black flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b-2 border-black flex items-center justify-between bg-surface">
            <div className="flex items-center space-x-2.5">
              <ShieldAlert className="w-5 h-5 text-[#c90000]" />
              <div>
                <h2 className="text-sm font-sans font-extrabold uppercase tracking-[0.12em] text-black">
                  Hardware Approval Queue
                </h2>
                <p className="text-[11px] font-mono text-muted">
                  {approvalQueue.length} Intent(s) Pending Physical Review
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleApprovalDrawer(false)}
              className="p-1.5 border-2 border-black hover:bg-black hover:text-white text-black transition-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Queue List */}
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            {approvalQueue.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-black bg-surface">
                <CheckSquare className="w-8 h-8 text-black mb-2" />
                <p className="text-xs font-sans font-bold uppercase tracking-wider text-black">
                  No Pending Hardware Exceptions
                </p>
                <p className="text-[11px] font-mono text-muted mt-1">
                  All transactions within autonomous policy limits
                </p>
              </div>
            ) : (
              approvalQueue.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 border-2 border-black hover:bg-surface transition-none cursor-pointer"
                  onClick={() => {
                    selectApprovalForReview(item.id);
                    onOpenApprovalsRoute();
                    toggleApprovalDrawer(false);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white font-bold uppercase tracking-wider">
                      {item.tierRequired.replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-1 text-[11px] font-mono font-bold text-muted">
                      <Clock className="w-3 h-3 text-black" />
                      <span>EXPIRES IN 58M</span>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="text-xl font-bold font-mono text-black">
                      ${item.intent.displayAmount.toFixed(2)} {item.intent.tokenSymbol}
                    </div>
                    <div className="text-xs font-sans text-black mt-1">
                      Recipient: <strong className="font-bold">{item.intent.recipientLabel}</strong>
                    </div>
                    <div className="text-[11px] font-mono text-muted truncate mt-0.5">
                      {item.intent.recipient}
                    </div>
                  </div>

                  <div className="bg-surface p-2 border border-black text-[11px] font-mono text-black mb-3">
                    <strong className="text-[#c90000]">MEMO:</strong> {item.intent.memo}
                  </div>

                  <div className="flex items-center justify-between text-xs font-sans font-bold uppercase tracking-wider pt-2 border-t-2 border-black">
                    <span>Inspect on ESP32 OLED</span>
                    <ExternalLink className="w-3.5 h-3.5 text-black" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Action */}
          <div className="p-5 border-t-2 border-black bg-surface">
            <button
              onClick={() => {
                onOpenApprovalsRoute();
                toggleApprovalDrawer(false);
              }}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-black hover:bg-[#c90000] text-white font-sans font-bold text-xs uppercase tracking-[0.12em] transition-none"
            >
              <span>Open Hardware Station</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
