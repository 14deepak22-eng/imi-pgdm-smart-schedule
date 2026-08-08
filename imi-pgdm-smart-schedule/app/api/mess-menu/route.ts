import { NextResponse } from 'next/server';
import { fetchSheetRows } from '@/lib/sheet/fetchSheet';
import { SheetFetchError } from '@/lib/sheet/errors';
import { parseMessMenu } from '@/lib/messMenu/parseMessMenu';

// The mess menu repeats on a fixed weekly cycle, so it doesn't need the
// 5-minute freshness the class schedule does — 30 minutes keeps it
// current while cutting down on repeat fetches.
export const revalidate = 1800;

// Default mess menu sheet (IMI Bhubaneswar hostel mess), used unless
// NEXT_PUBLIC_MESS_SHEET_ID overrides it.
const FALLBACK_MESS_SHEET_ID = '1tGTvltuD9QEaUxhaCZGEiwWL943xWECrYKASpZtcUdk';

async function fetchWithRetry<T>(fn: () => Promise<T>, retries: number): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export async function GET() {
  const sheetId = process.env.NEXT_PUBLIC_MESS_SHEET_ID ?? FALLBACK_MESS_SHEET_ID;

  try {
    const rows = await fetchWithRetry(() => fetchSheetRows(sheetId), 2);
    const week = parseMessMenu(rows);

    return NextResponse.json(
      { week, fetchedAt: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=1800, stale-while-revalidate=120',
        },
      },
    );
  } catch (err) {
    const message =
      err instanceof SheetFetchError ? err.message : 'Failed to load the mess menu. Please try again shortly.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
