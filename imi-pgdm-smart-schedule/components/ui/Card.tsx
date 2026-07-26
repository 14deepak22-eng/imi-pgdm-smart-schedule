import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'border-border bg-surface rounded-xl border-2',
        'shadow-[4px_4px_0_0_var(--color-surface-2)]',
        className,
      )}
      {...props}
    />
  );
}
