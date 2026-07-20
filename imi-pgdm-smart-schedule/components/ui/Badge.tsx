import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type BadgeTone = 'amber' | 'teal' | 'muted' | 'danger';

const TONE_CLASSES: Record<BadgeTone, string> = {
  amber: 'bg-accent/15 text-accent border-accent/30',
  teal: 'bg-accent-2/15 text-accent-2 border-accent-2/30',
  muted: 'bg-muted/10 text-muted border-muted/20',
  danger: 'bg-danger/15 text-danger border-danger/30',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'muted', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase',
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
