/**
 * Central config for how we read the PGDM session-schedule sheet.
 * Keeping these here (not hardcoded in parser logic) means the
 * app can be re-pointed at a new term/batch by editing this file
 * or the equivalent env vars, without touching parsing code.
 *
 * Nothing here hardcodes a specific batch or subject list — those are
 * read live from the sheet itself:
 *   - Batches: lib/sheet/matchBatch.ts
 *   - Subjects: lib/sheet/resolveSubjectIdentity.ts (cross-references
 *     the sheet's own data to tell a genuine subject-code qualifier
 *     apart from a redundant section tag — no fixed subject list)
 *   - Session times: lib/sheet/parseSessionTimeHeaders.ts tries to read
 *     each batch's own "Session No. - PGDM YYYY-YY" header + Time row
 *     first. If that row isn't found/formatted as expected for a given
 *     batch, lib/sheet/parseSchedule.ts falls back to the year-rank-based
 *     defaults below — junior (1st year) gets FALLBACK_SESSION_TIMES_JUNIOR,
 *     everyone senior to that gets FALLBACK_SESSION_TIMES_SENIOR — so
 *     the two years never show identical/wrong times even when the
 *     sheet's header row can't be matched for some reason.
 */

export const TARGET_SECTIONS = ['A', 'B', 'C'] as const;
export type TargetSection = (typeof TARGET_SECTIONS)[number];

// Credit line shown in the header. Change this if you'd like the wording
// or name updated.
export const CREATOR_CREDIT = 'Made by Deepak Kumar · 25PGDM-BHU081';

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
 * junior) whenever its own sheet header row isn't found or doesn't
 * parse. Edit these directly if the junior timing changes.
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
 * and beyond — "2nd Year" and senior) whenever its own sheet header row
 * isn't found or doesn't parse. Edit these directly if senior timing
 * changes.
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
