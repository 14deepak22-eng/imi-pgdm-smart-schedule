export type SessionKey = 'I' | 'II' | 'III' | 'LUNCH' | 'IV' | 'V' | 'VI';

export type TargetSection = 'A' | 'B' | 'C';

/** A single subject offering within a session slot (slots can hold 2+ parallel offerings, separated by "/"). */
export interface ClassEntry {
  /** Original text for this offering, e.g. "MK629 (A) (CR-5)" */
  raw: string;
  /**
   * Canonical subject code used for matching against Settings selections,
   * grouping, counting, and search — e.g. "MK629(A)". Collapses away any
   * extra qualifiers (like a time) that aren't part of the subject's
   * identity, so it always matches what was picked in Settings.
   */
  subjectCode: string;
  /**
   * Full code exactly as written in the sheet — the base code plus every
   * non-room bracket qualifier (e.g. "MK630(B)(10:00)") — with only the
   * room stripped out. This is what's shown on the dashboard.
   */
  displayCode: string;
  /** Extracted room/venue, e.g. "CR-5", if found */
  room?: string;
}

export interface SessionSlot {
  session: SessionKey;
  startTime: string; // "HH:mm", 24h
  endTime: string;
  entries: ClassEntry[];
}

export interface DaySchedule {
  /** ISO date, e.g. "2026-06-22" */
  date: string;
  /** Original label from the sheet, e.g. "Monday, June 22, 2026" */
  dayLabel: string;
  /** Batch prefix, e.g. "PGDM 2025-27" */
  batch: string;
  section: TargetSection;
  isHoliday: boolean;
  holidayLabel?: string;
  /** Empty when isHoliday is true */
  sessions: SessionSlot[];
}
