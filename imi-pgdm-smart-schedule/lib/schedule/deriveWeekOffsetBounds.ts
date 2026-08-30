import type { DaySchedule, TargetSection } from '@/types/timetable';
import { startOfWeek } from '@/lib/utils/date';

export interface WeekOffsetBounds {
  /** Most negative offset that still lands on a week containing real data (term start). */
  min: number;
  /** Most positive offset that still lands on a week containing real data (term end). */
  max: number;
}

/**
 * Derives how far back/forward "week offset" navigation should be allowed
 * to go, based on the earliest and latest dates actually present in the
 * parsed schedule for this section — not a hardcoded guess. If the term's
 * data changes (new sheet, different batch), the bound adjusts on its own.
 */
export function deriveWeekOffsetBounds(
  days: DaySchedule[],
  section: TargetSection,
  now: Date,
): WeekOffsetBounds {
  const sectionDates = days.filter((d) => d.section === section).map((d) => d.date);

  if (sectionDates.length === 0) {
    return { min: 0, max: 0 };
  }

  const thisWeekStart = startOfWeek(now).getTime();
  const earliest = new Date(`${sectionDates.reduce((a, b) => (a < b ? a : b))}T00:00:00`);
  const latest = new Date(`${sectionDates.reduce((a, b) => (a > b ? a : b))}T00:00:00`);

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const min = Math.floor((startOfWeek(earliest).getTime() - thisWeekStart) / msPerWeek);
  const max = Math.ceil((startOfWeek(latest).getTime() - thisWeekStart) / msPerWeek);

  return { min, max };
}
