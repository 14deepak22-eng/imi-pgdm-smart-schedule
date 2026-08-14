import type { DaySchedule, SessionSlot, TargetSection } from '@/types/timetable';
import type { ScheduleEvent } from '@/types/events';
import {
  DAY_HEADER_MARKER,
  SESSION_ORDER,
  FALLBACK_SESSION_TIMES_JUNIOR,
  FALLBACK_SESSION_TIMES_SENIOR,
} from './constants';
import { extractSessionTimesByBatch } from './parseSessionTimes';
import { parseBatchCell } from './matchBatch';
import { parseDateLabel } from './parseDate';
import { detectEventCategory, looksLikeSubjectCell, parseSessionCell } from './parseCell';

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
 * before it rank 1 ("2nd Year"), and so on. Used purely to pick the
 * correct year-specific session timing (FALLBACK_SESSION_TIMES_JUNIOR /
 * _SENIOR in constants.ts) — has nothing to do with subject parsing,
 * which is untouched and still driven by CANONICAL_SUBJECT_CODES_BY_BATCH.
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
 * Some offline/whole-day activities (e.g. "Resume Building Session 1
 * (BI) Offline") are written into MULTIPLE session columns for the same
 * day, since the activity spans several time slots at once. Without
 * this step, each session slot containing that identical text would
 * become its own separate event — the same activity showing up 3-4+
 * times in a row on the Events page. This collapses any events that
 * share the same batch, date, section, category, and title down to a
 * single entry, keeping the first one seen.
 */
function dedupeEvents(events: ScheduleEvent[]): ScheduleEvent[] {
  const seen = new Set<string>();
  const result: ScheduleEvent[] = [];

  for (const event of events) {
    const key = `${event.batch}|${event.date}|${event.section}|${event.category}|${event.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(event);
  }

  return result;
}

/**
 * Walks the raw sheet rows and produces both the class timetable and the
 * events list, for EVERY batch found in the sheet — subject parsing is
 * exactly as before (parseSessionCell, driven by
 * CANONICAL_SUBJECT_CODES_BY_BATCH in constants.ts — completely
 * untouched). Session TIMING is now read live from the sheet's own
 * "Session No. - PGDM <years> (Term ...)" header rows (see
 * parseSessionTimes.ts) for whichever batch each row belongs to, so
 * editing those header rows (e.g. a term's timing changes) is picked up
 * everywhere automatically. The old FALLBACK_SESSION_TIMES_JUNIOR/_SENIOR
 * constants are only used as a per-key safety net if the sheet header
 * couldn't be found or parsed for a given batch.
 */
export function parseSchedule(rows: string[][]): ParsedSchedule {
  const validRows = collectValidRows(rows);
  const batchRanks = rankBatches(validRows.map((r) => r.batchPrefix));
  const sheetSessionTimes = extractSessionTimesByBatch(rows);

  const classes: DaySchedule[] = [];
  const events: ScheduleEvent[] = [];

  for (const row of validRows) {
    const { batchPrefix, section, isoDate, dateLabel, sessionCells } = row;
    // Prefer the times actually written in the sheet's own header rows for
    // this batch (auto-updates if the sheet's timing ever changes). Fall
    // back to the hardcoded junior/senior grid only for whichever session
    // keys the sheet header didn't supply for this batch — e.g. if the
    // header rows are missing entirely or a column couldn't be parsed.
    const fallbackForBatch =
      (batchRanks.get(batchPrefix) ?? 0) === 0
        ? FALLBACK_SESSION_TIMES_JUNIOR
        : FALLBACK_SESSION_TIMES_SENIOR;
    const sessionTimes: Record<string, { start: string; end: string }> = {
      ...fallbackForBatch,
      ...sheetSessionTimes[batchPrefix],
    };

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

    const sessions: SessionSlot[] = SESSION_ORDER.map((key, idx) => {
      const cellText = sessionCells[idx];
      const { start, end } = sessionTimes[key];

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
        return { session: key, startTime: start, endTime: end, entries: [] };
      }

      return {
        session: key,
        startTime: start,
        endTime: end,
        entries: parseSessionCell(cellText, batchPrefix),
      };
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

  return { classes, events: dedupeEvents(events) };
}
