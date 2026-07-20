import { SheetFetchError } from './errors';

/**
 * Builds the Google Visualization API endpoint for a publicly-viewable sheet.
 * This works without an API key as long as the sheet is shared as
 * "Anyone with the link can view" — no "Publish to web" step required.
 */
function buildGvizUrl(sheetId: string, sheetName?: string): string {
  const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
  return sheetName ? `${base}&sheet=${encodeURIComponent(sheetName)}` : base;
}

/**
 * gviz responses are wrapped in a JS callback:
 *   google.visualization.Query.setResponse({...});
 * Strip the wrapper to get parseable JSON.
 */
function unwrapGvizResponse(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new SheetFetchError('Unexpected response format from Google Sheets');
  }
  const jsonStr = text.slice(start, end + 1);
  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    throw new SheetFetchError('Failed to parse Google Sheets response', err);
  }
}

interface GvizCell {
  v: unknown;
  f?: string;
}
interface GvizRow {
  c: (GvizCell | null)[];
}
interface GvizTable {
  rows: GvizRow[];
}
interface GvizResponse {
  status: 'ok' | 'error';
  errors?: { detailed_message?: string; message?: string }[];
  table: GvizTable;
}

function isGvizResponse(value: unknown): value is GvizResponse {
  return typeof value === 'object' && value !== null && 'table' in value && 'status' in value;
}

/**
 * Fetches every row of the sheet as a 2D array of stringified cell values.
 * Empty/missing cells become empty strings, so downstream code can safely
 * index into any column without null checks.
 */
export async function fetchSheetRows(sheetId: string, sheetName?: string): Promise<string[][]> {
  const url = buildGvizUrl(sheetId, sheetName);

  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store' });
  } catch (err) {
    throw new SheetFetchError('Network error while fetching the sheet', err);
  }

  if (!res.ok) {
    throw new SheetFetchError(`Google Sheets responded with status ${res.status}`);
  }

  const text = await res.text();
  const parsed = unwrapGvizResponse(text);

  if (!isGvizResponse(parsed)) {
    throw new SheetFetchError('Unexpected response shape from Google Sheets');
  }

  if (parsed.status === 'error') {
    const message = parsed.errors?.[0]?.detailed_message ?? parsed.errors?.[0]?.message;
    throw new SheetFetchError(
      message ?? 'Google Sheets returned an error. Is the sheet shared publicly?',
    );
  }

  return parsed.table.rows.map((row) =>
    row.c.map((cell) => {
      if (!cell) return '';
      // Prefer the formatted string (f) when present — dates/numbers read more
      // reliably that way than from the raw value (v).
      const value = cell.f ?? cell.v;
      return value === null || value === undefined ? '' : String(value);
    }),
  );
}
