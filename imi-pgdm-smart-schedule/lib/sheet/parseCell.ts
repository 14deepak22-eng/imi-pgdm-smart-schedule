import type { ClassEntry } from '@/types/timetable';
import type { EventCategory } from '@/types/events';
import { EVENT_KEYWORDS, CANONICAL_SUBJECT_CODES_BY_BATCH } from './constants';

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

function normalize(text: string): string {
  return text.replace(/\s+/g, '').toUpperCase();
}

interface NormalizedCode {
  original: string;
  normalized: string;
}

// Cache of precomputed, longest-first normalized code lists, one per
// batch — so prefix matching always prefers the most specific known
// subject code (e.g. "ST509(B)(A)" over a shorter partial), without
// recomputing this on every single cell.
const normalizedCanonicalByBatch = new Map<string, NormalizedCode[]>();

function getNormalizedCanonical(batchPrefix: string): NormalizedCode[] {
  const cached = normalizedCanonicalByBatch.get(batchPrefix);
  if (cached) return cached;

  const codes = CANONICAL_SUBJECT_CODES_BY_BATCH[batchPrefix] ?? [];
  const list = codes
    .map((code) => ({ original: code, normalized: normalize(code) }))
    .sort((a, b) => b.normalized.length - a.normalized.length);

  normalizedCanonicalByBatch.set(batchPrefix, list);
  return list;
}

/**
 * Matches a cell's course code + bracketed qualifiers against that
 * batch's authoritative subject list (CANONICAL_SUBJECT_CODES_BY_BATCH),
 * returning the longest canonical code that is a prefix of it.
 *
 * This is how we correctly resolve subjects like "MK629(A)" vs "MK629(B)"
 * as two distinct offerings, and "MK630(B)(B)" (the real code "MK630(B)"
 * with an extra trailing qualifier) — by matching against the known list
 * for THIS batch instead of guessing from context. If nothing in that
 * batch's list matches (including batches with no list configured at
 * all), the raw identity text is kept as-is, so no subject is ever
 * silently dropped.
 */
function matchCanonicalCode(identityCandidate: string, batchPrefix: string): string | null {
  const normalizedCandidate = normalize(identityCandidate);
  for (const { original, normalized } of getNormalizedCanonical(batchPrefix)) {
    if (normalizedCandidate.startsWith(normalized)) return original;
  }
  return null;
}

function extractCodeAndRoom(
  part: string,
  batchPrefix: string,
): { subjectCode: string; room?: string } {
  const baseMatch = part.match(BASE_CODE_PATTERN);
  if (!baseMatch) return { subjectCode: part };

  const identityGroups: string[] = [];
  let room: string | undefined;
  let rest = part.slice(baseMatch[0].length);

  // Walk through every "(...)" group right after the code, classifying
  // each as either the room or a qualifier that's part of the subject's identity.
  let match = rest.match(NEXT_GROUP_PATTERN);
  while (match) {
    const value = match[1].trim();
    if (isRoomLike(value)) {
      room = room ?? value;
    } else {
      identityGroups.push(value);
    }
    rest = rest.slice(match[0].length);
    match = rest.match(NEXT_GROUP_PATTERN);
  }

  const identityCandidate = baseMatch[0] + identityGroups.map((g) => `(${g})`).join('');
  const subjectCode = matchCanonicalCode(identityCandidate, batchPrefix) ?? identityCandidate;

  return { subjectCode, room };
}

/**
 * Parses a single session-slot cell into one or more class entries.
 * A slot can hold multiple parallel/alternate offerings separated by "/",
 * e.g. "MK629 (A) (CR-5)/MK630 (A) (CR-2)".
 *
 * `batchPrefix` (e.g. "PGDM 2025-27") selects which batch's canonical
 * subject list to match against, since the same-looking bracketed code
 * can mean different things in different batches.
 */
export function parseSessionCell(cellText: string, batchPrefix: string): ClassEntry[] {
  const trimmed = cellText.trim();
  if (!trimmed) return [];

  return trimmed
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const { subjectCode, room } = extractCodeAndRoom(part, batchPrefix);
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
