import type { DaySchedule, SessionSlot, TargetSection } from '@/types/timetable';
import type { ScheduleEvent } from '@/types/events';
import { toLocalISODate } from '@/lib/utils/date';

export interface SessionInstance {
  date: string; // ISO date
  session: SessionSlot['session'];
  start: Date;
  end: Date;
  entries: SessionSlot['entries'];
}

function toDateTime(isoDate: string, hhmm: string): Date {
  return new Date(`${isoDate}T${hhmm}:00`);
}

/**
 * Flattens a section's DaySchedule[] into a chronologically-sortable list
 * of concrete session instances (real start/end Date objects), skipping
 * holidays and empty (no-entry) slots — there's nothing to count down to
 * in an empty slot.
 */
export function flattenSessions(days: DaySchedule[], section: TargetSection): SessionInstance[] {
  return days
    .filter((day) => day.section === section && !day.isHoliday)
    .flatMap((day) =>
      day.sessions
        .filter((slot) => slot.entries.length > 0)
        .map((slot) => ({
          date: day.date,
          session: slot.session,
          start: toDateTime(day.date, slot.startTime),
          end: toDateTime(day.date, slot.endTime),
          entries: slot.entries,
        })),
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

export interface ScheduleStatus {
  /** The session happening right now, if any. */
  current: SessionInstance | null;
  /** The next upcoming session after `now` (after `current` if one is live). */
  next: SessionInstance | null;
}

/**
 * Given a chronological session list and the current time, determines
 * what's live now and what's coming up next.
 */
export function getScheduleStatus(sessions: SessionInstance[], now: Date): ScheduleStatus {
  const nowMs = now.getTime();
  const current =
    sessions.find((s) => s.start.getTime() <= nowMs && nowMs < s.end.getTime()) ?? null;
  const next = sessions.find((s) => s.start.getTime() > nowMs) ?? null;
  return { current, next };
}

/**
 * Finds the nearest upcoming event (today or later) for a section,
 * sorted by date. Events are all-day, so "upcoming" is date-based only.
 */
export function getNextEvent(
  events: ScheduleEvent[],
  section: TargetSection,
  now: Date,
): ScheduleEvent | null {
  const todayISO = toLocalISODate(now);
  return (
    events
      .filter((e) => e.section === section && e.date >= todayISO)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  );
}
