import type { ScheduleEvent } from '@/types/events';
import { toLocalISODate } from '@/lib/utils/date';

/** Formats an ISO date (yyyy-mm-dd) as yyyymmdd for Google Calendar's date params. */
function toCalendarDate(iso: string): string {
  return iso.replace(/-/g, '');
}

/**
 * Builds a Google Calendar "add event" link for an all-day event.
 * The end date is exclusive in the Calendar API, so we add one day.
 */
export function buildGoogleCalendarUrl(event: ScheduleEvent): string {
  const start = toCalendarDate(event.date);
  const endDate = new Date(`${event.date}T00:00:00`);
  endDate.setDate(endDate.getDate() + 1);
  const end = toCalendarDate(toLocalISODate(endDate));

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${event.title} — ${event.batch} ${event.section}`,
    dates: `${start}/${end}`,
    details: `${event.title} for ${event.batch} Section ${event.section}, from the PGDM session board.`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
