'use client';

import { useState } from 'react';
import type { DaySchedule, TargetSection } from '@/types/timetable';
import type { SubjectLegendEntry } from '@/lib/sheet/parseSubjectNames';
import { resolveSubjectIdentity } from '@/lib/sheet/resolveSubjectIdentity';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { sessionLabel, toLocalISODate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import { CalendarCheck2, Check, ChevronDown, MapPin, Radio } from 'lucide-react';

interface TodayClassesProps {
  days: DaySchedule[];
  section: TargetSection;
  now: Date;
  query?: string;
  /** Subject code → {name, faculty}, used to show the faculty name under each class. */
  subjectLegend: Record<string, SubjectLegendEntry>;
}

type RowStatus = 'live' | 'upcoming' | 'done';

interface Row {
  session: string;
  start: Date;
  end: Date;
  status: RowStatus;
  displayCode: string;
  rooms: string;
  faculty?: string;
}

function statusOf(start: Date, end: Date, now: Date): RowStatus {
  if (now >= start && now < end) return 'live';
  if (now < start) return 'upcoming';
  return 'done';
}

/** Formats a millisecond duration as "1h 24m" / "24m", rounded to the minute. */
function formatShortDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${minutes}m`;
}

/** Formats a Date as "8:30 AM" in the local timezone. */
function formatTimeShort(date: Date): string {
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function TodayClasses({ days, section, now, query = '', subjectLegend }: TodayClassesProps) {
  const [showDone, setShowDone] = useState(false);
  const todayISO = toLocalISODate(now);
  const today = days.find((d) => d.date === todayISO && d.section === section);

  if (!today || today.isHoliday) {
    return (
      <EmptyState
        icon={<CalendarCheck2 className="h-5 w-5" />}
        title={today?.isHoliday ? 'Holiday today' : 'No classes scheduled today'}
        description={
          today?.isHoliday
            ? 'Enjoy the day off — nothing on the board for your section.'
            : "Nothing found for today's date in the published schedule."
        }
      />
    );
  }

  const sessions = today.sessions.filter((s) => s.entries.length > 0);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? sessions.filter((s) => s.entries.some((e) => e.subjectCode.toLowerCase().includes(q)))
    : sessions;

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={<CalendarCheck2 className="h-5 w-5" />}
        title="No classes scheduled today"
        description="Nothing found for today's date in the published schedule."
      />
    );
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={<CalendarCheck2 className="h-5 w-5" />}
        title={`No match for "${query}"`}
        description="Try a different subject code, or clear the search."
      />
    );
  }

  const rows: Row[] = filtered.map((slot) => {
    const start = new Date(`${today.date}T${slot.startTime}:00`);
    const end = new Date(`${today.date}T${slot.endTime}:00`);
    const primary = slot.entries[0];
    const faculty = primary
      ? resolveSubjectIdentity(primary.subjectCode, subjectLegend).faculty
      : undefined;
    const rooms = slot.entries
      .map((e) => e.room)
      .filter(Boolean)
      .join(', ');

    return {
      session: slot.session,
      start,
      end,
      status: statusOf(start, end, now),
      displayCode: slot.entries.map((e) => e.displayCode).join(' / '),
      rooms,
      faculty,
    };
  });

  const doneRows = rows.filter((r) => r.status === 'done');
  const liveRows = rows.filter((r) => r.status === 'live');
  const upcomingRows = rows.filter((r) => r.status === 'upcoming');

  return (
    <div className="relative flex flex-col gap-5 pl-8">
      <div className="bg-border absolute top-1 bottom-1 left-2.5 w-px" aria-hidden />

      {doneRows.length > 0 && (
        <div className="relative">
          <span className="bg-surface-2 border-border absolute -left-8 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2">
            <Check className="text-muted h-2.5 w-2.5" aria-hidden />
          </span>
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="text-muted hover:text-foreground flex items-center gap-1 text-xs transition-colors"
          >
            {doneRows.length} class{doneRows.length > 1 ? 'es' : ''} completed
            <ChevronDown
              className={cn('h-3 w-3 transition-transform', showDone && 'rotate-180')}
              aria-hidden
            />
          </button>
          {showDone && (
            <div className="mt-3 flex flex-col gap-3">
              {doneRows.map((row) => (
                <DoneRow key={row.session} row={row} />
              ))}
            </div>
          )}
        </div>
      )}

      {liveRows.map((row) => (
        <LiveRow key={row.session} row={row} now={now} />
      ))}

      {upcomingRows.map((row) => (
        <UpcomingRow key={row.session} row={row} now={now} />
      ))}
    </div>
  );
}

function LiveRow({ row, now }: { row: Row; now: Date }) {
  const total = row.end.getTime() - row.start.getTime();
  const elapsed = now.getTime() - row.start.getTime();
  const percent = Math.min(100, Math.max(0, total > 0 ? (elapsed / total) * 100 : 0));
  const remaining = formatShortDuration(row.end.getTime() - now.getTime());

  return (
    <div className="relative">
      <span className="bg-accent/20 absolute -left-8 top-0.5 flex h-5 w-5 items-center justify-center rounded-full">
        <span className="bg-accent h-2 w-2 animate-pulse rounded-full" aria-hidden />
      </span>
      <Card
        className={cn(
          'p-4',
          'shadow-[0_0_0_1px_var(--color-accent),0_0_24px_-10px_rgba(232,163,61,0.5)]',
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-muted text-xs">
            {formatTimeShort(row.start)} – {formatTimeShort(row.end)} · {sessionLabel(row.session)}
          </span>
          <Badge tone="amber" className="gap-1.5">
            <Radio className="h-3 w-3 animate-pulse" aria-hidden />
            Live now
          </Badge>
        </div>

        <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-display text-lg font-bold tracking-wide uppercase">{row.displayCode}</p>
          {row.rooms && (
            <span className="text-muted flex shrink-0 items-center gap-1 text-xs">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {row.rooms}
            </span>
          )}
        </div>
        {row.faculty && <p className="text-muted mt-0.5 text-xs">{row.faculty}</p>}

        <div className="bg-surface-2 mt-3 h-1 overflow-hidden rounded-full">
          <div
            className="bg-accent h-full rounded-full transition-[width] duration-1000"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-muted mt-1 text-xs">{remaining} left</p>
      </Card>
    </div>
  );
}

function UpcomingRow({ row, now }: { row: Row; now: Date }) {
  const countdown = formatShortDuration(row.start.getTime() - now.getTime());

  return (
    <div className="relative">
      <span
        className="border-border bg-surface absolute -left-8 top-0.5 h-5 w-5 rounded-full border-2"
        aria-hidden
      />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-muted text-xs">
            {formatTimeShort(row.start)} – {formatTimeShort(row.end)} · {sessionLabel(row.session)}
          </p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
            <p className="font-medium">{row.displayCode}</p>
            {row.rooms && (
              <span className="text-muted flex items-center gap-1 text-xs">
                <MapPin className="h-3 w-3" aria-hidden />
                {row.rooms}
              </span>
            )}
          </div>
          {row.faculty && <p className="text-muted mt-0.5 text-xs">{row.faculty}</p>}
        </div>
        <span className="text-muted shrink-0 text-xs">in {countdown}</span>
      </div>
    </div>
  );
}

function DoneRow({ row }: { row: Row }) {
  return (
    <div className="relative opacity-50">
      <span className="bg-surface-2 border-border absolute -left-8 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2">
        <Check className="text-muted h-2.5 w-2.5" aria-hidden />
      </span>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-muted text-xs">
            {formatTimeShort(row.start)} – {formatTimeShort(row.end)} · {sessionLabel(row.session)}
          </p>
          <p className="text-sm font-medium">{row.displayCode}</p>
        </div>
        <span className="text-muted text-xs">Done</span>
      </div>
    </div>
  );
}
