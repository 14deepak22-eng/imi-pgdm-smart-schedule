import type { DaySchedule, TargetSection } from "@/types/timetable";
import type { SubjectLegendEntry } from "@/lib/sheet/parseSubjectNames";
import { resolveSubjectIdentity } from "@/lib/sheet/resolveSubjectIdentity";
import { toLocalISODate } from "@/lib/utils/date";

/**
 * Counts, for each subject code, how many class sessions have already
 * happened as of `now` — for one specific batch + section. A session
 * counts as "completed" if its date is strictly before today, or if
 * it's today and the session's end time has already passed.
 *
 * Each raw entry is resolved against the legend first, so e.g. two
 * faculty-initial variants of the same course (dropped by the
 * resolver) still add up under one combined count.
 *
 * Purely derived from the parsed schedule already in memory — no
 * separate attendance tracking, no extra sheet columns needed. If a
 * subject is cancelled/rescheduled in the sheet, the count updates
 * automatically on the next refresh.
 */
export function deriveSubjectCompletionCounts(
  classes: DaySchedule[],
  batchPrefix: string | null,
  section: TargetSection,
  now: Date,
  legend: Record<string, SubjectLegendEntry>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!batchPrefix) return counts;

  const todayISO = toLocalISODate(now);

  for (const day of classes) {
    if (day.batch !== batchPrefix) continue;
    if (day.section !== section) continue;
    if (day.isHoliday) continue;
    if (day.date > todayISO) continue;

    for (const slot of day.sessions) {
      if (slot.entries.length === 0) continue;

      if (day.date === todayISO) {
        const end = new Date(`${day.date}T${slot.endTime}:00`);
        if (end > now) continue; // today, but hasn't happened yet
      }

      for (const entry of slot.entries) {
        const code = resolveSubjectIdentity(entry.subjectCode, legend).code;
        counts[code] = (counts[code] ?? 0) + 1;
      }
    }
  }

  return counts;
}
