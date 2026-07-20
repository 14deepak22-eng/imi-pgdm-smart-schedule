import type { DaySchedule } from '@/types/timetable';
import { CANONICAL_SUBJECT_CODES_BY_BATCH } from '@/lib/sheet/constants';

/**
 * Returns the full list of subjects to offer in the Settings picker for
 * ONE specific batch: that batch's complete, authoritative canonical
 * list (always shown in full, so nothing is missing even before the
 * sheet has loaded), plus any extra codes actually found in the parsed
 * schedule for that batch that aren't already in the canonical list —
 * a safety net for batches with no canonical list configured yet, or in
 * case a new subject gets added to the sheet later.
 *
 * Returns an empty list if no batch is selected yet.
 */
export function deriveAvailableSubjects(days: DaySchedule[], batchPrefix: string | null): string[] {
  if (!batchPrefix) return [];

  const canonical = CANONICAL_SUBJECT_CODES_BY_BATCH[batchPrefix] ?? [];
  const known = new Set<string>(canonical);
  const extras = new Set<string>();

  for (const day of days) {
    if (day.batch !== batchPrefix) continue;
    if (day.isHoliday) continue;
    for (const slot of day.sessions) {
      for (const entry of slot.entries) {
        if (entry.subjectCode && !known.has(entry.subjectCode)) {
          extras.add(entry.subjectCode);
        }
      }
    }
  }

  return [...canonical, ...Array.from(extras).sort((a, b) => a.localeCompare(b))];
}
