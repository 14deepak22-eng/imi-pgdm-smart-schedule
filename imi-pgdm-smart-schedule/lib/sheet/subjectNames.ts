// Matches just the base course code, e.g. "MK630" out of "MK630(A)" or
// "ST509" out of "ST509(B)(A)" — same pattern used in parseCell.ts.
const BASE_CODE_PATTERN = /^[A-Z]{2,4}\d{3,4}/;

/**
 * Looks up a subject's full name, first by its exact code (e.g.
 * "MK630(A)"), then falling back to just the base code with any
 * "(...)" qualifiers stripped (e.g. "MK630"). This covers legend
 * sheets that list one name per course without separate rows for
 * each section/offering variant. Returns '' if neither matches.
 */
export function resolveSubjectName(
  subjectNames: Record<string, string>,
  code: string,
): string {
  if (subjectNames[code]) return subjectNames[code];

  const base = code.match(BASE_CODE_PATTERN)?.[0];
  if (base && subjectNames[base]) return subjectNames[base];

  return '';
}
