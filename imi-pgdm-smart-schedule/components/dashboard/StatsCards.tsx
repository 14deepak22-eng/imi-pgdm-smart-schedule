'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { CalendarDays, ListChecks, PartyPopper, Radio, ChevronRight } from 'lucide-react';
import type { DashboardStats } from '@/lib/schedule/deriveStats';
import { describeWeekTrend } from '@/lib/schedule/deriveStats';
import type { ScheduleEvent } from '@/types/events';
import type { ClassCountdownState } from '@/hooks/useCountdown';
import { formatDayCountdown, formatShortDuration } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface StatsCardsProps {
  stats: DashboardStats;
  current: ClassCountdownState;
  nextEvent: { event: ScheduleEvent; msUntilStart: number } | null;
}

/**
 * Measures the on-screen center of two nodes and keeps an SVG line drawn
 * exactly between them — so the connector stays aligned even when the
 * rows above/below it change height (e.g. a subtext line wraps).
 */
function useAlignedConnector(
  containerRef: React.RefObject<HTMLDivElement | null>,
  firstRef: React.RefObject<HTMLDivElement | null>,
  lastRef: React.RefObject<HTMLDivElement | null>,
) {
  const [line, setLine] = useState<{ x: number; y1: number; y2: number; w: number; h: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    const first = firstRef.current;
    const last = lastRef.current;
    if (!container || !first || !last) return;

    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      const firstRect = first.getBoundingClientRect();
      const lastRect = last.getBoundingClientRect();
      setLine({
        x: firstRect.left - containerRect.left + firstRect.width / 2,
        y1: firstRect.top - containerRect.top + firstRect.height / 2,
        y2: lastRect.top - containerRect.top + lastRect.height / 2,
        w: containerRect.width,
        h: containerRect.height,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, firstRef, lastRef]);

  return line;
}

export function StatsCards({ stats, current, nextEvent }: StatsCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const todayNodeRef = useRef<HTMLDivElement>(null);
  const eventNodeRef = useRef<HTMLDivElement>(null);
  const line = useAlignedConnector(containerRef, todayNodeRef, nextEvent ? eventNodeRef : todayNodeRef);

  const doneRatio = stats.classesToday > 0 ? stats.classesDoneToday / stats.classesToday : 0;
  const remainingToday = Math.max(0, stats.classesToday - stats.classesDoneToday);
  const weekTrend = describeWeekTrend(stats.weekdayCounts, stats.todayWeekdayIndex);
  const maxWeekdayCount = Math.max(1, ...stats.weekdayCounts);

  const todaySub = stats.isHolidayToday
    ? 'holiday — no classes'
    : stats.classesToday === 0
      ? 'no classes today'
      : current.kind === 'live-now'
        ? `${stats.classesDoneToday} done · live now`
        : current.kind === 'upcoming-today'
          ? `${stats.classesDoneToday} done · ${remainingToday} to go · next in ${formatShortDuration(current.msUntilStart)}`
          : `${stats.classesDoneToday} done · ${remainingToday} to go`;

  return (
    <div
      ref={containerRef}
      className="bg-surface relative overflow-hidden rounded-2xl px-4 py-5"
    >
      {line && (
        <svg
          className="pointer-events-none absolute top-0 left-0"
          width={line.w}
          height={line.h}
          viewBox={`0 0 ${line.w} ${line.h}`}
          aria-hidden
        >
          <defs>
            <linearGradient id="statsConnectorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent-2)" />
              <stop offset="60%" stopColor="var(--color-accent-2)" />
              <stop offset="100%" stopColor="var(--color-accent)" />
            </linearGradient>
          </defs>
          <line
            x1={line.x}
            y1={line.y1}
            x2={line.x}
            y2={line.y2}
            stroke="url(#statsConnectorGradient)"
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.35}
          />
        </svg>
      )}

      <div className="relative flex flex-col gap-[18px]">
        {/* Classes today — animated progress ring */}
        <div className="flex items-center gap-3.5">
          <div ref={todayNodeRef} className="relative h-11 w-11 shrink-0">
            <TodayRing ratio={stats.isHolidayToday ? 0 : doneRatio} />
            <div className="absolute inset-0 flex items-center justify-center">
              <ListChecks className="text-accent-2 h-[15px] w-[15px]" aria-hidden />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-strong text-[22px] leading-none font-extrabold tracking-tight">
                {stats.isHolidayToday ? '—' : stats.classesToday}
              </span>
              <span className="text-muted text-xs">classes today</span>
            </div>
            <p className="text-muted mt-0.5 text-[11px]">{todaySub}</p>
          </div>
        </div>

        {/* Classes this week — inline trend bars */}
        <div className="flex items-center gap-3.5">
          <div className="bg-accent-2/10 border-accent-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2">
            <CalendarDays className="text-accent-2 h-[17px] w-[17px]" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-strong text-[22px] leading-none font-extrabold tracking-tight">
                  {stats.classesThisWeek}
                </span>
                <span className="text-muted text-xs">this week</span>
              </div>
              <div className="flex h-4 items-end gap-[3px]" aria-hidden>
                {stats.weekdayCounts.map((count, i) => (
                  <WeekBar
                    key={WEEKDAY_LABELS[i]}
                    heightPct={count === 0 ? 6 : Math.max(12, (count / maxWeekdayCount) * 100)}
                    isToday={i === stats.todayWeekdayIndex}
                    delay={0.3 + i * 0.05}
                  />
                ))}
              </div>
            </div>
            <p className="text-muted mt-0.5 text-[11px]">{weekTrend}</p>
          </div>
        </div>

        {/* Next event */}
        <div className="flex items-center gap-3.5">
          <div ref={eventNodeRef} className="relative h-11 w-11 shrink-0">
            {nextEvent && (
              <span className="bg-accent/25 absolute inset-0 animate-ping rounded-full [animation-duration:2.2s]" />
            )}
            <div className="bg-accent/10 border-accent relative flex h-11 w-11 items-center justify-center rounded-full border-2">
              {nextEvent ? (
                <PartyPopper className="text-accent h-[17px] w-[17px]" aria-hidden />
              ) : (
                <Radio className="text-muted h-[17px] w-[17px]" aria-hidden />
              )}
            </div>
          </div>

          {nextEvent ? (
            <a
              href="/events"
              className="group flex min-w-0 flex-1 items-center justify-between gap-2"
            >
              <div className="min-w-0 text-left">
                <p className="text-accent text-[10px] font-bold tracking-wide uppercase">
                  Next event · {formatDayCountdown(nextEvent.msUntilStart)}
                </p>
                <p className="text-strong mt-0.5 truncate text-[15px] font-bold">
                  {nextEvent.event.title}
                </p>
              </div>
              <ChevronRight
                className="text-accent h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </a>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="text-muted text-[10px] font-bold tracking-wide uppercase">Next event</p>
              <p className="text-muted mt-0.5 text-[15px] font-medium">None scheduled</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TodayRing({ ratio }: { ratio: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useLayoutEffect(() => {
    const target = circumference * (1 - Math.min(1, Math.max(0, ratio)));
    const raf = requestAnimationFrame(() => setOffset(target));
    return () => cancelAnimationFrame(raf);
  }, [ratio, circumference]);

  return (
    <svg width={44} height={44} viewBox="0 0 44 44" className="-rotate-90">
      <circle cx={22} cy={22} r={radius} fill="var(--color-surface)" stroke="var(--color-surface-2)" strokeWidth={4} />
      <circle
        cx={22}
        cy={22}
        r={radius}
        fill="none"
        stroke="var(--color-accent-2)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-1000 ease-out"
      />
    </svg>
  );
}

function WeekBar({
  heightPct,
  isToday,
  delay,
}: {
  heightPct: number;
  isToday: boolean;
  delay: number;
}) {
  const [grown, setGrown] = useState(false);

  useLayoutEffect(() => {
    const t = setTimeout(() => setGrown(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={cn('w-1 origin-bottom rounded-[1px] transition-transform duration-500 ease-out', isToday ? 'bg-accent-2' : 'bg-surface-2')}
      style={{ height: `${heightPct}%`, transform: grown ? 'scaleY(1)' : 'scaleY(0)' }}
    />
  );
}
