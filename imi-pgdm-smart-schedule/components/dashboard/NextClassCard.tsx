import { Radio, ArrowRight, CalendarClock, CalendarX } from 'lucide-react';
import type { ClassCountdownState } from '@/hooks/useCountdown';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FlapDigits } from './FlapDigits';
import { formatCountdownDigits, sessionLabel } from '@/lib/utils/date';
import { Skeleton } from '@/components/shared/Skeleton';

interface NextClassCardProps {
  state: ClassCountdownState;
}

export function NextClassCard({ state }: NextClassCardProps) {
  if (state.kind === 'not-ready') {
    return (
      <Card className="p-6 sm:p-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-12 w-64" />
        <Skeleton className="mt-4 h-4 w-40" />
      </Card>
    );
  }

  if (state.kind === 'schedule-ended') {
    return (
      <Card className="flex flex-col items-center gap-2 p-8 text-center">
        <CalendarX className="text-muted h-6 w-6" aria-hidden />
        <p className="font-display text-2xl font-bold tracking-wide uppercase">Board is clear</p>
        <p className="text-muted text-sm">No more sessions found in the published schedule.</p>
      </Card>
    );
  }

  const isLive = state.kind === 'live-now';
  const session = state.session;
  const digits = formatCountdownDigits(isLive ? state.msRemaining : state.msUntilStart);
  const primaryEntry = session.entries[0];
  const extraCount = session.entries.length - 1;

  return (
    <Card className="overflow-hidden p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isLive ? (
            <Badge tone="amber" className="gap-1.5">
              <Radio className="h-3 w-3 animate-pulse" /> Live now
            </Badge>
          ) : (
            <Badge tone="teal" className="gap-1.5">
              <ArrowRight className="h-3 w-3" />
              {state.kind === 'upcoming-today' ? 'Next up today' : 'Next class'}
            </Badge>
          )}
          <span className="text-muted text-sm">{sessionLabel(session.session)}</span>
        </div>
        <span className="text-muted flex items-center gap-1.5 text-xs">
          <CalendarClock className="h-3.5 w-3.5" />
          {new Date(session.start).toLocaleDateString('en-IN', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-3xl leading-none font-extrabold tracking-wide uppercase sm:text-4xl">
            {primaryEntry?.subjectCode ?? 'Class'}
          </p>
          {primaryEntry?.room && (
            <p className="text-muted mt-2 text-sm">Room {primaryEntry.room}</p>
          )}
          {extraCount > 0 && (
            <p className="text-muted mt-1 text-xs">
              +{extraCount} more offering{extraCount > 1 ? 's' : ''} in this slot
            </p>
          )}
        </div>

        <div className="flex flex-col items-start gap-1 sm:items-end">
          <span className="text-muted text-xs tracking-wide uppercase">
            {isLive ? 'Time remaining' : 'Starts in'}
          </span>
          <FlapDigits value={digits} tone={isLive ? 'amber' : 'teal'} />
        </div>
      </div>
    </Card>
  );
}
