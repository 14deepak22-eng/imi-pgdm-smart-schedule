// The base course code, e.g. "MK629", "ST509" — same shape used in parseCell.ts.
const BASE_CODE_PATTERN = /^[A-Z]{2,4}\d{3,4}$/;
const QUALIFIER_GROUP = /^\s*\(([^)]+)\)/;

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
 * code → full name lookup. Doesn't assume fixed column positions: for
 * every cell that looks like a subject code, it takes the next non-empty
 * cell in that same row as the full name. Works whether the tab is laid
 * out as [Code, Name], [Code, Name, Faculty], or has extra blank
 * spacer columns in between.
 */
export function parseSubjectNames(rows: string[][]): Record<string, string> {
  const names: Record<string, string> = {};

  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      const code = normalizeCode(row[i] ?? "");
      if (!code) continue;

      for (let j = i + 1; j < row.length; j++) {
        const candidate = (row[j] ?? "").trim();
        if (candidate) {
          // First match wins — don't let a later duplicate row overwrite
          // an already-found name with something blank or partial.
          if (!names[code]) names[code] = candidate;
          break;
        }
      }
    }
  }

  return names;
}
