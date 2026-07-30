// The base course code, e.g. "MK629", "ST509" — same shape used in parseCell.ts.
const BASE_CODE_PATTERN = /^[A-Z]{2,4}\d{3,4}$/;
const QUALIFIER_GROUP = /^\s*\(([^)]+)\)/;

/** A subject's full name and faculty, as read from the legend sheet. */
export interface SubjectInfo {
  name: string;
  faculty: string;
}

/**
 * Normalizes a cell like "MK629 (A)" or "ST509(B)(A)" into the same
 * "MK629(A)" / "ST509(B)(A)" shape produced by parseCell.ts, so it can be
 * used as a lookup key against the parsed schedule's subject codes.
 * Returns null if the cell doesn't look like a subject code at all.
 */
function normalizeCode(raw: string): string | null {
  const trimmed = raw.trim();
  const spaceless = trimmed.replace(/\s+/g, "");
  const baseMatch = spaceless.match(/^[A-Z]{2,4}\d{3,4}/);
  if (!baseMatch || !BASE_CODE_PATTERN.test(baseMatch[0])) return null;

  let rest = spaceless.slice(baseMatch[0].length);
  const groups: string[] = [];
  let match = rest.match(QUALIFIER_GROUP);
  while (match) {
    groups.push(match[1]);
    rest = rest.slice(match[0].length);
    match = rest.match(QUALIFIER_GROUP);
  }

  return (
    baseMatch[0].toUpperCase() +
    groups.map((g) => `(${g.toUpperCase()})`).join("")
  );
}

/**
 * Parses a "legend" style sheet tab (e.g. "Course Name & Faculty") into a
 * code → {name, faculty} lookup. Doesn't assume fixed column positions:
 * for every cell that looks like a subject code, it takes the next two
 * non-empty cells in that same row as the full name and faculty name.
 * Works whether the tab is laid out as [Code, Name, Faculty], or has
 * extra blank spacer columns in between. If only one non-empty cell
 * follows the code, faculty is left as an empty string rather than
 * dropping the name.
 */
export function parseSubjectNames(rows: string[][]): Record<string, SubjectInfo> {
  const info: Record<string, SubjectInfo> = {};

  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      const code = normalizeCode(row[i] ?? "");
      if (!code) continue;

      const following: string[] = [];
      for (let j = i + 1; j < row.length && following.length < 2; j++) {
        const candidate = (row[j] ?? "").trim();
        if (candidate) following.push(candidate);
      }
      if (following.length === 0) continue;

      // First match wins — don't let a later duplicate row overwrite
      // an already-found entry with something blank or partial.
      if (!info[code]) {
        info[code] = { name: following[0], faculty: following[1] ?? "" };
      }
    }
  }

  return info;
}
