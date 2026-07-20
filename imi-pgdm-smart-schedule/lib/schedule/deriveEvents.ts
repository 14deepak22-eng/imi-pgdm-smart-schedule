import type { ScheduleEvent, EventCategory } from '@/types/events';
import type { TargetSection } from '@/types/timetable';
import { toLocalISODate } from '@/lib/utils/date';

export interface EventBuckets {
  today: ScheduleEvent[];
  upcoming: ScheduleEvent[];
  previous: ScheduleEvent[];
}

export interface EventFilterOptions {
  section: TargetSection;
  query?: string;
  categories?: EventCategory[]; // empty/undefined = all categories
}

export function filterEvents(
  events: ScheduleEvent[],
  options: EventFilterOptions,
): ScheduleEvent[] {
  const q = options.query?.trim().toLowerCase() ?? '';
  return events.filter((e) => {
    if (e.section !== options.section) return false;
    if (options.categories?.length && !options.categories.includes(e.category)) return false;
    if (q && !e.title.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function bucketEvents(events: ScheduleEvent[], now: Date): EventBuckets {
  const todayISO = toLocalISODate(now);

  const today: ScheduleEvent[] = [];
  const upcoming: ScheduleEvent[] = [];
  const previous: ScheduleEvent[] = [];

  for (const event of events) {
    if (event.date === todayISO) today.push(event);
    else if (event.date > todayISO) upcoming.push(event);
    else previous.push(event);
  }

  today.sort((a, b) => a.date.localeCompare(b.date));
  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  previous.sort((a, b) => b.date.localeCompare(a.date)); // most recent first

  return { today, upcoming, previous };
}
