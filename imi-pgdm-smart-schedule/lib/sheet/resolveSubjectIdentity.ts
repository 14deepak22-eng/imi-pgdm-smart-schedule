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
// exactly one letter — A, B, or C. After that section group, the only
// things allowed are:
//   - more bracket groups that are clearly a TIME RANGE, e.g.
//     "(8.00-9.30)" or "(11.30-1.00)", or a ROOM, e.g. "(CR1)" — the
//     sheet often writes "ST607 (C) (8.00 - 9.30) (CR1)", and without
//     this the time group made the section go undetected, so the class
//     was wrongly treated as a joint session shown to every section;
//   - a hyphen-separated tail like "-15:15-16:45" or "-SKJ" (a time
//     range or faculty initials written after the code, e.g.
//     "MK631 (B) (CR 2) - 15:15 - 16:45").
// Any other leftover (a different bracket such as faculty initials, a
// typo) is still dropped rather than treated as a new subject.
// Note: `rawCode` is whitespace-stripped and upper-cased before matching.
const TIME_GROUP = String.raw`[\d:.\-\u2013\u2014]+(?:AM|PM)?`;
const ROOM_GROUP = String.raw`[^()]*(?:CR|CL|TUTORIAL)[^()]*`;
const SECTION_ONLY = new RegExp(
  String.raw`^\(([ABC])\)(?:\((?:${TIME_GROUP}|${ROOM_GROUP})\))*(?:[-\u2013\u2014].*)?$`,
);

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
