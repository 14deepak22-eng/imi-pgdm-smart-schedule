import { NextResponse, type NextRequest } from 'next/server';
import { fetchSheetRows } from '@/lib/sheet/fetchSheet';
import { parseSchedule } from '@/lib/sheet/parseSchedule';
import { SheetFetchError } from '@/lib/sheet/errors';
import { extractSheetId } from '@/lib/utils/sheetId';

// Re-fetch from Google Sheets at most every 5 minutes; Next.js serves
// cached responses in between (per Step 4: "automatic refresh every 5 minutes").
// Only applies to the default (env-configured) sheet — custom overrides
// below always bypass this via no-store fetches.
export const revalidate = 300;

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

export async function GET(request: NextRequest) {
  const requestedId = request.nextUrl.searchParams.get('sheetId');
  const overrideId = requestedId ? extractSheetId(requestedId) : null;

  if (requestedId && !overrideId) {
    return NextResponse.json(
      { error: "That doesn't look like a valid Google Sheet link or ID." },
      { status: 400 },
    );
  }

  const sheetId = overrideId ?? process.env.NEXT_PUBLIC_SHEET_ID;
  const sheetTab = overrideId ? undefined : process.env.SHEET_TAB_NAME || undefined;

  if (!sheetId) {
    return NextResponse.json(
      { error: 'Server is missing NEXT_PUBLIC_SHEET_ID configuration' },
      { status: 500 },
    );
  }

  try {
    const rows = await fetchWithRetry(() => fetchSheetRows(sheetId, sheetTab), 2);
    const { classes, events } = parseSchedule(rows);

    return NextResponse.json(
      { classes, events, fetchedAt: new Date().toISOString() },
      {
        headers: overrideId
          ? { 'Cache-Control': 'no-store' }
          : { 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=60' },
      },
    );
  } catch (err) {
    const message =
      err instanceof SheetFetchError
        ? err.message
        : 'Failed to load timetable data. Please try again shortly.';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
