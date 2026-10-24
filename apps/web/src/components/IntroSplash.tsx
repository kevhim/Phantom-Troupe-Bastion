import React, { useState, useEffect, useRef } from 'react';

interface IntroSplashProps {
  onComplete?: () => void;
  replayKey?: number;
}

export const IntroSplash: React.FC<IntroSplashProps> = ({ onComplete, replayKey = 0 }) => {
  const [isZooming, setIsZooming] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const triggeredRef = useRef(false);
  const prevReplayKeyRef = useRef(replayKey);

  // Reset ONLY when replayKey explicitly increments
  if (prevReplayKeyRef.current !== replayKey) {
    prevReplayKeyRef.current = replayKey;
    triggeredRef.current = false;
    if (isZooming) setIsZooming(false);
    if (isDismissed) setIsDismissed(false);
  }

  useEffect(() => {
    // If already dismissed, do nothing and ensure body scroll is unlocked
    if (isDismissed) {
      document.body.style.overflow = '';
      return;
    }

    // Lock page scrolling while intro is active
    document.body.style.overflow = 'hidden';

    const handleTrigger = () => {
      // Strict one-way latch: fire exactly once
      if (triggeredRef.current) return;
      triggeredRef.current = true;

      // Immediately detach all listeners
      window.removeEventListener('wheel', handleTrigger);
      window.removeEventListener('touchmove', handleTrigger);
      window.removeEventListener('keydown', handleKeyDown);

      // Start zoom animation
      setIsZooming(true);

      // One-time dismiss timer
      setTimeout(() => {
        setIsDismissed(true);
        document.body.style.overflow = '';
        onComplete?.();
      }, 1100);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'Enter', 'ArrowDown', 'ArrowUp', 'PageDown'].includes(e.code)) {
        e.preventDefault();
        handleTrigger();
      }
    };

    window.addEventListener('wheel', handleTrigger, { passive: true });
    window.addEventListener('touchmove', handleTrigger, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleTrigger);
      window.removeEventListener('touchmove', handleTouchMoveCleanup);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };

    function handleTouchMoveCleanup() {
      handleTrigger();
    }
  }, [replayKey, isDismissed, onComplete]);

  // Once dismissed, unmount completely — NEVER render again on scroll
  if (isDismissed) {
    return null;
  }

  const handleClick = () => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    setIsZooming(true);
    setTimeout(() => {
      setIsDismissed(true);
      document.body.style.overflow = '';
      onComplete?.();
    }, 1100);
  };

  return (
    <div
      onClick={handleClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white mix-blend-multiply overflow-hidden select-none cursor-pointer"
      style={{
        opacity: isZooming ? 0 : 1,
        transition: isZooming ? 'opacity 0.5s ease-out 0.35s' : 'none',
        pointerEvents: isZooming ? 'none' : 'auto',
        willChange: 'opacity',
      }}
      aria-label="Click or scroll to enter"
    >
      <div
        style={{
          transform: isZooming ? 'scale(85)' : 'scale(1)',
          transformOrigin: '50% 50%',
          transition: isZooming
            ? 'transform 1.1s cubic-bezier(0.7, 0, 0.15, 1)'
            : 'none',
          willChange: 'transform',
        }}
        className="flex items-center justify-center pointer-events-none"
      >
        <h1 className="text-[14vw] md:text-[12vw] font-black tracking-tighter text-white select-none whitespace-nowrap leading-none font-sans drop-shadow-sm">
          BASTIONX
        </h1>
      </div>
    </div>
  );
};

export default IntroSplash;
