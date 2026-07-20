import type { DaySchedule } from '@/types/timetable';
import type { ScheduleEvent } from '@/types/events';

export function filterClassesByBatch(
  days: DaySchedule[],
  batchPrefix: string | null,
): DaySchedule[] {
  if (!batchPrefix) return [];
  return days.filter((d) => d.batch === batchPrefix);
}

export function filterEventsByBatch(
  events: ScheduleEvent[],
  batchPrefix: string | null,
): ScheduleEvent[] {
  if (!batchPrefix) return [];
  return events.filter((e) => e.batch === batchPrefix);
}
