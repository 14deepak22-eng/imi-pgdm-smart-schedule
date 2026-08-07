import type { ScheduleEvent } from '@/types/events';
import { CATEGORY_META } from '@/lib/sheet/categoryMeta';
import { formatDayCountdown } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

type Tone = 'amber' | 'teal' | 'muted' | 'danger';

const ICON_BG: Record<Tone, string> = {
  amber: 'bg-accent/15',
  teal: 'bg-accent-2/15',
  muted: 'bg-surface-2',
  danger: 'bg-danger/15',
};

const ICON_TEXT: Record<Tone, string> = {
  amber: 'text-accent',
  teal: 'text-accent-2',
  muted: 'text-muted',
  danger: 'text-danger',
};

interface EventCardProps {
  event: ScheduleEvent;
  now: Date;
}

export function EventCard({ event, now }: EventCardProps) {
  const meta = CATEGORY_META[event.category];
  const Icon = meta.icon;
  const date = new Date(`${event.date}T00:00:00`);

  const dayMs = date.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const isToday = dayMs === 0;
  const relative = formatDayCountdown(dayMs);

  const dateLabel = date.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="active:bg-surface-2 flex items-center gap-3 px-2 py-2.5 transition-colors">
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          ICON_BG[meta.tone],
        )}
      >
        <Icon className={cn('h-4 w-4', ICON_TEXT[meta.tone])} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{event.title}</p>
        <p className="text-muted flex items-center gap-1.5 text-xs">
          {isToday && (
            <span className="bg-danger inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full" />
          )}
          <span className="truncate">
            {dateLabel} · Section {event.section}
            {!isToday && relative && <> · {relative}</>}
          </span>
        </p>
      </div>
    </div>
  );
}
