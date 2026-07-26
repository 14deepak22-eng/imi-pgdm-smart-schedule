'use client';

import { cn } from '@/lib/utils/cn';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

export function ToggleSwitch({ checked, onChange, label, description }: ToggleSwitchProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-muted mt-0.5 text-xs">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'border-border relative h-6 w-11 shrink-0 overflow-hidden rounded-full border-2 transition-colors',
          checked ? 'bg-accent' : 'bg-surface-2',
        )}
      >
        <span
          className={cn(
            'bg-background absolute top-0.5 left-0.5 h-4 w-4 rounded-full shadow-[1px_1px_0_0_rgba(0,0,0,0.4)] transition-transform',
            checked ? 'translate-x-6' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  );
}
