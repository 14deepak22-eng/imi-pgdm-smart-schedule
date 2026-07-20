'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { BatchOption } from '@/lib/schedule/deriveAvailableBatches';
import { cn } from '@/lib/utils/cn';

interface YearSwitcherProps {
  availableBatches: BatchOption[];
  selectedBatch: string | null;
  onSelect: (batchPrefix: string) => void;
}

export function YearSwitcher({ availableBatches, selectedBatch, onSelect }: YearSwitcherProps) {
  if (availableBatches.length === 0) {
    return null;
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="font-display text-lg font-bold tracking-wide uppercase">Your Year</h2>
        <p className="text-muted mt-1 text-sm">
          Switch batches if you picked the wrong one, or if you&apos;ve moved on to a new year.
          Switching resets the &quot;Show all sections&quot; default for that year (you can still
          change it below).
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {availableBatches.map((option) => {
          const active = option.batchPrefix === selectedBatch;
          return (
            <button
              key={option.batchPrefix}
              onClick={() => onSelect(option.batchPrefix)}
              className={cn(
                'flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-left transition-colors',
                active
                  ? 'border-accent bg-accent/10'
                  : 'border-border bg-surface-2 hover:border-accent/50',
              )}
            >
              <span className="font-medium">{option.batchPrefix}</span>
              <div className="flex items-center gap-2">
                <Badge tone={active ? 'amber' : 'muted'}>{option.yearLabel}</Badge>
                {active && <Badge tone="teal">Current</Badge>}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
