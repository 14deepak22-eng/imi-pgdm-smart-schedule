'use client';

import { useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { SearchBox } from '@/components/shared/SearchBox';
import { Skeleton } from '@/components/shared/Skeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { EventFilters } from '@/components/events/EventFilters';
import { EventList } from '@/components/events/EventList';
import { useSchedule } from '@/components/providers/ScheduleProvider';
import { useLiveClock } from '@/hooks/useLiveClock';
import { filterEvents, bucketEvents } from '@/lib/schedule/deriveEvents';
import { mergeAllSectionEvents } from '@/lib/schedule/mergeSections';
import { filterEventsByBatch } from '@/lib/schedule/filterBatch';
import type { EventCategory } from '@/types/events';

export default function EventsPage() {
  const { events, initialLoading, error, refresh, section, showAllSections, selectedBatch } =
    useSchedule();
  const { now } = useLiveClock();
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<EventCategory[]>([]);

  const effectiveSection = showAllSections ? 'A' : section;
  const batchEvents = filterEventsByBatch(events, selectedBatch);
  const scopedEvents = showAllSections ? mergeAllSectionEvents(batchEvents) : batchEvents;

  const buckets = useMemo(() => {
    const filtered = filterEvents(scopedEvents, { section: effectiveSection, query, categories });
    return bucketEvents(filtered, now);
  }, [scopedEvents, effectiveSection, query, categories, now]);

  return (
    <>
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        {error && !initialLoading && <ErrorState message={error} onRetry={refresh} />}

        {initialLoading ? (
          <div className="flex flex-col gap-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="font-display text-2xl font-bold tracking-wide uppercase">Events</h1>
                <SearchBox value={query} onChange={setQuery} placeholder="Search events…" />
              </div>
              <EventFilters selected={categories} onChange={setCategories} />
            </div>

            <EventList
              title="Today"
              events={buckets.today}
              emptyMessage="No events today for this section."
            />
            <EventList
              title="Upcoming"
              events={buckets.upcoming}
              emptyMessage="No upcoming events match your filters."
            />
            <EventList
              title="Previous"
              events={buckets.previous}
              emptyMessage="No previous events on record."
              dimmed
            />
          </>
        )}
      </main>
    </>
  );
}
