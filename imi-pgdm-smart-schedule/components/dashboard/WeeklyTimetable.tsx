import type { DaySchedule, TargetSection } from '@/types/timetable';
import { Card } from '@/components/ui/Card';
import { SESSION_ORDER, SESSION_TIMES } from '@/lib/sheet/constants';
import { sessionLabel, formatSessionTimeRange, toLocalISODate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

interface WeeklyTimetableProps {
  days: DaySchedule[];
  section: TargetSection;
  now: Date;
  query?: string;
  /** How many consecutive weeks to render, starting from the current week (1-4). */
  weeksToShow?: number;
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
}

function SingleWeekTable({ days, section, now, query, weekStart }: SingleWeekTableProps) {
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

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-border border-b">
            <th className="text-muted w-24 px-3 py-2.5 text-left text-xs font-medium tracking-wide uppercase">
              Session
            </th>
            {visibleDates.map((iso) => {
              const day: DaySchedule | undefined = byDate.get(iso);
              const date = new Date(`${iso}T00:00:00`);
              const isToday = iso === todayISO;
              return (
                <th
                  key={iso}
                  className={cn(
                    'px-3 py-2.5 text-left text-xs font-medium tracking-wide uppercase',
                    isToday ? 'text-accent' : 'text-muted',
                  )}
                >
                  {date.toLocaleDateString('en-IN', { weekday: 'short' })}{' '}
                  <span className="tabular font-mono font-normal normal-case">
                    {date.getDate()}
                  </span>
                  {day?.isHoliday && <span className="text-accent-2 ml-1">·hol</span>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {SESSION_ORDER.filter((s) => s !== 'LUNCH').map((session) => (
            <tr key={session} className="border-border border-b last:border-0">
              <td className="text-muted px-3 py-2.5 align-top text-xs">
                <div className="text-foreground font-medium">{sessionLabel(session)}</div>
                <div className="tabular mt-0.5 font-mono text-[11px]">
                  {formatSessionTimeRange(SESSION_TIMES[session].start, SESSION_TIMES[session].end)}
                </div>
              </td>
              {visibleDates.map((iso) => {
                const day = byDate.get(iso);
                const slot = day?.sessions.find((s) => s.session === session);
                const isToday = iso === todayISO;
                return (
                  <td
                    key={iso}
                    className={cn('px-3 py-2.5 align-top', isToday && 'bg-surface-2/60')}
                  >
                    {day?.isHoliday ? (
                      <span className="text-muted text-xs">—</span>
                    ) : slot && slot.entries.length > 0 ? (
                      <div
                        className={
                          q && !slot.entries.some((e) => e.subjectCode.toLowerCase().includes(q))
                            ? 'opacity-30'
                            : undefined
                        }
                      >
                        <p className="leading-tight font-medium">
                          {slot.entries.map((e) => e.subjectCode).join(' / ')}
                        </p>
                        {slot.entries.some((e) => e.room) && (
                          <p className="text-muted text-xs">
                            {slot.entries
                              .map((e) => e.room)
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted text-xs">—</span>
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
  const clampedWeeks = Math.min(4, Math.max(1, weeksToShow));
  const currentWeekStart = startOfWeek(now);

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
          />
        </div>
      ))}
    </div>
  );
}
