import type { DaySchedule, TargetSection } from '@/types/timetable';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { sessionLabel, toLocalISODate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import { CalendarCheck2 } from 'lucide-react';

interface TodayClassesProps {
  days: DaySchedule[];
  section: TargetSection;
  now: Date;
  query?: string;
}

type RowStatus = 'live' | 'upcoming' | 'done';

function statusOf(start: Date, end: Date, now: Date): RowStatus {
  if (now >= start && now < end) return 'live';
  if (now < start) return 'upcoming';
  return 'done';
}

const STATUS_EDGE: Record<RowStatus, string> = {
  live: 'border-l-accent',
  upcoming: 'border-l-accent-2',
  done: 'border-l-border',
};

export function TodayClasses({ days, section, now, query = '' }: TodayClassesProps) {
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

  return (
    <div className="flex flex-col gap-2">
      {filtered.map((slot) => {
        const start = new Date(`${today.date}T${slot.startTime}:00`);
        const end = new Date(`${today.date}T${slot.endTime}:00`);
        const status = statusOf(start, end, now);

        return (
          <Card
            key={slot.session}
            className={cn(
              'flex flex-wrap items-center justify-between gap-3 border-l-4 px-4 py-3',
              STATUS_EDGE[status],
              status === 'done' && 'opacity-60',
            )}
          >
            <div className="flex items-center gap-3">
              <span className="tabular text-muted w-28 shrink-0 font-mono text-xs">
                {slot.startTime}–{slot.endTime}
              </span>
              <div>
                <p className="font-medium">{slot.entries.map((e) => e.subjectCode).join(' / ')}</p>
                <p className="text-muted text-xs">
                  {sessionLabel(slot.session)}
                  {slot.entries.some((e) => e.room) &&
                    ` · Room ${slot.entries
                      .map((e) => e.room)
                      .filter(Boolean)
                      .join(', ')}`}
                </p>
              </div>
            </div>
            {status === 'live' && <Badge tone="amber">Live now</Badge>}
            {status === 'upcoming' && <Badge tone="teal">Upcoming</Badge>}
            {status === 'done' && <Badge tone="muted">Done</Badge>}
          </Card>
        );
      })}
    </div>
  );
}
