import type { ClassEntry } from '@/types/timetable';
import type { EventCategory } from '@/types/events';
import { EVENT_KEYWORDS } from './constants';

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

// A qualifier like "10:00" or "2:30 PM" — a scheduling note that
// sometimes gets typed alongside the code in a cell, not a genuine part
// of the subject's identity (unlike a section letter or faculty note).
// Dropped entirely so it can never make the same subject look like a
// different one to the selection/filtering logic.
function isTimeLike(group: string): boolean {
  return /^\d{1,2}:\d{2}\s*(AM|PM)?$/i.test(group.trim());
}

/**
 * Splits a cell's text into the room (if any "(...)" group looks like
 * CR-x / CL-x / Tutorial) and the rest of the subject label — keeps
 * every other bracketed qualifier exactly as written (a section letter,
 * a faculty note like "(Prof. SM)", anything), EXCEPT a time-looking
 * note like "(10:00)", which is dropped outright — it's a scheduling
 * detail, not part of what makes this subject this subject, and
 * keeping it would make the same class look like a different subject
 * depending on which cell happened to include a time.
 */
function extractCodeAndRoom(part: string): { subjectCode: string; room?: string } {
  const baseMatch = part.match(BASE_CODE_PATTERN);
  if (!baseMatch) return { subjectCode: part };

  const identityGroups: string[] = [];
  let room: string | undefined;
  let rest = part.slice(baseMatch[0].length);

  let match = rest.match(NEXT_GROUP_PATTERN);
  while (match) {
    const value = match[1].trim();
    if (isRoomLike(value)) {
      room = room ?? value;
    } else if (!isTimeLike(value)) {
      identityGroups.push(value);
    }
    rest = rest.slice(match[0].length);
    match = rest.match(NEXT_GROUP_PATTERN);
  }

  const subjectCode = baseMatch[0] + identityGroups.map((g) => `(${g})`).join('');
  return { subjectCode, room };
}

/**
 * Parses a single session-slot cell into one or more class entries.
 * A slot can hold multiple parallel/alternate offerings separated by "/",
 * e.g. "MK629 (A) (CR-5)/MK630 (A) (CR-2)".
 */
export function parseSessionCell(cellText: string, batchPrefix: string): ClassEntry[] {
  const trimmed = cellText.trim();
  if (!trimmed) return [];

  return trimmed
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const { subjectCode, room } = extractCodeAndRoom(part);
      return { raw: part, subjectCode, room };
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
