'use client';

import { useMemo } from 'react';
import type { DaySchedule, TargetSection } from '@/types/timetable';
import type { ScheduleEvent } from '@/types/events';
import { useLiveClock } from './useLiveClock';
import {
  flattenSessions,
  getScheduleStatus,
  getNextEvent,
  type SessionInstance,
} from '@/lib/schedule/deriveSessions';

export type ClassCountdownState =
  | { kind: 'live-now'; session: SessionInstance; msRemaining: number }
  | { kind: 'upcoming-today'; session: SessionInstance; msUntilStart: number }
  | { kind: 'upcoming-future'; session: SessionInstance; msUntilStart: number }
  | { kind: 'schedule-ended' }
  | { kind: 'not-ready' };

export interface UseCountdownResult {
  now: Date;
  current: ClassCountdownState;
  nextEvent: { event: ScheduleEvent; msUntilStart: number } | null;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Combines the live clock with the parsed schedule to produce everything
 * the dashboard needs: what's live right now, what's next, and whether
 * that "next" thing is later today, tomorrow, or further out.
 */
export function useCountdown(
  days: DaySchedule[],
  events: ScheduleEvent[],
  section: TargetSection,
): UseCountdownResult {
  const { now, isReady } = useLiveClock();

  const sessions = useMemo(() => flattenSessions(days, section), [days, section]);

  const current: ClassCountdownState = useMemo(() => {
    if (!isReady) return { kind: 'not-ready' };

    const { current, next } = getScheduleStatus(sessions, now);

    if (current) {
      return {
        kind: 'live-now',
        session: current,
        msRemaining: current.end.getTime() - now.getTime(),
      };
    }

    if (next) {
      const isSameDay = startOfDay(next.start).getTime() === startOfDay(now).getTime();
      return {
        kind: isSameDay ? 'upcoming-today' : 'upcoming-future',
        session: next,
        msUntilStart: next.start.getTime() - now.getTime(),
      };
    }

    return { kind: 'schedule-ended' };
  }, [isReady, sessions, now]);

  const nextEvent = useMemo(() => {
    if (!isReady) return null;
    const event = getNextEvent(events, section, now);
    if (!event) return null;
    const eventStart = startOfDay(new Date(`${event.date}T00:00:00`));
    return { event, msUntilStart: eventStart.getTime() - startOfDay(now).getTime() };
  }, [isReady, events, section, now]);

  return { now, current, nextEvent };
}
