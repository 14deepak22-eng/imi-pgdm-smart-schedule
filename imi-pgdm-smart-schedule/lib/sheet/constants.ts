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
 * The complete, authoritative list of subject codes offered per batch.
 * This is the single source of truth used by lib/sheet/parseCell.ts to
 * correctly identify each class, and by the Settings page subject
 * picker (every one of these is always offered as a choice, regardless
 * of what's been seen in the sheet yet, so nothing is ever missing
 * while data is still loading).
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

// Ordered session columns as laid out left-to-right in the sheet.
export const SESSION_ORDER = ['I', 'II', 'III', 'LUNCH', 'IV', 'V', 'VI'] as const;

// Rows whose Column B text starts with this are treated as a "new day" anchor.
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

/**
 * Used for the most recently started batch (rank 0 — "1st Year" /
 * junior). Edit these directly if the junior timing changes.
 */
export const FALLBACK_SESSION_TIMES_JUNIOR: Record<string, { start: string; end: string }> = {
  I: { start: '08:30', end: '10:00' },
  II: { start: '10:15', end: '11:45' },
  III: { start: '12:00', end: '13:30' },
  LUNCH: { start: '13:30', end: '14:30' },
  IV: { start: '14:30', end: '16:00' },
  V: { start: '16:15', end: '17:45' },
  VI: { start: '18:00', end: '19:30' },
};

/**
 * Used for every batch other than the most recently started one (rank 1
 * and beyond — "2nd Year" and senior). Edit these directly if senior
 * timing changes.
 */
export const FALLBACK_SESSION_TIMES_SENIOR: Record<string, { start: string; end: string }> = {
  I: { start: '09:00', end: '10:30' },
  II: { start: '10:45', end: '12:15' },
  III: { start: '12:30', end: '14:00' },
  LUNCH: { start: '13:30', end: '14:30' },
  IV: { start: '15:00', end: '16:30' },
  V: { start: '16:45', end: '18:15' },
  VI: { start: '18:30', end: '20:00' },
};
