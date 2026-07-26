'use client';

import { useEffect, useState } from 'react';
import { PartyPopper, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const CONFETTI_COLORS = ['var(--color-accent)', 'var(--color-accent-2)', 'var(--color-danger)'];
const CONFETTI_COUNT = 28;

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
}

function makeConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, id) => ({
    id,
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    duration: 2.2 + Math.random() * 1.2,
    color: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
    rotate: Math.random() * 360,
  }));
}

interface DayCompleteBannerProps {
  show: boolean;
  onDismiss: () => void;
}

export function DayCompleteBanner({ show, onDismiss }: DayCompleteBannerProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[] | null>(null);

  useEffect(() => {
    if (!show) return;
    queueMicrotask(() => setPieces(makeConfetti()));
    const id = setTimeout(() => setPieces(null), 3600);
    return () => clearTimeout(id);
  }, [show]);

  if (!show) return null;

  return (
    <>
      {pieces && (
        <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden>
          {pieces.map((p) => (
            <span
              key={p.id}
              className="absolute top-[-12px] h-2.5 w-2 rounded-sm"
              style={{
                left: `${p.left}%`,
                backgroundColor: p.color,
                transform: `rotate(${p.rotate}deg)`,
                animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      <Card className="flex items-center gap-3 p-4">
        <PartyPopper className="text-accent h-5 w-5 shrink-0" aria-hidden />
        <div className="flex-1">
          <p className="text-sm font-bold tracking-wide uppercase">You&apos;re done for today!</p>
          <p className="text-muted mt-0.5 text-xs">No more classes left on today&apos;s board.</p>
        </div>
        <button onClick={onDismiss} aria-label="Dismiss" className="text-muted hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </Card>
    </>
  );
}
