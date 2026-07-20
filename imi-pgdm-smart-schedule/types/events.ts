import type { TargetSection } from './timetable';

export type EventCategory =
  'holiday' | 'exam' | 'workshop' | 'seminar' | 'guest-lecture' | 'placement' | 'notice' | 'other';

export interface ScheduleEvent {
  id: string;
  /** ISO date, e.g. "2026-06-26" */
  date: string;
  dayLabel: string;
  batch: string;
  section: TargetSection;
  category: EventCategory;
  /** Original cell text, e.g. "Holiday" */
  title: string;
}
