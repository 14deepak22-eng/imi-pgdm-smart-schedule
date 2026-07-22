import type { DaySchedule, SessionSlot, TargetSection } from '@/types/timetable';
import type { ScheduleEvent } from '@/types/events';
import {
  DAY_HEADER_MARKER,
  SESSION_ORDER,
  FALLBACK_SESSION_TIMES_JUNIOR,
  FALLBACK_SESSION_TIMES_SENIOR,
} from './constants';
import { parseBatchCell } from './matchBatch';
import { parseDateLabel } from './parseDate';
import { detectEventCategory, looksLikeSubjectCell, splitCellParts } from './parseCell';
import { parseSessionTimeHeaders, type BatchSessionTimes } from './parseSessionTimeHeaders';
import { buildIdentityResolver, type IdentityObservation } from './resolveSubjectIdentity';

// Column layout (0-indexed): A=0 (seq no.), B=1 (Date & Day), C=2 (Batch and Section),
// D..J=3..9 (the 7 session slots, in SESSION_ORDER).
const COL_DATE = 1;
const COL_BATCH = 2;
const COL_SESSIONS_START = 3;

export interface ParsedSchedule {
  classes: DaySchedule[];
  events: ScheduleEvent[];
}

interface ValidRow {
  batchPrefix: string;
  section: TargetSection;
  isoDate: string;
  dateLabel: string;
  sessionCells: string[];
}

function parseStartYear(batchPrefix: string): number {
  const match = batchPrefix.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Ranks every batch found by how recently it started — the most
 * recently started batch is rank 0 ("1st Year" / junior), the one
 * before it rank 1 ("2nd Year"), and so on. Mirrors the ranking in
 * lib/schedule/deriveAvailableBatches.ts (duplicated locally, rather
 * than imported, to keep lib/sheet independent of lib/schedule) — used
 * here purely to pick the correct year-specific fallback timing when a
 * batch's own sheet header row can't be found.
 */
function rankBatches(batchPrefixes: Iterable<string>): Map<string, number> {
  const sorted = Array.from(new Set(batchPrefixes)).sort(
    (a, b) => parseStartYear(b) - parseStartYear(a),
  );
  return new Map(sorted.map((batchPrefix, index) => [batchPrefix, index]));
}

/**
 * Walks the raw sheet rows once, anchoring on the repeating "Date & Day"
 * marker row and the most recent non-empty date cell, and returns every
 * row that resolves to a recognizable batch+section+date — regardless of
 * which batch it is. Deliberately does NOT rely on fixed row numbers or a
 * fixed number of batch rows per day, so it stays correct even as rows
 * are inserted/removed or a day has a different set of batches.
 */
function collectValidRows(rows: string[][]): ValidRow[] {
  const valid: ValidRow[] = [];
  let currentDateLabel: string | null = null;
  let currentISODate: string | null = null;

  for (const row of rows) {
    const colB = (row[COL_DATE] ?? '').trim();
    const colC = (row[COL_BATCH] ?? '').trim();

    if (colB.startsWith(DAY_HEADER_MARKER)) continue;

    if (colB) {
      currentDateLabel = colB;
      currentISODate = parseDateLabel(colB);
    }

    if (!colC || !currentISODate || !currentDateLabel) continue;

    const parsedBatch = parseBatchCell(colC);
    if (!parsedBatch) continue;

    const sessionCells = SESSION_ORDER.map((_, idx) =>
      (row[COL_SESSIONS_START + idx] ?? '').trim(),
    );

    valid.push({
      batchPrefix: parsedBatch.batchPrefix,
      section: parsedBatch.section,
      isoDate: currentISODate,
      dateLabel: currentDateLabel,
      sessionCells,
    });
  }

  return valid;
}

/**
 * Walks the raw sheet rows and produces both the class timetable and the
 * events list, for EVERY batch found in the sheet. Nothing about which
 * batches exist, what their subjects are, or what times they run is
 * hardcoded — all of it comes from the sheet itself, in two passes:
 *
 *   1. A first pass collects every subject-code observation (which
 *      batch, which section, what the code + bracket qualifiers looked
 *      like) so lib/sheet/resolveSubjectIdentity.ts can cross-reference
 *      the WHOLE sheet and decide which bracket qualifiers are genuine
 *      parts of a subject's identity vs. redundant section tags.
 *   2. A second pass builds the actual output, using that resolver and
 *      each batch's own session-time header row (parseSessionTimeHeaders).
 */
export function parseSchedule(rows: string[][]): ParsedSchedule {
  const validRows = collectValidRows(rows);
  const sessionTimesByBatch = parseSessionTimeHeaders(rows);

  // Pass 1: collect subject-identity observations across every batch.
  const observations: IdentityObservation[] = [];
  for (const row of validRows) {
    for (const cellText of row.sessionCells) {
      if (!cellText || detectEventCategory(cellText) || !looksLikeSubjectCell(cellText)) continue;
      for (const part of splitCellParts(cellText)) {
        observations.push({
          batchPrefix: row.batchPrefix,
          section: row.section,
          baseCode: part.baseCode,
          groups: part.groups,
        });
      }
    }
  }
  const resolveIdentity = buildIdentityResolver(observations);

  const batchRanks = rankBatches(validRows.map((r) => r.batchPrefix));

  function timesFor(batchPrefix: string): BatchSessionTimes {
    const fromHeader = sessionTimesByBatch[batchPrefix];
    if (fromHeader) return fromHeader;

    const rank = batchRanks.get(batchPrefix) ?? 0;
    return rank === 0 ? FALLBACK_SESSION_TIMES_JUNIOR : FALLBACK_SESSION_TIMES_SENIOR;
  }

  // Pass 2: build the real output.
  const classes: DaySchedule[] = [];
  const events: ScheduleEvent[] = [];

  for (const row of validRows) {
    const { batchPrefix, section, isoDate, dateLabel, sessionCells } = row;
    const times = timesFor(batchPrefix);

    const isHoliday = sessionCells.some((cell) => detectEventCategory(cell) === 'holiday');
    if (isHoliday) {
      events.push({
        id: `${batchPrefix}-${isoDate}-${section}-holiday`,
        date: isoDate,
        dayLabel: dateLabel,
        batch: batchPrefix,
        section,
        category: 'holiday',
        title: 'Holiday',
      });
      classes.push({
        date: isoDate,
        dayLabel: dateLabel,
        batch: batchPrefix,
        section,
        isHoliday: true,
        holidayLabel: 'Holiday',
        sessions: [],
      });
      continue;
    }

    const fallbackTimes =
      (batchRanks.get(batchPrefix) ?? 0) === 0
        ? FALLBACK_SESSION_TIMES_JUNIOR
        : FALLBACK_SESSION_TIMES_SENIOR;

    const sessions: SessionSlot[] = SESSION_ORDER.map((key, idx) => {
      const cellText = sessionCells[idx];
      // times[key] covers the normal case; the fallback here only kicks
      // in if a header row exists but is missing this one specific slot
      // (e.g. a blank/unparseable cell for just one session).
      const slotTimes = times[key] ?? fallbackTimes[key];

      const keywordCategory = detectEventCategory(cellText);
      const isCatchAllEvent =
        !keywordCategory && cellText.trim() && !looksLikeSubjectCell(cellText);
      const category = keywordCategory ?? (isCatchAllEvent ? 'other' : null);

      if (category) {
        events.push({
          id: `${batchPrefix}-${isoDate}-${section}-${key}`,
          date: isoDate,
          dayLabel: dateLabel,
          batch: batchPrefix,
          section,
          category,
          title: cellText,
        });
        return { session: key, startTime: slotTimes.start, endTime: slotTimes.end, entries: [] };
      }

      const entries = splitCellParts(cellText).map((part) => ({
        raw: part.raw,
        subjectCode: resolveIdentity(batchPrefix, part.baseCode, part.groups),
        room: part.room,
      }));

      return { session: key, startTime: slotTimes.start, endTime: slotTimes.end, entries };
    });

    classes.push({
      date: isoDate,
      dayLabel: dateLabel,
      batch: batchPrefix,
      section,
      isHoliday: false,
      sessions,
    });
  }

  return { classes, events };
}
