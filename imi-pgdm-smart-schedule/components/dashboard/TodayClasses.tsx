'use client';

import type { DaySchedule, TargetSection } from '@/types/timetable';
import type { SubjectLegendEntry } from '@/lib/sheet/parseSubjectNames';
import { resolveSubjectIdentity } from '@/lib/sheet/resolveSubjectIdentity';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { sessionLabel, toLocalISODate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import { CalendarCheck2, Check, MapPin, Radio } from 'lucide-react';

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

/**
 * How the connector segment BELOW a row should look, based on this row's
 * status and the status of whatever comes right after it:
 * - done -> done: both already happened, solid bright line all the way.
 * - done -> anything else: this is the most recently finished class, and
 *   the segment right after it is "now" -- animated/flowing to show time
 *   actively passing, whether that's into a live class or into a gap
 *   before the next one.
 * - live / upcoming -> *: hasn't happened yet, stays dim.
 * No connector is rendered after the very last row (nextStatus undefined).
 */
function connectorVariant(
  status: RowStatus,
  nextStatus: RowStatus | undefined,
): 'solid' | 'flowing' | 'dim' | null {
  if (!nextStatus) return null;
  if (status === 'done') return nextStatus === 'done' ? 'solid' : 'flowing';
  return 'dim';
}

// Shares the exact same horizontal box as the dot (-left-8, w-5) and
// centers the bar inside it with flexbox, instead of a separately
// guessed pixel offset — so it's always perfectly centered under the
// dots no matter where this row sits, rather than relying on both
// numbers being kept in sync by hand.
function Connector({ variant }: { variant: 'solid' | 'flowing' | 'dim' }) {
  const barClass =
    variant === 'dim'
      ? 'bg-border'
      : variant === 'solid'
        ? 'bg-accent shadow-[0_0_6px_0_rgba(232,163,61,0.6)]'
        : 'schedule-line-flow shadow-[0_0_6px_0_rgba(232,163,61,0.6)]';

  return (
    <div className="absolute -left-8 top-5 -bottom-5 flex w-5 justify-center" aria-hidden>
      <div className={cn('h-full w-0.5 rounded-full', barClass)} />
    </div>
  );
}

export function TodayClasses({ days, section, now, query = '', subjectLegend }: TodayClassesProps) {
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

  // Done rows first, then the live one (if any), then what's left today --
  // this ordering is also what each row's connector uses to know what
  // comes next, so it has to match the actual visual stacking order below.
  const orderedRows: Row[] = [
    ...rows.filter((r) => r.status === 'done'),
    ...rows.filter((r) => r.status === 'live'),
    ...rows.filter((r) => r.status === 'upcoming'),
  ];

  return (
    <div className="flex flex-col gap-5 pl-8">
      {orderedRows.map((row, i) => {
        const nextStatus = orderedRows[i + 1]?.status;
        const variant = connectorVariant(row.status, nextStatus);

        if (row.status === 'live') {
          return (
            <LiveRow key={row.session} row={row} now={now}>
              {variant && <Connector variant={variant} />}
            </LiveRow>
          );
        }
        if (row.status === 'done') {
          return (
            <DoneRow key={row.session} row={row}>
              {variant && <Connector variant={variant} />}
            </DoneRow>
          );
        }
        return (
          <UpcomingRow key={row.session} row={row} now={now}>
            {variant && <Connector variant={variant} />}
          </UpcomingRow>
        );
      })}

      <style>{`
        @keyframes schedule-line-flow-dash {
          from { background-position: 0 0; }
          to { background-position: 0 24px; }
        }
        .schedule-line-flow {
          background-image: repeating-linear-gradient(
            180deg,
            var(--color-accent) 0,
            var(--color-accent) 10px,
            rgba(232, 163, 61, 0.35) 10px,
            rgba(232, 163, 61, 0.35) 14px
          );
          background-size: 100% 24px;
          animation: schedule-line-flow-dash 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

function LiveRow({ row, now, children }: { row: Row; now: Date; children?: React.ReactNode }) {
  const remaining = formatShortDuration(row.end.getTime() - now.getTime());

  return (
    <div className="relative">
      {children}
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
        <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2">
          {row.faculty && <p className="text-muted text-xs">{row.faculty}</p>}
          <span className="text-muted shrink-0 text-xs">{remaining} left</span>
        </div>
      </Card>
    </div>
  );
}

function UpcomingRow({
  row,
  now,
  children,
}: {
  row: Row;
  now: Date;
  children?: React.ReactNode;
}) {
  const countdown = formatShortDuration(row.start.getTime() - now.getTime());

  return (
    <div className="relative">
      {children}
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

function DoneRow({ row, children }: { row: Row; children?: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      {/* Dot + connector stay at full brightness — only the row's own text
          fades, so the glowing tick/line isn't washed out along with it. */}
      <span
        className="bg-accent absolute -left-8 top-0.5 flex h-5 w-5 items-center justify-center rounded-full shadow-[0_0_8px_0_rgba(232,163,61,0.6)]"
        aria-hidden
      >
        <Check className="text-background h-2.5 w-2.5" strokeWidth={3} aria-hidden />
      </span>
      <div className="flex flex-wrap items-center justify-between gap-2 opacity-50">
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
