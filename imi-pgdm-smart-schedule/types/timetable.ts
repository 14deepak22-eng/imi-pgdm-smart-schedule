export type SessionKey = 'I' | 'II' | 'III' | 'LUNCH' | 'IV' | 'V' | 'VI';

export type TargetSection = 'A' | 'B' | 'C';

/** A single subject offering within a session slot (slots can hold 2+ parallel offerings, separated by "/"). */
export interface ClassEntry {
  /** Original text for this offering, e.g. "MK629 (A) (CR-5)" */
  raw: string;
  /** Extracted subject code, e.g. "MK629(A)" */
  subjectCode: string;
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
