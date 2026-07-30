export interface SubjectLegendEntry {
  name: string;
  faculty?: string;
  /**
   * Which batch this subject belongs to (e.g. "PGDM 2025-27"), read
   * from the year label that appears once per block in the sheet
   * (often as a merged cell) and carried forward to every row in
   * that block. Undefined if no such label was ever found above it.
   */
  batch?: string;
}

// The base course code, e.g. "MK629", "ST506" — same shape used in parseCell.ts.
const BASE_CODE_PATTERN = /^[A-Z]{2,4}\d{3,4}$/;
const QUALIFIER_GROUP = /^\s*\(([^)]+)\)/;

// Matches a year label like "PGDM 2025-2027" or "PGDM 2025-27" and
// normalizes it to the app's internal "PGDM 2025-27" (2-digit end year) shape.
const BATCH_LABEL_PATTERN = /PGDM\s*(\d{4})\s*-\s*(\d{2,4})/i;

function extractBatchLabel(cell: string): string | null {
  const match = cell.match(BATCH_LABEL_PATTERN);
  if (!match) return null;
  const startYear = match[1];
  const endYear = match[2].slice(-2);
  return `PGDM ${startYear}-${endYear}`;
}

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
 * faculty, batch} lookup. Doesn't assume fixed column positions: for
 * every cell that looks like a subject code, it takes the next
 * non-empty cell in that row as the full name, and the one after that
 * (if any) as the faculty name.
 *
 * The sheet is organized in blocks per term/batch, with the year label
 * (e.g. "Fourth / PGDM 2025-2027") written once — often as a merged
 * cell — spanning every row in that block. Since a merged cell only
 * reports its value on the first row it covers, this walks rows
 * top-to-bottom and carries the most recently seen label forward until
 * a new one appears, so every subject in a block gets tagged with the
 * right batch even though most of its rows have a blank label cell.
 */
export function parseSubjectLegend(
  rows: string[][],
): Record<string, SubjectLegendEntry> {
  const legend: Record<string, SubjectLegendEntry> = {};
  let currentBatch: string | null = null;

  for (const row of rows) {
    for (const cell of row) {
      const label = extractBatchLabel(cell ?? "");
      if (label) {
        currentBatch = label;
        break;
      }
    }

    for (let i = 0; i < row.length; i++) {
      const code = normalizeCode(row[i] ?? "");
      if (!code || legend[code]) continue; // first match wins

      const name = (row[i + 1] ?? "").trim();
      const faculty = (row[i + 2] ?? "").trim();
      if (name) {
        legend[code] = {
          name,
          faculty: faculty || undefined,
          batch: currentBatch ?? undefined,
        };
      }
    }
  }

  return legend;
}
