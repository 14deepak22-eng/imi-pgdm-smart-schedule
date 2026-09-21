import type { DaySchedule } from '@/types/timetable';
import type { ScheduleEvent } from '@/types/events';

export interface BatchOption {
  /** e.g. "PGDM 2025-27" */
  batchPrefix: string;
  startYear: number;
  /** 0 = most recently started batch, 1 = the one before that, etc. */
  rank: number;
  /** "1st Year", "2nd Year", "3rd Year", "4th Year", ... */
  yearLabel: string;
}

function parseStartYear(batchPrefix: string): number {
  const match = batchPrefix.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : 0;
}

function ordinalYearLabel(rank: number): string {
  const n = rank + 1;
  const lastTwo = n % 100;
  const lastDigit = n % 10;
  let suffix = 'th';
  if (lastTwo < 11 || lastTwo > 13) {
    if (lastDigit === 1) suffix = 'st';
    else if (lastDigit === 2) suffix = 'nd';
    else if (lastDigit === 3) suffix = 'rd';
  }
  return `${n}${suffix} Year`;
}

/**
 * Finds every distinct batch present in the parsed schedule and ranks
 * them by how recently each started — the most recently started batch
 * is rank 0 ("1st Year"), the one before it is rank 1 ("2nd Year"), and
 * so on. This ranking is fully relative (based on start year, not a
 * hardcoded list), so it keeps working correctly as batches graduate
 * and new ones begin, with no code changes needed year over year.
 *
 * A batch only counts if it has at least one real class session (a
 * non-holiday day with an actual subject entry). A batch that appears
 * ONLY on a standalone event row (e.g. a single mislabeled holiday/
 * seminar entry with a typo'd batch year) is deliberately excluded —
 * one stray event cell shouldn't be enough to conjure up a whole new
 * selectable year that doesn't really exist in the sheet.
 */
export function deriveAvailableBatches(
  classes: DaySchedule[],
  events: ScheduleEvent[],
): BatchOption[] {
  const batchesWithSubjects = new Set<string>();
  for (const day of classes) {
    if (day.isHoliday) continue;
    const hasSubject = day.sessions.some((slot) =>
      slot.entries.some((entry) => entry.subjectCode),
    );
    if (hasSubject) batchesWithSubjects.add(day.batch);
  }

  // Events only ever confirm/extend a batch that already has real
  // subjects — they never introduce a brand-new batch on their own.
  const batchSet = new Set(batchesWithSubjects);
  for (const event of events) {
    if (batchesWithSubjects.has(event.batch)) batchSet.add(event.batch);
  }

  const sorted = Array.from(batchSet).sort((a, b) => parseStartYear(b) - parseStartYear(a));

  return sorted.map((batchPrefix, index) => ({
    batchPrefix,
    startYear: parseStartYear(batchPrefix),
    rank: index,
    yearLabel: ordinalYearLabel(index),
  }));
}

/**
 * Per the requested rule: a 1st-year batch (rank 0, most recently
 * started) defaults to requiring an explicit section choice (not all
 * sections merged), while 2nd-year and beyond (rank >= 1) default to
 * showing all sections combined.
 */
export function defaultShowAllSectionsForRank(rank: number): boolean {
  return rank >= 1;
}
