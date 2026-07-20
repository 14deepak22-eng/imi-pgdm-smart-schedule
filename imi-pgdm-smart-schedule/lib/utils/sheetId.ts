/**
 * Accepts either a raw Sheet ID or a full Google Sheets URL and returns
 * the Sheet ID, or null if nothing recognizable was found.
 *
 * Handles URLs like:
 *   https://docs.google.com/spreadsheets/d/1FEKe5.../edit?usp=sharing
 *   https://docs.google.com/spreadsheets/d/1FEKe5.../
 * and raw IDs like:
 *   1FEKe5fBUREJ_dx8lrwvW3p89u8kZw1lEo6nC7ERA15U
 */
export function extractSheetId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) return urlMatch[1];

  // A bare ID: Sheet IDs are long alphanumeric strings (with - and _), no slashes/spaces.
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed;

  return null;
}
