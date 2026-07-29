export interface SubjectLegendEntry {
  name: string;
  faculty?: string;
}

// The base course code, e.g. "MK629", "ST506" — same shape used in parseCell.ts.
const BASE_CODE_PATTERN = /^[A-Z]{2,4}\d{3,4}$/;
const QUALIFIER_GROUP = /^\s*\(([^)]+)\)/;

/**
 * Normalizes a cell like "ST506 (B)" or "GM613(B)" into a consistent
 * "ST506(B)" / "GM613(B)" shape — this becomes the legend's lookup key,
 * exactly as authored in the sheet, whatever bracket groups it has.
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
 * Parses the "Course Name & Faculty" legend tab into a code → {name,
 * faculty} lookup. Doesn't assume fixed column positions: for every
 * cell that looks like a subject code, it takes the next non-empty
 * cell in that row as the full name, and the one after that (if any)
 * as the faculty name.
 */
export function parseSubjectLegend(
  rows: string[][],
): Record<string, SubjectLegendEntry> {
  const legend: Record<string, SubjectLegendEntry> = {};

  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      const code = normalizeCode(row[i] ?? "");
      if (!code || legend[code]) continue; // first match wins

      const rest = row
        .slice(i + 1)
        .map((c) => (c ?? "").trim())
        .filter(Boolean);
      const [name, faculty] = rest;
      if (name) legend[code] = { name, faculty: faculty || undefined };
    }
  }

  return legend;
}
