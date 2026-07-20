import { CalendarDays, ListChecks, PartyPopper } from 'lucide-react';
import type { DashboardStats } from '@/lib/schedule/deriveStats';
import type { ScheduleEvent } from '@/types/events';
import { Card } from '@/components/ui/Card';
import { formatDayCountdown } from '@/lib/utils/date';

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}

function StatItem({ icon, label, value, sub }: StatItemProps) {
  return (
    <Card className="flex items-start gap-3 p-4">
      <div className="text-accent-2 mt-0.5">{icon}</div>
      <div>
        <p className="text-muted text-xs tracking-wide uppercase">{label}</p>
        <p className="font-display text-2xl leading-tight font-bold">{value}</p>
        {sub && <p className="text-muted mt-0.5 text-xs">{sub}</p>}
      </div>
    </Card>
  );
}

interface StatsCardsProps {
  stats: DashboardStats;
  nextEvent: { event: ScheduleEvent; msUntilStart: number } | null;
}

export function StatsCards({ stats, nextEvent }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <StatItem
        icon={<ListChecks className="h-4 w-4" />}
        label="Classes today"
        value={stats.isHolidayToday ? 'Holiday' : String(stats.classesToday)}
      />
      <StatItem
        icon={<CalendarDays className="h-4 w-4" />}
        label="Classes this week"
        value={String(stats.classesThisWeek)}
      />
      <StatItem
        icon={<PartyPopper className="h-4 w-4" />}
        label="Next event"
        value={nextEvent ? nextEvent.event.title : 'None scheduled'}
        sub={nextEvent ? formatDayCountdown(nextEvent.msUntilStart) : undefined}
      />
    </div>
  );
}
