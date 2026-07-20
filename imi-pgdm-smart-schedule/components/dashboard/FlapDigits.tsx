import { cn } from '@/lib/utils/cn';

interface FlapDigitsProps {
  /** Characters to render, one flap per character, e.g. "01:24:03" */
  value: string;
  className?: string;
  tone?: 'amber' | 'teal' | 'muted';
}

const TONE_TEXT: Record<NonNullable<FlapDigitsProps['tone']>, string> = {
  amber: 'text-accent',
  teal: 'text-accent-2',
  muted: 'text-muted',
};

export function FlapDigits({ value, className, tone = 'amber' }: FlapDigitsProps) {
  return (
    <div className={cn('tabular flex items-center gap-1 font-mono', className)} aria-hidden>
      {value.split('').map((char, i) =>
        char === ':' || char === ' ' ? (
          <span key={i} className={cn('px-0.5 text-2xl font-bold', TONE_TEXT[tone])}>
            {char === ':' ? ':' : '\u00A0'}
          </span>
        ) : (
          <span
            key={i}
            className={cn(
              'bg-ink relative flex h-10 w-8 items-center justify-center overflow-hidden rounded-[3px] text-2xl font-bold sm:h-12 sm:w-9 sm:text-3xl',
              'bg-[color-mix(in_srgb,var(--color-background)_88%,black)]',
              TONE_TEXT[tone],
            )}
          >
            {char}
            {/* Flap seam: a thin horizontal line + soft gradient, mimicking a split-flap panel */}
            <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/40" />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent" />
          </span>
        ),
      )}
    </div>
  );
}
