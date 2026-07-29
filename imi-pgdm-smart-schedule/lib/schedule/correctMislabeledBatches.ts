import type { DaySchedule } from "@/types/timetable";
import type { SubjectLegendEntry } from "@/lib/sheet/parseSubjectNames";
import { resolveSubjectIdentity } from "@/lib/sheet/resolveSubjectIdentity";

/**
 * Fixes a specific kind of sheet typo: a whole day's "Batch and Section"
 * cell mistyped as the wrong batch (e.g. someone copy-pasted a template
 * row and forgot to update the year, so a day meant for "PGDM 2025-27"
 * ends up labeled "PGDM 2024-26"). Left uncorrected, this silently
 * files that day's classes under the wrong batch everywhere in the app.
 *
 * Detection is evidence-based, not a guess: every subject scheduled in
 * a day is looked up in the sheet 2 legend, which tags which batch it
 * actually belongs to. A day only gets corrected when:
 *   1. At least one scheduled subject is found in the legend, AND
 *   2. EVERY subject found in the legend agrees it belongs to some
 *      other single batch (a mix of agreement and disagreement is left
 *      alone — that's ambiguous, not clear evidence of a typo), AND
 *   3. That other batch is a real one that actually appears elsewhere
 *      in the sheet (never invents a batch that doesn't otherwise exist).
 *
 * Deliberately conservative — the goal is to fix obvious copy-paste
 * typos, not to override genuinely ambiguous or unfamiliar data.
 */
export function correctMislabeledBatches(
  days: DaySchedule[],
  legend: Record<string, SubjectLegendEntry>,
): DaySchedule[] {
  const knownBatches = new Set(days.map((d) => d.batch));

  return days.map((day) => {
    if (day.isHoliday) return day;

    const impliedBatches = new Set<string>();
    for (const slot of day.sessions) {
      for (const entry of slot.entries) {
        if (!entry.subjectCode) continue;
        const resolved = resolveSubjectIdentity(entry.subjectCode, legend);
        const impliedBatch = legend[resolved.baseCode]?.batch;
        if (impliedBatch) impliedBatches.add(impliedBatch);
      }
    }

    const isUnanimousMismatch =
      impliedBatches.size === 1 && !impliedBatches.has(day.batch);

    if (isUnanimousMismatch) {
      const correctBatch = [...impliedBatches][0];
      if (knownBatches.has(correctBatch)) {
        return { ...day, batch: correctBatch };
      }
    }

    return day;
  });
}
