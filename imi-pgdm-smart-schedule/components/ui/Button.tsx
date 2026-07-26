import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'primary' | 'ghost' | 'outline';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-background border-foreground shadow-[3px_3px_0_0_var(--color-accent-2)] hover:brightness-110',
  ghost: 'bg-transparent text-foreground border-transparent hover:bg-surface-2 hover:border-border',
  outline:
    'bg-transparent border-border text-foreground shadow-[3px_3px_0_0_var(--color-border)] hover:bg-surface-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg border-2 px-3.5 py-2 text-sm font-bold tracking-wide uppercase transition-all duration-150',
        'active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
        'focus-visible:ring-accent focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
