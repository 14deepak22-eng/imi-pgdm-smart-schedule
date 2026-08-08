import type { DayMessMenu } from '@/types/messMenu';

/** Canonical Monday-first week order, used both to recognize day rows and to sort the result. */
const DAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

/** Splits a comma-separated menu cell (e.g. "Poha, Banana, Tea") into trimmed items. */
function splitItems(cell: string | undefined): string[] {
  if (!cell) return [];
  return cell
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Parses raw gviz sheet rows into a Monday–Sunday weekly mess menu.
 *
 * Deliberately keys off content (a first cell matching a day name) rather
 * than fixed row numbers, so it tolerates a title row, a blank spacer row,
 * or reordered rows in the source sheet — mirroring the same
 * content-over-position approach used for the class-schedule sheet.
 *
 * Expected columns, in order: Day | Breakfast | Lunch | Snacks | Dinner.
 */
export function parseMessMenu(rows: string[][]): DayMessMenu[] {
  const byDay = new Map<string, DayMessMenu>();

  for (const row of rows) {
    const dayCell = (row[0] ?? '').trim();
    const canonicalDay = DAY_ORDER.find(
      (day) => day.toLowerCase() === dayCell.toLowerCase(),
    );
    if (!canonicalDay) continue;

    byDay.set(canonicalDay, {
      day: canonicalDay,
      breakfast: splitItems(row[1]),
      lunch: splitItems(row[2]),
      snacks: splitItems(row[3]),
      dinner: splitItems(row[4]),
    });
  }

  return DAY_ORDER.filter((day) => byDay.has(day)).map((day) => byDay.get(day)!);
}
