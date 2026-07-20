import type { DaySchedule } from '@/types/timetable';
import { isSubjectSelected } from '@/hooks/useSubjectPreferences';

/**
 * Returns a copy of `days` where each session's entries are filtered to
 * only the selected subjects. Sessions with no matching entry end up
 * empty (already handled as "no class" everywhere entries are rendered).
 * `selected: null` or `[]` means no filtering — everything is kept.
 */
export function filterClassesBySubjects(
  days: DaySchedule[],
  selected: string[] | null,
): DaySchedule[] {
  if (!selected || selected.length === 0) return days;

  return days.map((day) => {
    if (day.isHoliday) return day;
    return {
      ...day,
      sessions: day.sessions.map((slot) => ({
        ...slot,
        entries: slot.entries.filter((entry) => isSubjectSelected(selected, entry.subjectCode)),
      })),
    };
  });
}
