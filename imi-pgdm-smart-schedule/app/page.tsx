"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { NextClassCard } from "@/components/dashboard/NextClassCard";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { TodayClasses } from "@/components/dashboard/TodayClasses";
import { WeeklyTimetable } from "@/components/dashboard/WeeklyTimetable";
import { WeekPillToggle, WeekArrowBar } from "@/components/dashboard/WeekNav";
import { SearchBox } from "@/components/shared/SearchBox";
import { Skeleton } from "@/components/shared/Skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { useSchedule } from "@/components/providers/ScheduleProvider";
import { useCountdown } from "@/hooks/useCountdown";
import { useWeekOffset } from "@/hooks/useWeekOffset";
import { useDayComplete } from "@/hooks/useDayComplete";
import { DayCompleteBanner } from "@/components/dashboard/DayCompleteBanner";
import { computeDashboardStats } from "@/lib/schedule/deriveStats";
import { deriveWeekOffsetBounds } from "@/lib/schedule/deriveWeekOffsetBounds";
import { filterClassesBySubjects } from "@/lib/schedule/filterSubjects";
import {
  filterClassesByBatch,
  filterEventsByBatch,
} from "@/lib/schedule/filterBatch";
import {
  mergeAllDaySections,
  mergeAllSectionEvents,
} from "@/lib/schedule/mergeSections";

export default function DashboardPage() {
  const {
    classes,
    events,
    initialLoading,
    error,
    refresh,
    section,
    selectedSubjects,
    subjectLegend,
    showAllSections,
    selectedBatch,
  } = useSchedule();
  const [query, setQuery] = useState("");
  const [weekOffset, setWeekOffset] = useWeekOffset();

  const batchClasses = filterClassesByBatch(classes, selectedBatch);
  const batchEvents = filterEventsByBatch(events, selectedBatch);

  const scopedClasses = showAllSections
    ? mergeAllDaySections(batchClasses)
    : batchClasses;
  const scopedEvents = showAllSections
    ? mergeAllSectionEvents(batchEvents)
    : batchEvents;
  const effectiveSection = showAllSections ? "A" : section;

  const filteredClasses = filterClassesBySubjects(
    scopedClasses,
    selectedSubjects,
    subjectLegend,
  );
  const { now, current, nextEvent } = useCountdown(
    filteredClasses,
    scopedEvents,
    effectiveSection,
  );
  const stats = computeDashboardStats(filteredClasses, effectiveSection, now);
  const dayComplete = useDayComplete(current, stats.classesToday, now);
  const weekOffsetBounds = deriveWeekOffsetBounds(filteredClasses, effectiveSection, now);

  return (
    <>
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        {error && !initialLoading && (
          <ErrorState message={error} onRetry={refresh} />
        )}

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
            {/* Tighter gap just between the next-class card and the stats
                row below it — the rest of the page keeps the wider gap-6
                spacing from `main`. */}
            <div className="flex flex-col gap-3">
              <NextClassCard state={current} subjectLegend={subjectLegend} />

              <DayCompleteBanner
                show={dayComplete.show}
                onDismiss={dayComplete.dismiss}
              />

              <StatsCards stats={stats} current={current} nextEvent={nextEvent} />
            </div>

            <section className="flex flex-col gap-3">
              <h2 className="font-display text-lg font-bold tracking-wide uppercase">
                Today&apos;s Classes
              </h2>
              <TodayClasses
                days={filteredClasses}
                section={effectiveSection}
                now={now}
                subjectLegend={subjectLegend}
              />
            </section>

            <section className="flex flex-col gap-3 pb-8">
              <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                <h2 className="font-display text-base font-bold tracking-wide uppercase sm:text-lg">
                  Weekly Timetable
                </h2>
                <WeekPillToggle value={weekOffset} onChange={setWeekOffset} />
              </div>
              <SearchBox value={query} onChange={setQuery} />
              <WeekArrowBar
                value={weekOffset}
                onChange={setWeekOffset}
                days={filteredClasses}
                section={effectiveSection}
                now={now}
                minOffset={weekOffsetBounds.min}
                maxOffset={weekOffsetBounds.max}
              />
              <WeeklyTimetable
                days={filteredClasses}
                section={effectiveSection}
                now={now}
                query={query}
                weekOffset={weekOffset}
              />

              {weekOffsetBounds.min < 0 && (
                <button
                  type="button"
                  onClick={() => setWeekOffset(weekOffsetBounds.min)}
                  className="text-muted hover:text-accent mx-auto mt-1 flex items-center gap-1.5 text-sm transition-colors"
                >
                  <CalendarClock className="h-4 w-4" aria-hidden="true" />
                  Track your past schedule
                </button>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
