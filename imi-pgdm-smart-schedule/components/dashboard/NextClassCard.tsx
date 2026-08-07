'use client';

import { useLayoutEffect, useState } from 'react';
import { Radio, ArrowRight, CalendarClock, CalendarX, Clock, MapPin } from 'lucide-react';
import type { ClassCountdownState } from '@/hooks/useCountdown';
import type { SubjectLegendEntry } from '@/lib/sheet/parseSubjectNames';
import { resolveSubjectIdentity } from '@/lib/sheet/resolveSubjectIdentity';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCountdownDigits, formatDaysHoursCountdown, sessionLabel } from '@/lib/utils/date';
import { Skeleton } from '@/components/shared/Skeleton';
import { cn } from '@/lib/utils/cn';

interface NextClassCardProps {
  state: ClassCountdownState;
  /** Subject code → {name, faculty}, auto-fetched from the sheet's legend tab. Used to show the faculty name below the room. */
  subjectLegend: Record<string, SubjectLegendEntry>;
}

/** Formats a Date as "6:30 PM" — no seconds, unlike formatClockTime. */
function formatTimeShort(date: Date): string {
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function NextClassCard({ state, subjectLegend }: NextClassCardProps) {
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
  const msValue = isLive ? state.msRemaining : state.msUntilStart;
  // Past 24 hours, "25h 03m 12s" is harder to read (and doesn't fit the
  // ring) than "1 day 1 hour" — switch to day+hour wording instead.
  const isDayScale = msValue >= 24 * 60 * 60 * 1000;
  const digits = formatCountdownDigits(msValue);
  const dayCountdownText = formatDaysHoursCountdown(msValue);
  const primaryEntry = session.entries[0];
  const extraCount = session.entries.length - 1;
  const faculty = primaryEntry
    ? resolveSubjectIdentity(primaryEntry.subjectCode, subjectLegend).faculty
    : undefined;

  // Ring progress only means something for a session in progress — how
  // much of it has elapsed. There's no natural denominator for "starts
  // in", so the ring stays unfilled (decorative outline) in that case.
  const totalMs = session.end.getTime() - session.start.getTime();
  const ratio = isLive && totalMs > 0 ? 1 - state.msRemaining / totalMs : 0;

  const toneVar = isLive ? 'var(--color-accent)' : 'var(--color-accent-2)';
  const toneGlowRgb = isLive ? '232,163,61' : '79,182,168';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[20px]',
        'shadow-[0_0_0_1px_rgba(232,163,61,0.3)]',
        !isLive && 'shadow-[0_0_0_1px_rgba(79,182,168,0.3)]',
      )}
    >
      {/* Ambient drifting glow — subtle, slow (8-9s loops) so it reads as
          depth rather than a flashy effect. */}
      <div
        className="pointer-events-none absolute -top-20 -left-12 h-52 w-52 rounded-full blur-[8px]"
        style={{
          background: `radial-gradient(circle, rgba(${toneGlowRgb},0.28), transparent 65%)`,
          animation: 'nextclass-drift-a 8s ease-in-out infinite',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-10 -bottom-[70px] h-40 w-40 rounded-full blur-[8px]"
        style={{
          background: 'radial-gradient(circle, rgba(79,182,168,0.14), transparent 65%)',
          animation: 'nextclass-drift-b 9s ease-in-out infinite',
        }}
        aria-hidden
      />

      <div className="bg-surface/85 relative p-5 backdrop-blur-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          {isLive ? (
            <Badge tone="amber" className="gap-1.5">
              <Radio className="h-3 w-3 animate-pulse" aria-hidden /> Live now
            </Badge>
          ) : (
            <Badge tone="teal" className="gap-1.5">
              <ArrowRight className="h-3 w-3" aria-hidden />
              {state.kind === 'upcoming-today' ? 'Next up today' : 'Next class'}
            </Badge>
          )}
          <span className="text-muted text-sm">{sessionLabel(session.session)}</span>
          <span className="text-muted ml-auto flex items-center gap-1.5 text-xs">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
            {new Date(session.start).toLocaleDateString('en-IN', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-5 sm:mt-6">
          <div className="min-w-0">
            <p className="text-strong font-display text-3xl leading-none font-extrabold tracking-wide uppercase sm:text-4xl">
              {primaryEntry?.displayCode ?? 'Class'}
            </p>
            <div className="bg-background mt-2.5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5">
              <Clock className="text-accent-2 h-3.5 w-3.5" aria-hidden />
              <span className="text-strong text-sm font-bold tabular-nums">
                {formatTimeShort(session.start)} – {formatTimeShort(session.end)}
              </span>
            </div>
            {primaryEntry?.room && (
              <p className="text-muted mt-2.5 flex items-center gap-1.5 text-sm">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                Room {primaryEntry.room}
              </p>
            )}
            {faculty && <p className="text-muted mt-0.5 text-sm">{faculty}</p>}
            {extraCount > 0 && (
              <p className="text-muted mt-1 text-xs">
                +{extraCount} more offering{extraCount > 1 ? 's' : ''} in this slot
              </p>
            )}
          </div>

          {isDayScale ? (
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <span className="text-muted text-xs tracking-wide uppercase">
                {isLive ? 'Time remaining' : 'Starts in'}
              </span>
              <span
                className="font-display text-2xl font-bold tracking-wide sm:text-3xl"
                style={{ color: toneVar }}
              >
                {dayCountdownText}
              </span>
            </div>
          ) : (
            <CountdownRing digits={digits} ratio={ratio} isLive={isLive} toneVar={toneVar} label={isLive ? 'left' : 'starts in'} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes nextclass-drift-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, 15px) scale(1.1); }
        }
        @keyframes nextclass-drift-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-15px, -10px) scale(1.08); }
        }
        @keyframes nextclass-pulse-ring {
          0% { transform: scale(0.9); opacity: 0.8; }
          70% { transform: scale(1.4); opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

interface CountdownRingProps {
  digits: string;
  ratio: number;
  isLive: boolean;
  toneVar: string;
  label: string;
}

/** A circular countdown: filled arc = elapsed proportion when live, an
 *  unfilled decorative ring when counting down to a future start (there's
 *  no meaningful "percent" to show for that case). Animates in on mount. */
function CountdownRing({ digits, ratio, isLive, toneVar, label }: CountdownRingProps) {
  const size = 100;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useLayoutEffect(() => {
    const target = circumference * (1 - Math.min(1, Math.max(0, ratio)));
    const raf = requestAnimationFrame(() => setOffset(target));
    return () => cancelAnimationFrame(raf);
  }, [ratio, circumference]);

  return (
    <div className="relative h-[100px] w-[100px] shrink-0">
      {isLive && (
        <span
          className="absolute -inset-1.5 rounded-full"
          style={{
            background: 'rgba(232,163,61,0.12)',
            animation: 'nextclass-pulse-ring 2.4s 0.3s ease-out infinite',
          }}
          aria-hidden
        />
      )}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={toneVar}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-1">
        <span
          className={cn(
            'text-strong tabular-nums font-extrabold tracking-tight',
            digits.length > 5 ? 'text-sm' : 'text-lg',
          )}
        >
          {digits}
        </span>
        <span className="text-muted mt-0.5 text-[9px] tracking-wide uppercase">{label}</span>
      </div>
    </div>
  );
}
