import type { DaySchedule, SessionSlot } from '@/types/timetable';
import type { ScheduleEvent } from '@/types/events';

/**
 * Collapses all sections' rows for each date into a single merged row,
 * unioning each session slot's entries (deduped by subject code) so
 * nothing from any section is missed. Used when "Show all sections" is
 * enabled in Settings.
 *
 * The merged row's `section` field is set to 'A' as a nominal placeholder
 * — since everything is combined, downstream components (which key off
 * a single section value) just need a consistent one to match against.
 */
export function mergeAllDaySections(days: DaySchedule[]): DaySchedule[] {
  const byDate = new Map<string, DaySchedule[]>();
  for (const day of days) {
    const list = byDate.get(day.date) ?? [];
    list.push(day);
    byDate.set(day.date, list);
  }

  const merged: DaySchedule[] = [];

  for (const [date, group] of byDate) {
    const holidayDay = group.find((d) => d.isHoliday);
    if (holidayDay) {
      merged.push({
        date,
        dayLabel: group[0].dayLabel,
        batch: group[0].batch,
        section: 'A',
        isHoliday: true,
        holidayLabel: holidayDay.holidayLabel ?? 'Holiday',
        sessions: [],
      });
      continue;
    }

    const sessionMap = new Map<string, SessionSlot>();
    for (const day of group) {
      for (const slot of day.sessions) {
        const existing = sessionMap.get(slot.session);
        const entries = existing ? [...existing.entries] : [];
        for (const entry of slot.entries) {
          if (!entries.some((e) => e.subjectCode === entry.subjectCode)) {
            entries.push(entry);
          }
        }
        sessionMap.set(slot.session, {
          session: slot.session,
          startTime: slot.startTime,
          endTime: slot.endTime,
          entries,
        });
      }
    }

    merged.push({
      date,
      dayLabel: group[0].dayLabel,
      batch: group[0].batch,
      section: 'A',
      isHoliday: false,
      sessions: Array.from(sessionMap.values()),
    });
  }

  return merged.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Same idea for events: unions events across sections for a given
 * date+category+title so the same holiday/exam isn't listed 3 times.
 */
export function mergeAllSectionEvents(events: ScheduleEvent[]): ScheduleEvent[] {
  const seen = new Map<string, ScheduleEvent>();
  for (const event of events) {
    const key = `${event.date}-${event.category}-${event.title}`;
    if (!seen.has(key)) {
      seen.set(key, { ...event, section: 'A' });
    }
  }
  return Array.from(seen.values());
}
