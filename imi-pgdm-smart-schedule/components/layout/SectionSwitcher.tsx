'use client';

import type { TargetSection } from '@/types/timetable';
import { TARGET_SECTIONS } from '@/lib/sheet/constants';
import { cn } from '@/lib/utils/cn';

interface SectionSwitcherProps {
  value: TargetSection;
  onChange: (section: TargetSection) => void;
  /** True while "Show all sections" is on — the highlight stretches over A/B/C and reads "All". */
  disabled?: boolean;
}

/**
 * Section switcher: a "Sec" label attached to the left, then A / B / C
 * with an amber highlight that slides between them. When "Show all
 * sections" is on, the highlight stretches across all three slots and
 * says "All" instead of dimming the letters, so it's obvious every
 * section is combined. Width stays the same in both states, so the
 * header never shifts.
 *
 * Each letter slot has a fixed width (--slot) so the highlight can be
 * positioned with plain math: translateX(slot * index).
 */
export function SectionSwitcher({ value, onChange, disabled }: SectionSwitcherProps) {
  const index = Math.max(0, TARGET_SECTIONS.indexOf(value));
  const slots = TARGET_SECTIONS.length;

  return (
    <div
      role="radiogroup"
      aria-label="Section"
      aria-disabled={disabled}
      title={disabled ? 'Showing all sections — turn off "Show all sections" in Settings to pick one' : undefined}
      className={cn(
        // --slot = width of one letter button (phone / larger screens)
        '[--slot:1.75rem] sm:[--slot:2.25rem]',
        'border-border-strong bg-surface tabular inline-flex shrink-0 items-stretch overflow-hidden rounded-md border',
      )}
    >
      {/* Attached "Sec" label */}
      <span
        className={cn(
          'border-border-strong bg-surface-2 flex items-center border-r px-2 text-[11px] font-medium tracking-wide select-none sm:px-3 sm:text-xs',
          disabled ? 'text-muted/60' : 'text-muted',
        )}
      >
        Sec
      </span>

      <div className="relative flex p-0.5">
        {/* Sliding highlight */}
        <span
          aria-hidden
          className={cn(
            'absolute top-0.5 bottom-0.5 left-0.5 w-[var(--slot)] rounded-[5px]',
            'transition-[transform,width,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-reduce:transition-none',
            disabled ? 'bg-accent/15 ring-accent/60 ring-1 ring-inset' : 'bg-accent',
          )}
          style={{
            width: disabled ? `calc(var(--slot) * ${slots})` : undefined,
            transform: disabled ? 'translateX(0)' : `translateX(calc(var(--slot) * ${index}))`,
          }}
        />

        {TARGET_SECTIONS.map((section) => {
          const active = value === section && !disabled;
          return (
            <button
              key={section}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              tabIndex={disabled ? -1 : undefined}
              onClick={() => onChange(section)}
              className={cn(
                'relative z-10 h-6 w-[var(--slot)] rounded-[5px] text-xs font-medium transition-[color,opacity] duration-200 sm:h-8 sm:text-sm',
                disabled && 'pointer-events-none opacity-0',
                active ? 'text-background' : 'text-muted hover:text-foreground',
              )}
            >
              {section}
            </button>
          );
        })}

        {/* "All" label, fades in over the stretched highlight */}
        <span
          aria-hidden={!disabled}
          className={cn(
            'text-accent pointer-events-none absolute inset-0.5 flex items-center justify-center text-xs font-medium transition-opacity duration-300 sm:text-sm',
            disabled ? 'opacity-100' : 'opacity-0',
          )}
        >
          All
        </span>
      </div>
    </div>
  );
}
