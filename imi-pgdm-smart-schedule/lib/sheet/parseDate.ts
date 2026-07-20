import { parse, isValid, format } from 'date-fns';

const SOURCE_FORMAT = 'EEEE, MMMM d, yyyy';

/**
 * Converts a sheet date label like "Monday, June 22, 2026" into an ISO
 * date string "2026-06-22". Returns null if the label doesn't parse —
 * callers should skip rows with an unparseable date rather than guess.
 */
export function parseDateLabel(label: string): string | null {
  const cleaned = label.trim();
  if (!cleaned) return null;

  const parsed = parse(cleaned, SOURCE_FORMAT, new Date());
  if (!isValid(parsed)) return null;

  return format(parsed, 'yyyy-MM-dd');
}
