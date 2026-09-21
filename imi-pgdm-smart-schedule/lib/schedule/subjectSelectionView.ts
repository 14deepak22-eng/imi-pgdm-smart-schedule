import type { ResolvedSubject } from "@/lib/sheet/resolveSubjectIdentity";

/**
 * Helpers for the 1st-year subject picker, which has two views:
 *
 *  - "Master" view (Show all sections is OFF): one row per subject, no
 *    section split — the student's section is already chosen elsewhere,
 *    so the picker only needs to know WHICH subjects they take.
 *    Saved codes are the plain base codes, e.g. "ST506(B)".
 *
 *  - "Sections" view (Show all sections is ON): one row per subject per
 *    section, e.g. "ST506(B)(A)", "ST506(B)(B)".
 *
 * A student can flip between the two at any time, so a saved selection
 * from one view has to be translated for the other. That's what
 * `toMasterSelection` / `toSectionSelection` do.
 */

// A section suffix is exactly one bracketed letter A, B or C — same rule
// resolveSubjectIdentity uses.
const SECTION_SUFFIX = /^\([ABC]\)$/;

function isSectionedCodeOf(code: string, baseCode: string): boolean {
  return code.startsWith(baseCode) && SECTION_SUFFIX.test(code.slice(baseCode.length));
}

/** Collapses section-split rows into one row per subject (keyed by base code). */
export function toMasterSubjects(subjects: ResolvedSubject[]): ResolvedSubject[] {
  const byBase = new Map<string, ResolvedSubject>();
  for (const s of subjects) {
    if (byBase.has(s.baseCode)) continue;
    byBase.set(s.baseCode, {
      code: s.baseCode,
      baseCode: s.baseCode,
      name: s.name,
      faculty: s.faculty,
    });
  }
  return Array.from(byBase.values());
}

/**
 * Translates a saved selection into master-view codes: a subject counts
 * as picked if its base code was saved, or ANY of its section codes was.
 * Returns the input untouched when there's no saved selection.
 */
export function toMasterSelection(
  selected: string[] | null,
  masterSubjects: ResolvedSubject[],
): string[] | null {
  if (!selected || selected.length === 0) return selected;
  return masterSubjects
    .filter((row) =>
      selected.some((c) => c === row.baseCode || isSectionedCodeOf(c, row.baseCode)),
    )
    .map((row) => row.code);
}

/**
 * Translates a saved selection into sections-view codes: a saved base
 * code (made in the master view) ticks every section of that subject;
 * a saved section code ticks only its own section.
 * Returns the input untouched when there's no saved selection.
 */
export function toSectionSelection(
  selected: string[] | null,
  sectionSubjects: ResolvedSubject[],
): string[] | null {
  if (!selected || selected.length === 0) return selected;
  return sectionSubjects
    .filter((row) => selected.includes(row.code) || selected.includes(row.baseCode))
    .map((row) => row.code);
}
