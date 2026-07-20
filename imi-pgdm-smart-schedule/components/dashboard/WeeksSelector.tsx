'use client';

import type { WeeksToShow } from '@/hooks/useWeeksToShow';
import { cn } from '@/lib/utils/cn';

const OPTIONS: WeeksToShow[] = [1, 2, 3, 4];

interface WeeksSelectorProps {
  value: WeeksToShow;
  onChange: (value: WeeksToShow) => void;
}

export function WeeksSelector({ value, onChange }: WeeksSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Weeks to show"
      className="border-border bg-surface tabular inline-flex rounded-md border p-0.5"
    >
      {OPTIONS.map((weeks) => (
        <button
          key={weeks}
          role="radio"
          aria-checked={value === weeks}
          onClick={() => onChange(weeks)}
          className={cn(
            'rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors',
            value === weeks ? 'bg-accent text-background' : 'text-muted hover:text-foreground',
          )}
        >
          {weeks}w
        </button>
      ))}
    </div>
  );
}
