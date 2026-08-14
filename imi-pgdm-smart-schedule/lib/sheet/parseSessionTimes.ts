import { SESSION_ORDER } from './constants';

type SessionKey = (typeof SESSION_ORDER)[number];
export type SessionTimeMap = Partial<Record<SessionKey, { start: string; end: string }>>;

/**
 * Matches a header cell like:
 *   "Session No. - PGDM 2026-2028 (Term I)→"
 *   "Session No. - PGDM 2025-27 (Term IV)→"
 * and pulls out just the batch year-range, normalized to the same short
 * form used everywhere else in the app (e.g. "PGDM 2026-28"), regardless
 * of whether the sheet writes the second year in full (2028) or short
 * (28) form.
 */
const SESSION_HEADER_PATTERN = /PGDM\s*(\d{4})\s*-\s*(\d{2,4})/i;

function normalizeBatchPrefix(rawText: string): string | null {
  const match = rawText.match(SESSION_HEADER_PATTERN);
  if (!match) return null;
  const [, startYear, endYearRaw] = match;
  const endYearShort = endYearRaw.length === 4 ? endYearRaw.slice(2) : endYearRaw;
  return `PGDM ${startYear}-${endYearShort}`;
}

/** "8.30", "8:30", "08:30:00" → "08:30". Returns null if unparseable. */
function parseTimeToken(token: string): string | null {
  const match = token.trim().match(/^(\d{1,2})[.:](\d{2})(?::\d{2})?\s*(AM|PM|am|pm)?$/);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** "8.30 - 10.00" / "13:30-14:30" → { start: "08:30", end: "10:00" }. */
function parseTimeRangeCell(text: string): { start: string; end: string } | null {
  const parts = text.split(/[-–—]/).map((s) => s.trim());
  if (parts.length !== 2) return null;
  const start = parseTimeToken(parts[0]);
  const end = parseTimeToken(parts[1]);
  if (!start || !end) return null;
  return { start, end };
}

function isLunchCell(text: string): boolean {
  return text.trim().toUpperCase().startsWith('LUNCH');
}

/**
 * Scans the whole sheet for the "Session No. - PGDM <years> (Term ...)"
 * header rows and the session-number / time-range rows immediately
 * beneath each, and returns the real start/end time for every session
 * (I, II, III, LUNCH, IV, V, VI) for every batch found — sourced live
 * from the sheet, so editing the header rows (e.g. if timing changes
 * next term) is reflected everywhere automatically without a code change.
 *
 * Each "Session No. - PGDM ..." row is immediately followed by exactly
 * one "Time" row in this sheet's layout — session-number row first,
 * time row directly below it.
 */
export function extractSessionTimesByBatch(rows: string[][]): Record<string, SessionTimeMap> {
  const result: Record<string, SessionTimeMap> = {};

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    const timeRow = rows[rowIdx + 1];
    if (!timeRow) continue;

    // Find the cell announcing which batch this session-number row belongs to.
    const headerCellIdx = row.findIndex((cell) => SESSION_HEADER_PATTERN.test(cell ?? ''));
    if (headerCellIdx === -1) continue;

    const batchPrefix = normalizeBatchPrefix(row[headerCellIdx]);
    if (!batchPrefix) continue;

    // Locate "I" — the first session column — searching to the right of
    // the label cell. Session columns are always contiguous and in
    // SESSION_ORDER after it, so once "I" is found the rest follow by
    // position alone (robust to the sheet inserting/removing columns
    // elsewhere, as long as this block itself stays contiguous).
    let sessionStartCol = -1;
    for (let col = headerCellIdx + 1; col < row.length; col++) {
      if ((row[col] ?? '').trim().toUpperCase() === 'I') {
        sessionStartCol = col;
        break;
      }
    }
    if (sessionStartCol === -1) continue;

    const times: SessionTimeMap = {};
    SESSION_ORDER.forEach((key, offset) => {
      const col = sessionStartCol + offset;
      const labelCell = (row[col] ?? '').trim();
      const timeCell = (timeRow[col] ?? '').trim();

      const labelMatches = key === 'LUNCH' ? isLunchCell(labelCell) : labelCell.toUpperCase() === key;
      if (!labelMatches) return;

      const parsed = parseTimeRangeCell(timeCell);
      if (parsed) times[key] = parsed;
    });

    if (Object.keys(times).length > 0) {
      // Later occurrences (e.g. a repeated header further down the sheet)
      // overwrite earlier ones, so the most recent timing in the sheet wins.
      result[batchPrefix] = { ...result[batchPrefix], ...times };
    }
  }

  return result;
}
