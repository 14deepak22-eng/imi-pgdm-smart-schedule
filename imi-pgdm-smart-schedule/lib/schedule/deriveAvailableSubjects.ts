import type { DaySchedule } from "@/types/timetable";
import type { SubjectLegendEntry } from "@/lib/sheet/parseSubjectNames";
import {
  resolveSubjectIdentity,
  type ResolvedSubject,
} from "@/lib/sheet/resolveSubjectIdentity";

/**
 * Returns the full list of subjects to offer in the Settings picker for
 * ONE specific batch, resolved against the sheet's legend tab (code →
 * name + faculty): every raw code found in the schedule is reduced to
 * its base course (dropping faculty initials, times, or other noise),
 * kept split apart only when it's genuinely offered as parallel
 * sections (A/B/C). Works the same way for any batch/year — nothing
 * here is hardcoded per batch.
 *
 * Returns an empty list if no batch is selected yet.
 */
export function deriveAvailableSubjectIdentities(
  days: DaySchedule[],
  batchPrefix: string | null,
  legend: Record<string, SubjectLegendEntry>,
): ResolvedSubject[] {
  if (!batchPrefix) return [];

  const byCode = new Map<string, ResolvedSubject>();

  for (const day of days) {
    if (day.batch !== batchPrefix) continue;
    if (day.isHoliday) continue;
    for (const slot of day.sessions) {
      for (const entry of slot.entries) {
        if (!entry.subjectCode) continue;
        const resolved = resolveSubjectIdentity(entry.subjectCode, legend);
        // Only offer subjects that are actually listed in the sheet 2
        // legend — a raw code with no match there isn't shown as a
        // picker option (it's still shown on the dashboard itself,
        // just not as something you can select/deselect).
        if (!legend[resolved.baseCode]) continue;
        if (!byCode.has(resolved.code)) byCode.set(resolved.code, resolved);
      }
    }
  }

  return Array.from(byCode.values()).sort(
    (a, b) =>
      a.baseCode.localeCompare(b.baseCode) ||
      (a.section ?? "").localeCompare(b.section ?? ""),
  );
}
