import type { DaySchedule, TargetSection } from '@/types/timetable';
import { subjectSelectionKey } from './subjectKey';

/** One selectable entry in the Settings subject picker. */
export interface AvailableSubject {
  /** Unique key used for selection/filtering, e.g. "ST506(B)(A)" or "MK602". */
  key: string;
  /** Subject identity exactly as it appears in the legend sheet, e.g. "ST506(B)". */
  code: string;
  /** Sub-group letter, if the schedule sheet splits this subject into parallel sections. */
  section?: TargetSection;
}

/**
 * Returns every distinct subject offering found in the parsed schedule
 * for ONE specific batch — fully data-driven from the sheet itself
 * (both the schedule tab and the legend tab feed into how each entry's
 * subjectCode/subjectSection was determined upstream). No hardcoded
 * per-batch list: whatever is actually in the sheet is what's offered
 * here, for 1st year, 2nd year, or any future batch alike.
 *
 * Returns an empty list if no batch is selected yet, or before the
 * schedule has loaded.
 */
export function deriveAvailableSubjects(
  days: DaySchedule[],
  batchPrefix: string | null,
): AvailableSubject[] {
  if (!batchPrefix) return [];

  const seen = new Map<string, AvailableSubject>();

  for (const day of days) {
    if (day.batch !== batchPrefix) continue;
    if (day.isHoliday) continue;
    for (const slot of day.sessions) {
      for (const entry of slot.entries) {
        if (!entry.subjectCode) continue;
        const key = subjectSelectionKey(entry);
        if (!seen.has(key)) {
          seen.set(key, { key, code: entry.subjectCode, section: entry.subjectSection });
        }
      }
    }
  }

  return Array.from(seen.values()).sort((a, b) => a.key.localeCompare(b.key));
}
