import type { DaySchedule } from "@/types/timetable";
import type { SubjectLegendEntry } from "@/lib/sheet/parseSubjectNames";
import {
  resolveSubjectIdentity,
  type ResolvedSubject,
} from "@/lib/sheet/resolveSubjectIdentity";

/**
 * Returns the full list of subjects to offer in the Settings picker for
 * ONE specific batch. The list itself comes straight from the sheet 2
 * legend, filtered to whichever subjects are tagged with this batch —
 * so every subject for that year shows up immediately, even ones that
 * haven't had a class appear in the schedule yet.
 *
 * Sheet 1 (the actual schedule) is only cross-checked to find out
 * whether a given subject is genuinely split into parallel sections
 * (A/B/C) — if so, it's offered as separate section rows; otherwise
 * it's one single row.
 *
 * Returns an empty list if no batch is selected yet.
 */
export function deriveAvailableSubjectIdentities(
  days: DaySchedule[],
  batchPrefix: string | null,
  legend: Record<string, SubjectLegendEntry>,
): ResolvedSubject[] {
  if (!batchPrefix) return [];

  const baseCodesForBatch = Object.entries(legend)
    .filter(([, entry]) => entry.batch === batchPrefix)
    .map(([code]) => code);

  if (baseCodesForBatch.length === 0) return [];

  // Cross-check sheet 1 purely to find which sections (if any) each
  // subject is actually split into for this batch.
  const sectionsByBaseCode = new Map<string, Set<string>>();
  for (const day of days) {
    if (day.batch !== batchPrefix) continue;
    if (day.isHoliday) continue;
    for (const slot of day.sessions) {
      for (const entry of slot.entries) {
        if (!entry.subjectCode) continue;
        const resolved = resolveSubjectIdentity(entry.subjectCode, legend);
        if (!resolved.section) continue;
        if (!sectionsByBaseCode.has(resolved.baseCode)) {
          sectionsByBaseCode.set(resolved.baseCode, new Set());
        }
        sectionsByBaseCode.get(resolved.baseCode)!.add(resolved.section);
      }
    }
  }

  const result: ResolvedSubject[] = [];
  for (const baseCode of baseCodesForBatch) {
    const entry = legend[baseCode];
    const sections = sectionsByBaseCode.get(baseCode);
    if (sections && sections.size > 0) {
      for (const section of Array.from(sections).sort()) {
        result.push({
          code: `${baseCode}(${section})`,
          baseCode,
          section,
          name: entry.name,
          faculty: entry.faculty,
        });
      }
    } else {
      result.push({
        code: baseCode,
        baseCode,
        name: entry.name,
        faculty: entry.faculty,
      });
    }
  }

  return result.sort(
    (a, b) =>
      a.baseCode.localeCompare(b.baseCode) ||
      (a.section ?? "").localeCompare(b.section ?? ""),
  );
}
