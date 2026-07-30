import type { ClassEntry } from '@/types/timetable';
import type { EventCategory } from '@/types/events';
import { EVENT_KEYWORDS, TARGET_SECTIONS, type TargetSection } from './constants';

const EVENT_CATEGORY_MAP: Record<string, EventCategory> = {
  holiday: 'holiday',
  exam: 'exam',
  workshop: 'workshop',
  seminar: 'seminar',
  'guest lecture': 'guest-lecture',
  placement: 'placement',
  notice: 'notice',
};

/**
 * Checks whether a cell's text represents an event (holiday, exam, etc.)
 * rather than a regular class. Matches by substring so variants like
 * "Holiday - Eid" or "Placement Drive - Round 2" still get detected.
 */
export function detectEventCategory(cellText: string): EventCategory | null {
  const lower = cellText.trim().toLowerCase();
  if (!lower) return null;

  for (const keyword of EVENT_KEYWORDS) {
    if (lower.includes(keyword)) {
      return EVENT_CATEGORY_MAP[keyword] ?? 'other';
    }
  }
  return null;
}

// The base course code, e.g. "MK629", "MK630", "ST509".
const BASE_CODE_PATTERN = /^[A-Z]{2,4}\d{3}/;

// A single "(...)" group immediately following the code (allowing whitespace
// before it), captured one at a time so we can walk through several in a
// row — e.g. "MK630(B)(B) (CR-3)" has three: "B", "B", "CR-3".
const NEXT_GROUP_PATTERN = /^\s*\(([^)]+)\)/;

function isRoomLike(group: string): boolean {
  return /CR|CL|Tutorial/i.test(group);
}

function isSectionLetter(group: string): boolean {
  const trimmed = group.trim();
  return trimmed.length === 1 && (TARGET_SECTIONS as readonly string[]).includes(trimmed.toUpperCase());
}

/**
 * Normalizes a subject code for comparison purposes (no whitespace, all
 * uppercase) — used both when checking a candidate against the legend
 * sheet's known codes, and when the caller (parseSchedule.ts) builds
 * that known-codes set from the legend data in the first place, so both
 * sides compare on equal footing.
 */
export function normalizeSubjectCode(code: string): string {
  return code.replace(/\s+/g, '').toUpperCase();
}

function extractCodeAndRoom(
  part: string,
  knownCodes: ReadonlySet<string>,
): { subjectCode: string; subjectSection?: TargetSection; room?: string } {
  const baseMatch = part.match(BASE_CODE_PATTERN);
  if (!baseMatch) return { subjectCode: part };

  let rest = part.slice(baseMatch[0].length);
  const allGroups: string[] = [];
  let match = rest.match(NEXT_GROUP_PATTERN);
  while (match) {
    allGroups.push(match[1].trim());
    rest = rest.slice(match[0].length);
    match = rest.match(NEXT_GROUP_PATTERN);
  }

  // Separate out room-like groups (CR-5, CL-2, Tutorial...) up front —
  // they're never part of a subject's identity or section.
  let room: string | undefined;
  const identityGroups: string[] = [];
  for (const group of allGroups) {
    if (isRoomLike(group)) {
      room = room ?? group;
    } else {
      identityGroups.push(group);
    }
  }

  // Find the longest prefix of identityGroups that, appended to the base
  // code, matches a code actually listed in the legend sheet ("Course
  // Name & Faculty" tab) — e.g. "ST506" + "(B)" = "ST506(B)" is the
  // subject's real identity there. This is what lets us tell a genuine
  // identity qualifier apart from a trailing section group added only
  // in the schedule sheet, without any hardcoded per-batch list.
  let bestLength = 0;
  for (let k = 1; k <= identityGroups.length; k++) {
    const candidate = baseMatch[0] + identityGroups.slice(0, k).map((g) => `(${g})`).join('');
    if (knownCodes.has(normalizeSubjectCode(candidate))) bestLength = k;
  }

  // Legend didn't confirm anything (not loaded yet, or a genuinely new
  // subject) — fall back to the same rule the sheet follows visually:
  // only a final standalone A/B/C group counts as a section.
  if (bestLength === 0 && identityGroups.length > 1) {
    const last = identityGroups[identityGroups.length - 1];
    if (isSectionLetter(last)) bestLength = identityGroups.length - 1;
  }

  const identityPart = identityGroups.slice(0, bestLength);
  const remainder = identityGroups.slice(bestLength);
  let subjectCode = baseMatch[0] + identityPart.map((g) => `(${g})`).join('');

  let subjectSection: TargetSection | undefined;
  for (const group of remainder) {
    if (!subjectSection && isSectionLetter(group)) {
      subjectSection = group.toUpperCase() as TargetSection;
    } else {
      // Anything left over that isn't a recognized section letter is
      // kept appended to the identity, so nothing from the sheet is
      // ever silently dropped even if it doesn't match the legend.
      subjectCode += `(${group})`;
    }
  }

  return { subjectCode, subjectSection, room };
}

/**
 * Parses a single session-slot cell into one or more class entries.
 * A slot can hold multiple parallel/alternate offerings separated by "/",
 * e.g. "MK629 (A) (CR-5)/MK630 (A) (CR-2)".
 *
 * `knownCodes` is the set of normalized subject codes found in the
 * spreadsheet's legend tab ("Course Name & Faculty") — used to tell a
 * subject's real identity apart from a trailing section group. Pass an
 * empty set if the legend hasn't loaded; parsing still works via the
 * fallback rule, just without legend confirmation.
 */
export function parseSessionCell(cellText: string, knownCodes: ReadonlySet<string>): ClassEntry[] {
  const trimmed = cellText.trim();
  if (!trimmed) return [];

  return trimmed
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const { subjectCode, subjectSection, room } = extractCodeAndRoom(part, knownCodes);
      return { raw: part, subjectCode, subjectSection, room };
    });
}

/**
 * Checks whether a cell's text resembles a course code (e.g. starts with
 * 2-4 letters followed by 3 digits, like "MK629" or "ST509") in at least
 * one of its "/"-separated parts. Used as a catch-all: any non-empty cell
 * that doesn't look like a class AND doesn't match a known event keyword
 * gets treated as a generic event instead of showing up as a garbled
 * "class" — covers things like workshops, industry visits, farewells,
 * or any other one-off text someone adds to the sheet.
 */
export function looksLikeSubjectCell(cellText: string): boolean {
  const trimmed = cellText.trim();
  if (!trimmed) return false;

  return trimmed
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .some((part) => BASE_CODE_PATTERN.test(part));
}
