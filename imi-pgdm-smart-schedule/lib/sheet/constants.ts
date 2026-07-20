/**
 * Central config for how we read the PGDM session-schedule sheet.
 * Keeping these here (not hardcoded in parser logic) means the
 * app can be re-pointed at a new term/batch by editing this file
 * or the equivalent env vars, without touching parsing code.
 */

export const TARGET_SECTIONS = ['A', 'B', 'C'] as const;
export type TargetSection = (typeof TARGET_SECTIONS)[number];

// Credit line shown in the header. Change this if you'd like the wording
// or name updated.
export const CREATOR_CREDIT = 'Made by Deepak Kumar · 25PGDM-BHU081';

/**
 * The app supports multiple concurrently-active batches (e.g. an
 * outgoing 2nd-year batch and an incoming 1st-year batch), auto-detected
 * from whatever "PGDM YYYY-YY" batch prefixes actually appear in the
 * sheet — see lib/sheet/matchBatch.ts and lib/schedule/deriveAvailableBatches.ts.
 *
 * This map holds each batch's authoritative subject-code list, used by
 * lib/sheet/parseCell.ts to correctly identify each class (e.g.
 * distinguishing "MK629(A)" and "MK629(B)" as two different offerings,
 * rather than guessing which bracket is a section marker) and by the
 * Settings page subject picker (every code here is always offered as a
 * choice, regardless of what's been seen in the sheet yet).
 *
 * A batch with no entry here still works — subjects are then derived
 * dynamically from whatever's parsed from the sheet (see
 * deriveAvailableSubjects.ts) — it just won't get the same disambiguation
 * quality for codes with tricky embedded brackets until you add its list
 * here the same way "PGDM 2025-27" was added.
 */
export const CANONICAL_SUBJECT_CODES_BY_BATCH: Record<string, readonly string[]> = {
  'PGDM 2025-27': [
    'MK629(A)',
    'MK629(B)',
    'MK630(A)',
    'MK630(B)',
    'MK602',
    'MK618',
    'FN642',
    'MK608',
    'IS621',
    'OM606',
    'FN643',
    'OM625',
    'HR604',
    'IS618',
    'FN604',
    'MK615',
    'OB618',
    'ST509(B)(A)',
    'ST509(B)(B)',
    'ST509(B)(C)',
  ],
};

// Session number -> time range. Currently shared across all batches; if a
// different batch uses a different time grid, tell Claude and this can be
// made per-batch the same way CANONICAL_SUBJECT_CODES_BY_BATCH is.
export const SESSION_TIMES: Record<string, { start: string; end: string }> = {
  I: { start: '09:00', end: '10:30' },
  II: { start: '10:45', end: '12:15' },
  III: { start: '12:30', end: '14:00' },
  LUNCH: { start: '13:30', end: '14:30' },
  IV: { start: '15:00', end: '16:30' },
  V: { start: '16:45', end: '18:15' },
  VI: { start: '18:30', end: '20:00' },
};

// Ordered session columns as laid out left-to-right in the sheet.
export const SESSION_ORDER = ['I', 'II', 'III', 'LUNCH', 'IV', 'V', 'VI'] as const;

// Rows whose Column C text starts with this are treated as a "new day" anchor.
export const DAY_HEADER_MARKER = 'Date & Day';

// A row's session cell is treated as a full-day event/holiday if it matches this.
export const EVENT_KEYWORDS = [
  'holiday',
  'exam',
  'workshop',
  'seminar',
  'guest lecture',
  'placement',
  'notice',
];

// Regex a cell's leading text should match to be considered a "subject" entry
// (subject code = 2-4 letters followed by 3 digits, e.g. MK608, ST509).
export const SUBJECT_CODE_PATTERN = /^[A-Z]{2,4}\d{3}/;
