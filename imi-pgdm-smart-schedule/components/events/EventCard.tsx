import { CalendarPlus } from 'lucide-react';
import type { ScheduleEvent } from '@/types/events';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CATEGORY_META } from '@/lib/sheet/categoryMeta';
import { buildGoogleCalendarUrl } from '@/lib/utils/calendar';
import { cn } from '@/lib/utils/cn';

interface EventCardProps {
  event: ScheduleEvent;
  /** Highlights the card as freshly added/updated, for this visit only. */
  isNew?: boolean;
}

export function EventCard({ event, isNew }: EventCardProps) {
  const meta = CATEGORY_META[event.category];
  const Icon = meta.icon;
  const date = new Date(`${event.date}T00:00:00`);

  return (
    <Card
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 p-4',
        isNew && 'border-accent-2 bg-accent-2/5 ring-accent-2/40 ring-2',
      )}
    >
      <div className="flex items-center gap-3">
        <div className="bg-surface-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
          <Icon className="text-muted h-4 w-4" aria-hidden />
        </div>
        <div>
          <p className="flex items-center gap-2 font-medium">
            {event.title}
            {isNew && <Badge tone="teal">New</Badge>}
          </p>
          <p className="text-muted text-xs">
            {date.toLocaleDateString('en-IN', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
            {' · '}Section {event.section}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={meta.tone}>{meta.label}</Badge>
        
          href={buildGoogleCalendarUrl(event)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Add ${event.title} to calendar`}
          className="text-muted hover:bg-surface-2 hover:text-foreground rounded-md p-1.5 transition-colors"
        >
          <CalendarPlus className="h-4 w-4" />
        </a>
      </div>
    </Card>
  );
}
