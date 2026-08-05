import type { ScheduleEvent } from '@/types/events';
import { EventCard } from './EventCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { CalendarSearch } from 'lucide-react';

interface EventListProps {
  title: string;
  events: ScheduleEvent[];
  emptyMessage: string;
  dimmed?: boolean;
  /** Event IDs new as of this page visit — pinned to the top with a "New" tag. */
  newEventIds?: Set<string>;
}

export function EventList({ title, events, emptyMessage, dimmed, newEventIds }: EventListProps) {
  const ordered = newEventIds?.size
    ? [...events].sort((a, b) => {
        const aNew = newEventIds.has(a.id) ? 1 : 0;
        const bNew = newEventIds.has(b.id) ? 1 : 0;
        return bNew - aNew;
      })
    : events;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-bold tracking-wide uppercase">
        {title} <span className="text-muted font-sans text-sm font-normal">({events.length})</span>
      </h2>
      {events.length === 0 ? (
        <EmptyState icon={<CalendarSearch className="h-5 w-5" />} title={emptyMessage} />
      ) : (
        <div className={dimmed ? 'flex flex-col gap-2 opacity-70' : 'flex flex-col gap-2'}>
          {ordered.map((event) => (
            <EventCard key={event.id} event={event} isNew={newEventIds?.has(event.id)} />
          ))}
        </div>
      )}
    </section>
  );
}
