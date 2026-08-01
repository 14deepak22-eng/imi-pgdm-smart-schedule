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
 * Checks whether a cell's text represents an event.
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

// Base course code, e.g. MK629, ST509
const BASE_CODE_PATTERN = /^[A-Z]{2,4}\d{3}/;

// One "(...)" group immediately after the code.
const NEXT_GROUP_PATTERN = /^\s*\(([^)]+)\)/;

function isRoomLike(group: string): boolean {
  return /CR|CL|Tutorial/i.test(group);
}

// ADD THIS NEW FUNCTION
function isTimeLike(group: string): boolean {
  return /^([01]?\d|2[0-3]):[0-5]\d(\s?(AM|PM))?$/i.test(group);
}

function normalize(text: string): string {
  return text.replace(/\s+/g, '').toUpperCase();
}

interface NormalizedCode {
  original: string;
  normalized: string;
}

const normalizedCanonicalByBatch = new Map<string, NormalizedCode[]>();

function getNormalizedCanonical(batchPrefix: string): NormalizedCode[] {
  const cached = normalizedCanonicalByBatch.get(batchPrefix);
  if (cached) return cached;

  const list = (CANONICAL_SUBJECT_CODES_BY_BATCH[batchPrefix] ?? [])
    .map(code => ({
      original: code,
      normalized: normalize(code),
    }))
    .sort((a, b) => b.normalized.length - a.normalized.length);

  normalizedCanonicalByBatch.set(batchPrefix, list);

  return list;
}

function matchCanonicalCode(
  identityCandidate: string,
  batchPrefix: string,
): string | null {
  const normalizedCandidate = normalize(identityCandidate);

  for (const { original, normalized } of getNormalizedCanonical(batchPrefix)) {
    if (normalizedCandidate.startsWith(normalized)) {
      return original;
    }
  }

  return null;
}

function extractCodeAndRoom(
  part: string,
  batchPrefix: string,
): {
  subjectCode: string;
  room?: string;
  time?: string;
} {
  const baseMatch = part.match(BASE_CODE_PATTERN);

  if (!baseMatch) {
    return { subjectCode: part.trim() };
  }

  const identityGroups: string[] = [];
 let room: string | undefined;
let time: string | undefined;

  let rest = part.slice(baseMatch[0].length);

  let match = rest.match(NEXT_GROUP_PATTERN);

  while (match) {
    const value = match[1].trim();

if (isRoomLike(value)) {
  room = room ?? value;
} else if (isTimeLike(value)) {
  time = value;
} else {
  identityGroups.push(value);
}

    rest = rest.slice(match[0].length);
    match = rest.match(NEXT_GROUP_PATTERN);
  }

  const identityCandidate =
    baseMatch[0] + identityGroups.map(g => `(${g})`).join('');

  const subjectCode =
    matchCanonicalCode(identityCandidate, batchPrefix) ??
    identityCandidate;

return {
  subjectCode,
  room,
  time,
};
}

/**
 * Split only when "/" starts another subject code.
 *
 * Examples:
 * MK629(A)(CR-5)/MK630(B)(CR-2)
 *   -> 2 entries
 *
 * MK629(A)(CR-5/CR-6)
 *   -> 1 entry
 *
 * MK629(A)(CR-5)/(CR-6)
 *   -> 1 entry
 */
function splitSessionParts(text: string): string[] {
  return text
    .split(/\/(?=\s*[A-Z]{2,4}\d{3})/)
    .map(part => part.trim())
    .filter(Boolean);
}

/**
 * Parse a timetable cell into class entries.
 */
export function parseSessionCell(
  cellText: string,
  batchPrefix: string,
): ClassEntry[] {
  const trimmed = cellText.trim();

  if (!trimmed) {
    return [];
  }

  return splitSessionParts(trimmed).map(part => {
const { subjectCode, room, time } = extractCodeAndRoom(
  part,
  batchPrefix,
);

return {
  raw: part,
  subjectCode,
  room,
  time,
};
  });
}

/**
 * Checks whether a cell looks like it contains subject codes.
 */
export function looksLikeSubjectCell(cellText: string): boolean {
  const trimmed = cellText.trim();

  if (!trimmed) {
    return false;
  }

  return splitSessionParts(trimmed).some(part =>
    BASE_CODE_PATTERN.test(part),
  );
}
