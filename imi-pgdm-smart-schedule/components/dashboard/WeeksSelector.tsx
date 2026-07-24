'use client';

import { useEffect, useState } from 'react';
import type { WeeksToShow } from '@/hooks/useWeeksToShow';
import { MAX_WEEKS_TO_SHOW } from '@/hooks/useWeeksToShow';
import { cn } from '@/lib/utils/cn';

const PRESETS = [1, 2];

interface WeeksSelectorProps {
  value: WeeksToShow;
  onChange: (value: WeeksToShow) => void;
}

export function WeeksSelector({ value, onChange }: WeeksSelectorProps) {
  const [customText, setCustomText] = useState(String(value));

  // Keep the custom box showing the real value whenever it changes from
  // elsewhere (e.g. clicking a preset button), so the two controls never
  // visually disagree with each other.
  useEffect(() => {
    queueMicrotask(() => setCustomText(String(value)));
  }, [value]);

  const handleCustomInput = (raw: string) => {
    setCustomText(raw);
    const parsed = parseInt(raw, 10);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_WEEKS_TO_SHOW) {
      onChange(parsed);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="radiogroup"
        aria-label="Weeks to show"
        className="border-border bg-surface tabular inline-flex rounded-md border p-0.5"
      >
        {PRESETS.map((weeks) => (
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

      <div className="border-border bg-surface flex items-center gap-1.5 rounded-md border px-2.5 py-1.5">
        <label htmlFor="custom-weeks" className="text-muted text-xs whitespace-nowrap">
          Custom
        </label>
        <input
          id="custom-weeks"
          type="number"
          min={1}
          max={MAX_WEEKS_TO_SHOW}
          value={customText}
          onChange={(e) => handleCustomInput(e.target.value)}
          className="tabular focus-visible:ring-accent w-12 rounded bg-transparent text-sm font-medium outline-none focus-visible:ring-2"
        />
        <span className="text-muted text-xs whitespace-nowrap">wk (max {MAX_WEEKS_TO_SHOW})</span>
      </div>
    </div>
  );
}
