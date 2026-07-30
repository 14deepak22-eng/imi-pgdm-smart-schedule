import type { SubjectInfo } from "./parseSubjectNames";

export type { SubjectInfo };

// Matches just the base course code, e.g. "MK630" out of "MK630(A)" or
// "ST509" out of "ST509(B)(A)" — same pattern used in parseCell.ts.
const BASE_CODE_PATTERN = /^[A-Z]{2,4}\d{3,4}/;

const EMPTY_INFO: SubjectInfo = { name: "", faculty: "" };

/**
 * Looks up a subject's full name + faculty, first by its exact code
 * (e.g. "MK630(A)"), then falling back to just the base code with any
 * "(...)" qualifiers stripped (e.g. "MK630"). This covers legend
 * sheets that list one entry per course without separate rows for
 * each section/offering variant. Returns {name: '', faculty: ''} if
 * neither matches.
 */
export function resolveSubjectInfo(
  subjectNames: Record<string, SubjectInfo>,
  code: string,
): SubjectInfo {
  if (subjectNames[code]) return subjectNames[code];

  const base = code.match(BASE_CODE_PATTERN)?.[0];
  if (base && subjectNames[base]) return subjectNames[base];

  return EMPTY_INFO;
}

/** Convenience wrapper for callers that only need the subject's full name. */
export function resolveSubjectName(
  subjectNames: Record<string, SubjectInfo>,
  code: string,
): string {
  return resolveSubjectInfo(subjectNames, code).name;
}
