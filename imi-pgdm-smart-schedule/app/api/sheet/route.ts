import { NextResponse, type NextRequest } from "next/server";
import { fetchSheetRows } from "@/lib/sheet/fetchSheet";
import { fetchSubjectLegend } from "@/lib/sheet/fetchSubjectNames";
import { correctMislabeledBatches } from "@/lib/schedule/correctMislabeledBatches";
import { parseSchedule } from "@/lib/sheet/parseSchedule";
import { SheetFetchError } from "@/lib/sheet/errors";
import { extractSheetId } from "@/lib/utils/sheetId";

// Re-fetch from Google Sheets at most every 5 minutes; Next.js serves
// cached responses in between (per Step 4: "automatic refresh every 5 minutes").
// Only applies to the default (env-configured) sheet — custom overrides
// below always bypass this via no-store fetches.
export const revalidate = 300;

// Fallback used ONLY if NEXT_PUBLIC_SHEET_ID isn't set at all — e.g. a
// new Vercel Preview deployment that doesn't inherit Production env
// vars. Without this, a missing env var blocks the entire app right at
// the year-selection screen (no batches to show, nothing to click).
// The env var, when set, always takes priority over this.
const FALLBACK_SHEET_ID = "1FEKe5fBUREJ_dx8lrwvW3p89u8kZw1lEo6nC7ERA15U";

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries: number,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, 500 * (attempt + 1)),
        );
      }
    }
  }
  throw lastError;
}

export async function GET(request: NextRequest) {
  const requestedId = request.nextUrl.searchParams.get("sheetId");
  const overrideId = requestedId ? extractSheetId(requestedId) : null;

  if (requestedId && !overrideId) {
    return NextResponse.json(
      { error: "That doesn't look like a valid Google Sheet link or ID." },
      { status: 400 },
    );
  }

  const sheetId = overrideId ?? process.env.NEXT_PUBLIC_SHEET_ID ?? FALLBACK_SHEET_ID;
  const sheetTab = overrideId
    ? undefined
    : process.env.SHEET_TAB_NAME || undefined;

  try {
    const rows = await fetchWithRetry(
      () => fetchSheetRows(sheetId, sheetTab),
      2,
    );
    const { classes, events } = parseSchedule(rows);

    // Best-effort: if the legend tab is missing/renamed/unreadable, this
    // resolves to {} rather than failing the whole request — the rest of
    // the app just falls back to showing subject codes alone.
    const subjectLegend = await fetchSubjectLegend(sheetId).catch(() => ({}));

    // Fix obvious copy-paste typos in a day's batch label (e.g. a day
    // meant for "PGDM 2025-27" mistyped as "PGDM 2024-26"), using the
    // sheet 2 legend as evidence. See correctMislabeledBatches for the
    // (deliberately conservative) rules this follows.
    const correctedClasses = correctMislabeledBatches(classes, subjectLegend);

    return NextResponse.json(
      {
        classes: correctedClasses,
        events,
        subjectLegend,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: overrideId
          ? { "Cache-Control": "no-store" }
          : {
              "Cache-Control":
                "public, max-age=0, s-maxage=300, stale-while-revalidate=60",
            },
      },
    );
  } catch (err) {
    const message =
      err instanceof SheetFetchError
        ? err.message
        : "Failed to load timetable data. Please try again shortly.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
