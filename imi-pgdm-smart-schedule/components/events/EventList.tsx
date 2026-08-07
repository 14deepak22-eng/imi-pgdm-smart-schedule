import type { ScheduleEvent } from '@/types/events';
import { EventCard } from './EventCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { CalendarSearch } from 'lucide-react';

interface EventListProps {
  title: string;
  events: ScheduleEvent[];
  emptyMessage: string;
  now: Date;
  dimmed?: boolean;
}

export function EventList({ title, events, emptyMessage, now, dimmed }: EventListProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-bold tracking-wide uppercase">
        {title} <span className="text-muted font-sans text-sm font-normal">({events.length})</span>
      </h2>
      {events.length === 0 ? (
        <EmptyState icon={<CalendarSearch className="h-5 w-5" />} title={emptyMessage} />
      ) : (
        <div className={dimmed ? 'opacity-70' : undefined}>
          <div className="border-border divide-border rounded-xl border-2 divide-y-2">
            {events.map((event) => (
              <EventCard key={event.id} event={event} now={now} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
