import type { DaySchedule, TargetSection } from '@/types/timetable';
import { Card } from '@/components/ui/Card';
import { SESSION_ORDER } from '@/lib/sheet/constants';
import {
  sessionLabel,
  formatSessionTimeRange,
  formatTime12h,
  toLocalISODate,
  startOfWeek,
} from '@/lib/utils/date';
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

  return (
    <Card className="overflow-x-auto p-3 sm:p-4">
      <table className="w-full table-fixed border-separate border-spacing-x-1 border-spacing-y-1 text-sm sm:border-spacing-x-1.5 sm:border-spacing-y-1.5">
        <colgroup>
          <col className="w-11 sm:w-24" />
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
                  className={cn(
                    'px-1 py-1.5 text-center text-[10px] font-medium tracking-wide uppercase sm:text-xs',
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
                <div className="text-foreground font-medium">
                  <span className="sm:hidden">{session}</span>
                  <span className="hidden sm:inline">{sessionLabel(session)}</span>
                </div>
                {sessionTimes[session] && (
                  <div className="tabular mt-0.5 font-mono text-[8px] leading-tight whitespace-nowrap sm:text-[11px]">
                    <span className="sm:hidden">
                      {formatTime12h(sessionTimes[session]!.start)}
                    </span>
                    <span className="hidden sm:inline">
                      {formatSessionTimeRange(
                        sessionTimes[session]!.start,
                        sessionTimes[session]!.end,
                      )}
                    </span>
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
                      'rounded-lg px-1 py-1.5 align-top text-center sm:px-2 sm:py-2',
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
