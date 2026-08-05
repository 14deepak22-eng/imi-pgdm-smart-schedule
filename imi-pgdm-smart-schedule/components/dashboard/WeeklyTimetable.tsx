import type { DaySchedule, TargetSection } from '@/types/timetable';
import { Card } from '@/components/ui/Card';
import { SESSION_ORDER } from '@/lib/sheet/constants';
import { sessionLabel, formatSessionTimeRange, toLocalISODate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import { MAX_WEEKS_TO_SHOW } from '@/hooks/useWeeksToShow';

interface WeeklyTimetableProps {
  days: DaySchedule[];
  section: TargetSection;
  now: Date;
  query?: string;
  /** How many consecutive weeks to render, starting from the current week (1-4). */
  weeksToShow?: number;
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

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(start: Date, end: Date): string {
  const startLabel = start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  const endLabel = end.toLocaleDateString('en-IN', {
    month: start.getMonth() === end.getMonth() ? undefined : 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startLabel} – ${endLabel}`;
}

interface SingleWeekTableProps {
  days: DaySchedule[];
  section: TargetSection;
  now: Date;
  query: string;
  weekStart: Date;
  sessionTimes: Partial<Record<string, { start: string; end: string }>>;
}

function SingleWeekTable({
  days,
  section,
  now,
  query,
  weekStart,
  sessionTimes,
}: SingleWeekTableProps) {
  const q = query.trim().toLowerCase();
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

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col className="w-11 sm:w-16" />
          {visibleDates.map((iso) => (
            <col key={iso} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-border border-b">
            <th
              className={cn(
                'text-muted bg-surface sticky left-0 z-10 px-1.5 py-2 text-left',
                'text-[10px] font-medium tracking-wide uppercase sm:px-3 sm:py-2.5 sm:text-xs',
              )}
            >
              Sess.
            </th>
            {visibleDates.map((iso) => {
              const day: DaySchedule | undefined = byDate.get(iso);
              const date = new Date(`${iso}T00:00:00`);
              const isToday = iso === todayISO;
              return (
                <th
                  key={iso}
                  className={cn(
                    'px-1 py-2 text-center text-[10px] font-medium tracking-wide uppercase sm:px-2 sm:py-2.5 sm:text-xs',
                    isToday
                      ? 'text-accent border-accent rounded-t-lg border-t-2 border-r-2 border-l-2'
                      : 'text-muted',
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
          {visibleSessions.map((session, sessionIdx) => (
            <tr key={session} className="border-border border-b last:border-0">
              <td className="text-muted bg-surface sticky left-0 z-10 px-1.5 py-2 align-top text-[10px] sm:px-3 sm:py-2.5 sm:text-xs">
                <div className="text-foreground font-medium">{sessionLabel(session)}</div>
                {sessionTimes[session] && (
                  <div className="tabular mt-0.5 font-mono text-[8px] leading-tight sm:text-[11px]">
                    {formatSessionTimeRange(
                      sessionTimes[session]!.start,
                      sessionTimes[session]!.end,
                    )}
                  </div>
                )}
              </td>
              {visibleDates.map((iso) => {
                const day = byDate.get(iso);
                const slot = day?.sessions.find((s) => s.session === session);
                const isToday = iso === todayISO;
                const isLastSession = sessionIdx === visibleSessions.length - 1;
                return (
                  <td
                    key={iso}
                    className={cn(
                      'px-1 py-2 align-top text-center sm:px-2 sm:py-2.5',
                      isToday && 'bg-surface-2/40 border-accent border-r-2 border-l-2',
                      isToday && isLastSession && 'rounded-b-lg border-b-2',
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
                        <p className="text-[10px] leading-tight font-medium break-words sm:text-sm">
                          {slot.entries.map((e) => e.displayCode).join(' / ')}
                        </p>
                        {slot.entries.some((e) => e.room) && (
                          <p className="text-muted text-[9px] leading-tight break-words sm:text-xs">
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
    </Card>
  );
}

export function WeeklyTimetable({
  days,
  section,
  now,
  query = '',
  weeksToShow = 1,
}: WeeklyTimetableProps) {
  const clampedWeeks = Math.min(MAX_WEEKS_TO_SHOW, Math.max(1, weeksToShow));
  const currentWeekStart = startOfWeek(now);
  const sessionTimes = deriveSessionTimeLookup(days);

  const weeks = Array.from({ length: clampedWeeks }, (_, i) => {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() + i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end };
  });

  if (clampedWeeks === 1) {
    return (
      <SingleWeekTable
        days={days}
        section={section}
        now={now}
        query={query}
        weekStart={weeks[0].start}
        sessionTimes={sessionTimes}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {weeks.map(({ start, end }, i) => (
        <div key={start.toISOString()} className="flex flex-col gap-2">
          <p className="text-muted text-xs font-medium tracking-wide uppercase">
            {i === 0 ? 'This week' : `Week ${i + 1}`} · {formatWeekRange(start, end)}
          </p>
          <SingleWeekTable
            days={days}
            section={section}
            now={now}
            query={query}
            weekStart={start}
            sessionTimes={sessionTimes}
          />
        </div>
      ))}
    </div>
  );
}
