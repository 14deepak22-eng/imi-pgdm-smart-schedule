'use client';

import { useLayoutEffect, useState } from 'react';
import { Radio, ArrowRight, CalendarClock, CalendarX, Clock, MapPin } from 'lucide-react';
import type { ClassCountdownState } from '@/hooks/useCountdown';
import type { SubjectLegendEntry } from '@/lib/sheet/parseSubjectNames';
import { resolveSubjectIdentity } from '@/lib/sheet/resolveSubjectIdentity';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCountdownDigits, formatDaysHoursCountdown } from '@/lib/utils/date';
import { Skeleton } from '@/components/shared/Skeleton';
import { cn } from '@/lib/utils/cn';

// Scoped to just this "starts in" ring, per explicit request — not a
// site-wide token, so it doesn't touch the rest of the app's palette.
const STARTS_IN_BLUE = '#2e7dfa';

/** Midnight of the given date's day — used as the fallback anchor when
 *  there's no previous class (e.g. the very first session of the day). */
function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

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

  // Ring progress: for a session in progress, it's how much of the
  // session has elapsed (unchanged).
  //
  // For "starts in", the total wait is anchored to a real, fixed point
  // on the schedule — the moment the previous class actually ended —
  // not to whenever this device happened to load the page. That anchor
  // is computed fresh every render from the schedule data (via
  // `previousEnd`, passed down from useCountdown), so the ring shows the
  // exact same fill % on every device at any given moment, and starts
  // moving the instant the prior class's period ends, not whenever
  // someone next opens the site. If there's no previous class (this is
  // the very first session of the day), start-of-day is used instead so
  // the ring still has a sensible reference point.
  const totalMs = session.end.getTime() - session.start.getTime();

  let ratio = 0;
  if (isLive) {
    ratio = totalMs > 0 ? 1 - state.msRemaining / totalMs : 0;
  } else {
    const anchor = state.previousEnd ?? startOfDay(session.start);
    const startingTotal = session.start.getTime() - anchor.getTime();
    ratio = startingTotal > 0 ? 1 - msValue / startingTotal : 0;
  }

  const toneVar = isLive ? 'var(--color-accent)' : STARTS_IN_BLUE;
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
        <div className="flex flex-wrap items-center gap-2.5">
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
          <span className="text-strong flex items-center gap-1.5 text-sm font-semibold tabular-nums">
            <Clock className="text-accent-2 h-3.5 w-3.5 shrink-0" aria-hidden />
            {formatTimeShort(session.start)}&ndash;{formatTimeShort(session.end)}
          </span>
          <span className="text-muted ml-auto flex items-center gap-1.5 text-xs">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
            {new Date(session.start).toLocaleDateString('en-IN', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:mt-4">
          <div className="min-w-0">
            <p className="text-strong font-display text-2xl leading-tight font-extrabold tracking-wide uppercase sm:text-3xl">
              {primaryEntry?.displayCode ?? 'Class'}
            </p>
            {primaryEntry?.room && (
              <p className="text-muted mt-2 flex items-center gap-1.5 text-sm">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Room {primaryEntry.room}
              </p>
            )}
            {faculty && (
              <p className="text-muted mt-0.5 line-clamp-2 text-sm" title={faculty}>
                {faculty}
              </p>
            )}
            {extraCount > 0 && (
              <p className="text-muted mt-1 text-xs">
                +{extraCount} more offering{extraCount > 1 ? 's' : ''} in this slot
              </p>
            )}
          </div>

          {isDayScale ? (
            <div className="flex flex-col items-end gap-0.5 pt-1">
              <span className="text-muted text-[10px] tracking-wide uppercase">
                {isLive ? 'Time remaining' : 'Starts in'}
              </span>
              <span
                className="font-display text-lg leading-tight font-bold tracking-wide whitespace-nowrap sm:text-xl"
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
        @keyframes nextclass-wave-pulse {
          0%   { transform: scale(0.72); opacity: 0; }
          12%  { opacity: 0.45; }
          55%  { opacity: 0.18; }
          100% { transform: scale(2.05); opacity: 0; }
        }
        @keyframes nextclass-halo-breathe {
          0%, 100% { opacity: 0.35; transform: scale(0.94); }
          50% { opacity: 0.6; transform: scale(1.04); }
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
 *  no meaningful "percent" to show for that case). Animates in on mount.
 *  Sized via the wrapper's height/width classes so it can shrink on
 *  narrow phones — the SVG itself scales to fill whatever box it's given.
 */
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
    <div className="relative h-20 w-20 shrink-0 sm:h-[100px] sm:w-[100px]">
      {isLive && (
        <>
          {[0, 0.9, 1.8].map((delay) => (
            <span
              key={delay}
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, transparent 58%, rgba(232,163,61,0.55) 64%, rgba(232,163,61,0.12) 72%, transparent 82%)',
                filter: 'blur(1.5px)',
                animation: `nextclass-wave-pulse 2.7s cubic-bezier(0.22, 0.61, 0.36, 1) ${delay}s infinite`,
              }}
              aria-hidden
            />
          ))}
          <span
            className="absolute -inset-1 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(232,163,61,0.16) 0%, transparent 70%)',
              animation: 'nextclass-halo-breathe 2.7s ease-in-out infinite',
            }}
            aria-hidden
          />
        </>
      )}
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="relative -rotate-90">
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
            digits.length > 5 ? 'text-xs sm:text-sm' : 'text-base sm:text-lg',
          )}
        >
          {digits}
        </span>
        <span className="text-muted mt-0.5 text-[8px] tracking-wide uppercase sm:text-[9px]">{label}</span>
      </div>
    </div>
  );
}
