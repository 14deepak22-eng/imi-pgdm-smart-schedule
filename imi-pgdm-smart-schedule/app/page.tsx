'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { NextClassCard } from '@/components/dashboard/NextClassCard';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { TodayClasses } from '@/components/dashboard/TodayClasses';
import { WeeklyTimetable } from '@/components/dashboard/WeeklyTimetable';
import { WeeksSelector } from '@/components/dashboard/WeeksSelector';
import { SearchBox } from '@/components/shared/SearchBox';
import { Skeleton } from '@/components/shared/Skeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { useSchedule } from '@/components/providers/ScheduleProvider';
import { useCountdown } from '@/hooks/useCountdown';
import { useWeeksToShow } from '@/hooks/useWeeksToShow';
import { computeDashboardStats } from '@/lib/schedule/deriveStats';
import { filterClassesBySubjects } from '@/lib/schedule/filterSubjects';
import { filterClassesByBatch, filterEventsByBatch } from '@/lib/schedule/filterBatch';
import { mergeAllDaySections, mergeAllSectionEvents } from '@/lib/schedule/mergeSections';

export default function DashboardPage() {
  const {
    classes,
    events,
    initialLoading,
    error,
    refresh,
    section,
    selectedSubjects,
    showAllSections,
    selectedBatch,
  } = useSchedule();
  const [query, setQuery] = useState('');
  const [weeksToShow, setWeeksToShow] = useWeeksToShow();

  const batchClasses = filterClassesByBatch(classes, selectedBatch);
  const batchEvents = filterEventsByBatch(events, selectedBatch);

  const scopedClasses = showAllSections ? mergeAllDaySections(batchClasses) : batchClasses;
  const scopedEvents = showAllSections ? mergeAllSectionEvents(batchEvents) : batchEvents;
  const effectiveSection = showAllSections ? 'A' : section;

  const filteredClasses = filterClassesBySubjects(scopedClasses, selectedSubjects);
  const { now, current, nextEvent } = useCountdown(filteredClasses, scopedEvents, effectiveSection);
  const stats = computeDashboardStats(filteredClasses, effectiveSection, now);

  return (
    <>
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        {error && !initialLoading && <ErrorState message={error} onRetry={refresh} />}

        {initialLoading ? (
          <div className="flex flex-col gap-6">
            <Skeleton className="h-48 w-full" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            <NextClassCard state={current} />

            <StatsCards stats={stats} nextEvent={nextEvent} />

            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold tracking-wide uppercase">
                  Today&apos;s Classes
                </h2>
                <SearchBox value={query} onChange={setQuery} />
              </div>
              <TodayClasses
                days={filteredClasses}
                section={effectiveSection}
                now={now}
                query={query}
              />
            </section>

            <section className="flex flex-col gap-3 pb-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold tracking-wide uppercase">
                  Weekly Timetable
                </h2>
                <WeeksSelector value={weeksToShow} onChange={setWeeksToShow} />
              </div>
              <WeeklyTimetable
                days={filteredClasses}
                section={effectiveSection}
                now={now}
                query={query}
                weeksToShow={weeksToShow}
              />
            </section>
          </>
        )}
      </main>
    </>
  );
}
