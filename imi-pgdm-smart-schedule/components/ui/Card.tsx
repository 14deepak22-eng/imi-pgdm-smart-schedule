import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'border-border bg-surface rounded-lg border',
        'shadow-[inset_0_1px_0_rgba(243,241,234,0.05),0_6px_16px_-6px_rgba(0,0,0,0.45)]',
        className,
      )}
      {...props}
    />
  );
}
