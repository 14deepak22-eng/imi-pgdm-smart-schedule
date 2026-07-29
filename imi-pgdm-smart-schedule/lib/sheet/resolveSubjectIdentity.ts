import type { SubjectLegendEntry } from "./parseSubjectNames";

export interface ResolvedSubject {
  /**
   * The code to use for selecting/grouping/counting this subject — the
   * legend's base code, plus a section letter if this offering is split
   * into parallel sections (e.g. "ST506(B)(A)"). This is what gets
   * stored when someone picks subjects in Settings.
   */
  code: string;
  /** The complete code exactly as listed in the legend (sheet 2), with no section suffix — e.g. "ST506(B)". */
  baseCode: string;
  /** Section letter (A, B, or C) if this course runs in parallel sections, otherwise undefined. */
  section?: string;
  name?: string;
  faculty?: string;
}

// A trailing bracket group is only ever treated as a "section" if it's
// exactly one letter — A, B, or C — and nothing else is left over
// after it. Anything else left over (faculty initials, a time, a typo)
// is dropped rather than treated as a new subject.
const SECTION_ONLY = /^\(([ABC])\)$/;

/**
 * Resolves a raw subject code as it appears in the schedule (sheet 1)
 * — e.g. "GM613(B)(MB)" or "ST506(B)(A)" — against the legend fetched
 * from sheet 2, which lists each course's complete code (e.g.
 * "GM613(B)", "ST506(B)") together with its full name and faculty.
 *
 * - Finds the longest legend code that's a prefix of the raw code.
 * - If everything left over after that is exactly one bracket with a
 *   single letter A, B, or C, it's kept as this offering's section —
 *   a genuinely different class the student needs to pick between.
 * - Anything else left over is dropped; it doesn't create a new subject.
 * - If nothing in the legend matches (course not listed there yet),
 *   falls back to the raw code as-is, with no name/faculty.
 */
export function resolveSubjectIdentity(
  rawCode: string,
  legend: Record<string, SubjectLegendEntry>,
): ResolvedSubject {
  const normalized = rawCode.replace(/\s+/g, "").toUpperCase();

  let baseCode: string | null = null;
  for (const key of Object.keys(legend)) {
    if (
      normalized.startsWith(key) &&
      (!baseCode || key.length > baseCode.length)
    ) {
      baseCode = key;
    }
  }

  if (!baseCode) {
    return { code: normalized, baseCode: normalized };
  }

  const remainder = normalized.slice(baseCode.length);
  const sectionMatch = remainder.match(SECTION_ONLY);
  const section = sectionMatch ? sectionMatch[1] : undefined;
  const entry = legend[baseCode];

  return {
    code: section ? `${baseCode}(${section})` : baseCode,
    baseCode,
    section,
    name: entry?.name,
    faculty: entry?.faculty,
  };
}
