'use client';

import { useEffect, useRef } from 'react';
import type { DaySchedule, TargetSection } from '@/types/timetable';
import { Card } from '@/components/ui/Card';
import { SESSION_ORDER } from '@/lib/sheet/constants';
import { toLocalISODate, startOfWeek } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import type { WeekOffset } from '@/hooks/useWeekOffset';

interface WeeklyTimetableProps {
  days: DaySchedule[];
  section: TargetSection;
  now: Date;
  query?: string;
  /** Which week to render: 0 = this week, 1 = next week, and so on. */
  weekOffset?: WeekOffset;
}

/**
 * Reads the actual session time labels straight from the parsed data
 * (which already carries each batch's correct junior/senior times on
 * every slot, from lib/sheet/parseSchedule.ts) rather than any single
 * global constant — so the label row always matches whichever batch
 * `days` has been scoped to.
 */
function deriveSessionTimeLookup(
  days: DaySchedule[],
): Partial<Record<string, { start: string; end: string }>> {
  const lookup: Partial<Record<string, { start: string; end: string }>> = {};
  for (const day of days) {
    if (day.isHoliday) continue;
    for (const slot of day.sessions) {
      if (!lookup[slot.session]) {
        lookup[slot.session] = { start: slot.startTime, end: slot.endTime };
      }
    }
    if (Object.keys(lookup).length >= SESSION_ORDER.length) break;
  }
  return lookup;
}

export function WeeklyTimetable({
  days,
  section,
  now,
  query = '',
  weekOffset = 0,
}: WeeklyTimetableProps) {
  const q = query.trim().toLowerCase();
  const sessionTimes = deriveSessionTimeLookup(days);

  const weekStart = startOfWeek(now);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return toLocalISODate(d);
  });

  const byDate = new Map(days.filter((d) => d.section === section).map((d) => [d.date, d]));

  // Skip weekend columns entirely if there's no data for them at all this week.
  const visibleDates = weekDates.filter((iso, idx) => idx < 5 || byDate.has(iso));
  const todayISO = toLocalISODate(now);
  const visibleSessions = SESSION_ORDER.filter((s) => s !== 'LUNCH');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayColRef = useRef<HTMLTableCellElement>(null);

  // Auto-scroll the horizontally-scrollable table so today's column is the
  // first thing visible, instead of making the user scroll right to find it.
  // Scrolled on the inner container directly (not scrollIntoView) so this
  // never affects the page's vertical scroll position on load.
  useEffect(() => {
    if (weekOffset !== 0) return;
    const container = scrollContainerRef.current;
    const cell = todayColRef.current;
    if (!container || !cell) return;
    container.scrollLeft = cell.offsetLeft - container.offsetLeft;
    // Re-run whenever the visible date range or "today" changes (e.g. app
    // left open overnight), not just on first mount.
  }, [weekOffset, todayISO, visibleDates.join(',')]);
  return (
    <Card className="p-3 sm:p-4">
      <div ref={scrollContainerRef} className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-x-1 border-spacing-y-1 text-sm sm:border-spacing-x-1.5 sm:border-spacing-y-1.5">
          <colgroup>
            <col />
            {visibleDates.map((iso) => (
              <col key={iso} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="text-muted bg-surface sticky left-0 z-10 px-1 py-1 text-left text-[10px] font-medium tracking-wide uppercase sm:px-2 sm:text-xs">
                Sess.
              </th>
              {visibleDates.map((iso) => {
                const day: DaySchedule | undefined = byDate.get(iso);
                const date = new Date(`${iso}T00:00:00`);
                const isToday = iso === todayISO;
                return (
                  <th
                    key={iso}
                    ref={isToday ? todayColRef : undefined}
                    className={cn(
                      'scroll-ml-10 px-1 py-1.5 text-center text-[10px] font-medium tracking-wide uppercase sm:scroll-ml-14 sm:text-xs',
                      isToday ? 'text-accent border-accent border-b-2' : 'text-muted',
                    )}
                  >
                    <div className="flex flex-col items-center leading-tight sm:flex-row sm:justify-center sm:gap-1">
                      <span>{date.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                      <span className="tabular font-mono font-normal normal-case">
                        {date.getDate()}
                      </span>
                    </div>
                    {day?.isHoliday && (
                      <span className="text-accent-2 mt-0.5 block text-[9px] normal-case">
                        hol
                      </span>
                    )}
                    {isToday && (
                      <span className="text-accent mt-0.5 block text-[9px] normal-case">
                        today
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleSessions.map((session) => (
              <tr key={session}>
                <td className="text-muted bg-surface sticky left-0 z-10 px-1 py-1 align-top text-[10px] whitespace-nowrap sm:px-2 sm:text-xs">
                  <div className="text-foreground font-medium">{session}</div>
                  {sessionTimes[session] && (
                    <div className="tabular mt-0.5 font-mono text-[8px] leading-tight whitespace-nowrap sm:text-[11px]">
                      {sessionTimes[session]!.start}
                    </div>
                  )}
                </td>
                {visibleDates.map((iso) => {
                  const day = byDate.get(iso);
                  const slot = day?.sessions.find((s) => s.session === session);
                  const isToday = iso === todayISO;
                  const hasClass = !day?.isHoliday && slot && slot.entries.length > 0;
                  return (
                    <td
                      key={iso}
                      className={cn(
                        'rounded-lg px-2 py-1.5 align-top text-center sm:px-3 sm:py-2',
                        hasClass ? 'bg-surface-2' : 'bg-surface-2/30',
                        isToday && 'ring-accent ring-1 ring-inset',
                      )}
                    >
                      {day?.isHoliday ? (
                        <span className="text-muted text-[10px] sm:text-xs">—</span>
                      ) : slot && slot.entries.length > 0 ? (
                        <div
                          className={
                            q && !slot.entries.some((e) => e.subjectCode.toLowerCase().includes(q))
                              ? 'opacity-30'
                              : undefined
                          }
                        >
                          <p className="text-[11px] leading-tight font-medium whitespace-nowrap sm:text-sm">
                            {slot.entries.map((e) => e.displayCode).join(' / ')}
                          </p>
                          {slot.entries.some((e) => e.room) && (
                            <p className="text-muted text-[9px] leading-tight whitespace-nowrap sm:text-xs">
                              {slot.entries
                                .map((e) => e.room)
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted text-[10px] sm:text-xs">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
