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

// A single "(...)" group immediately following the code.
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

const normalizedCanonicalByBatch = new Map<string, NormalizedCode[]>();

function getNormalizedCanonical(batchPrefix: string): NormalizedCode[] {
  const cached = normalizedCanonicalByBatch.get(batchPrefix);
  if (cached) return cached;

  const codes = CANONICAL_SUBJECT_CODES_BY_BATCH[batchPrefix] ?? [];

  const list = codes
    .map((code) => ({
      original: code,
      normalized: normalize(code),
    }))
    .sort((a, b) => b.normalized.length - a.normalized.length);

  normalizedCanonicalByBatch.set(batchPrefix, list);

  return list;
}
