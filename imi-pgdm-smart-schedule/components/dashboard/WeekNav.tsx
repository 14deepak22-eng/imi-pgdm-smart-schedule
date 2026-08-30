'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import type { DaySchedule, TargetSection } from '@/types/timetable';
import type { WeekOffset } from '@/hooks/useWeekOffset';
import { MAX_WEEK_OFFSET } from '@/hooks/useWeekOffset';
import { startOfWeek, formatWeekRange, toLocalISODate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

interface WeekNavProps {
  value: WeekOffset;
  onChange: (value: WeekOffset) => void;
  days: DaySchedule[];
  section: TargetSection;
  now: Date;
  /** Furthest-back offset that still lands on real data (term start). Defaults to 0 (no past navigation) for callers that don't pass it. */
  minOffset?: WeekOffset;
  /** Furthest-forward offset that still lands on real data (term end). Defaults to MAX_WEEK_OFFSET. */
  maxOffset?: WeekOffset;
}

function countWeekClasses(days: DaySchedule[], section: TargetSection, weekStart: Date): number {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return days
    .filter((d) => d.section === section)
    .filter((d) => {
      const date = new Date(`${d.date}T00:00:00`);
      return date >= weekStart && date <= weekEnd;
    })
    .reduce((sum, d) => sum + d.sessions.filter((s) => s.entries.length > 0).length, 0);
}

/** The "This week / Next week" pill toggle — sits beside the section heading. */
export function WeekPillToggle({ value, onChange }: Pick<WeekNavProps, 'value' | 'onChange'>) {
  return (
    <div
      role="radiogroup"
      aria-label="Select week"
      className="border-border bg-surface inline-flex w-fit rounded-md border p-0.5"
    >
      <button
        role="radio"
        aria-checked={value === 0}
        onClick={() => onChange(0)}
        className={cn(
          'rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors',
          value === 0 ? 'bg-accent text-background' : 'text-muted hover:text-foreground',
        )}
      >
        This week
      </button>
      <button
        role="radio"
        aria-checked={value === 1}
        onClick={() => onChange(1)}
        className={cn(
          'rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors',
          value === 1 ? 'bg-accent text-background' : 'text-muted hover:text-foreground',
        )}
      >
        Next week
      </button>
    </div>
  );
}

/**
 * Prev-arrow / date-range / next-arrow row, plus a jump-to-date calendar
 * icon. Arrows are circular buttons sitting close to the date block, not
 * spread to the container edges.
 */
export function WeekArrowBar({
  value,
  onChange,
  days,
  section,
  now,
  minOffset = 0,
  maxOffset = MAX_WEEK_OFFSET,
}: WeekNavProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const thisWeekStart = startOfWeek(now);
  const weekStart = new Date(thisWeekStart);
  weekStart.setDate(weekStart.getDate() + value * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const classCount = countWeekClasses(days, section, weekStart);
  const isCurrentWeek = value === 0;
  const isPastWeek = value < 0;

  const pickerMin = new Date(thisWeekStart);
  pickerMin.setDate(pickerMin.getDate() + minOffset * 7);
  const pickerMax = new Date(thisWeekStart);
  pickerMax.setDate(pickerMax.getDate() + maxOffset * 7 + 6);

  function openPicker() {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.click();
    }
  }

  function handlePickDate(dateStr: string) {
    if (!dateStr) return;
    const picked = new Date(`${dateStr}T00:00:00`);
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksFromNow = Math.round(
      (startOfWeek(picked).getTime() - thisWeekStart.getTime()) / msPerWeek,
    );
    onChange(Math.min(maxOffset, Math.max(minOffset, weeksFromNow)));
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        aria-label="Previous week"
        disabled={value <= minOffset}
        onClick={() => onChange(value - 1)}
        className="border-border bg-surface text-foreground hover:bg-surface-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="text-center">
        <p className="tabular text-base font-semibold">{formatWeekRange(weekStart, weekEnd)}</p>
        <p className="text-muted text-xs">
          {isCurrentWeek ? 'This week · ' : isPastWeek ? 'Past week · ' : ''}
          {classCount} {classCount === 1 ? 'class' : 'classes'}
        </p>
      </div>

      <button
        type="button"
        aria-label="Next week"
        disabled={value >= maxOffset}
        onClick={() => onChange(value + 1)}
        className="border-border bg-surface text-foreground hover:bg-surface-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="relative shrink-0">
        <button
          type="button"
          aria-label="Jump to a specific week"
          onClick={openPicker}
          className="border-border bg-surface text-muted hover:bg-surface-2 hover:text-foreground flex h-10 w-10 items-center justify-center rounded-full border transition-colors"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
        </button>
        <input
          ref={dateInputRef}
          type="date"
          aria-hidden="true"
          tabIndex={-1}
          value={toLocalISODate(weekStart)}
          min={toLocalISODate(pickerMin)}
          max={toLocalISODate(pickerMax)}
          onChange={(e) => handlePickDate(e.target.value)}
          className="pointer-events-none absolute inset-0 h-10 w-10 opacity-0"
        />
      </div>
    </div>
  );
}
