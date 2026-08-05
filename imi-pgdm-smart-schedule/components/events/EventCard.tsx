import { cn } from '@/lib/utils/cn';
// ...keep your existing imports...

interface EventCardProps {
  event: ScheduleEvent;
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
        isNew && 'border-l-4 border-l-accent',
      )}
    >
      {/* ...keep the rest of the existing JSX (icon block, title, date/section line, badge, calendar link) exactly as-is... */}
    </Card>
  );
}
