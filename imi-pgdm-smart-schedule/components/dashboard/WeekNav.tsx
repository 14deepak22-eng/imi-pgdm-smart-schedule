'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
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
}

function countWeekClasses(
  days: DaySchedule[],
  section: TargetSection,
  weekStart: Date,
): number {
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

export function WeekNav({ value, onChange, days, section, now }: WeekNavProps) {
  const thisWeekStart = startOfWeek(now);
  const weekStart = new Date(thisWeekStart);
  weekStart.setDate(weekStart.getDate() + value * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const classCount = countWeekClasses(days, section, weekStart);
  const isCurrentWeekToday =
    value === 0 && toLocalISODate(now) >= toLocalISODate(thisWeekStart);

  return (
    <div className="flex flex-col items-center gap-2">
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

      <div className="border-border bg-surface flex items-center justify-between gap-2 rounded-md border px-2 py-1.5">
        <button
          type="button"
          aria-label="Previous week"
          disabled={value <= 0}
          onClick={() => onChange(value - 1)}
          className="text-muted hover:text-foreground rounded p-1.5 transition-colors disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="text-center">
          <p className="tabular text-sm font-semibold">{formatWeekRange(weekStart, weekEnd)}</p>
          <p className="text-muted text-xs">
            {isCurrentWeekToday ? 'This week · ' : ''}
            {classCount} {classCount === 1 ? 'class' : 'classes'}
          </p>
        </div>

        <button
          type="button"
          aria-label="Next week"
          disabled={value >= MAX_WEEK_OFFSET}
          onClick={() => onChange(value + 1)}
          className="text-muted hover:text-foreground rounded p-1.5 transition-colors disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
