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
        'border-border bg-surface tabular inline-flex shrink-0 items-center rounded-md border p-0.5',
        disabled && 'opacity-40',
      )}
    >
      {/* "Sec" tag inside the pill, in front of A / B / C */}
      <span className="border-border-strong text-muted mr-0.5 border-r py-0.5 pr-2 pl-1.5 text-[11px] leading-tight font-medium select-none sm:pr-2.5 sm:pl-2 sm:text-xs">
        Sec
      </span>

      {TARGET_SECTIONS.map((section) => (
        <button
          key={section}
          type="button"
          role="radio"
          aria-checked={value === section}
          onClick={() => !disabled && onChange(section)}
          disabled={disabled}
          className={cn(
            'rounded-[5px] px-2 py-1 text-xs font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm',
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
