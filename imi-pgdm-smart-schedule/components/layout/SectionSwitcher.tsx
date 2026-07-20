'use client';

import type { TargetSection } from '@/types/timetable';
import { TARGET_SECTIONS } from '@/lib/sheet/constants';
import { cn } from '@/lib/utils/cn';

interface SectionSwitcherProps {
  value: TargetSection;
  onChange: (section: TargetSection) => void;
  disabled?: boolean;
}

export function SectionSwitcher({ value, onChange, disabled }: SectionSwitcherProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Section"
      aria-disabled={disabled}
      title={disabled ? 'Disabled while "Show all sections" is on in Settings' : undefined}
      className={cn(
        'border-border bg-surface tabular inline-flex rounded-md border p-0.5',
        disabled && 'opacity-40',
      )}
    >
      {TARGET_SECTIONS.map((section) => (
        <button
          key={section}
          role="radio"
          aria-checked={value === section}
          onClick={() => !disabled && onChange(section)}
          disabled={disabled}
          className={cn(
            'rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors',
            disabled && 'cursor-not-allowed',
            value === section && !disabled
              ? 'bg-accent text-background'
              : 'text-muted hover:text-foreground',
          )}
        >
          {section}
        </button>
      ))}
    </div>
  );
}
