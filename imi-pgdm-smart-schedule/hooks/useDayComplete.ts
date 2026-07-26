'use client';

import { useEffect, useState } from 'react';
import type { ClassCountdownState } from './useCountdown';
import { toLocalISODate } from '@/lib/utils/date';

const STORAGE_KEY = 'pgdm-day-complete-celebrated-on';

function isDayOver(kind: ClassCountdownState['kind']): boolean {
  // "upcoming-future" means the next session isn't today anymore, and
  // "schedule-ended" means there's nothing left in the whole published
  // term — both mean "nothing left for today."
  return kind === 'upcoming-future' || kind === 'schedule-ended';
}

/**
 * Fires a one-time "day complete" celebration the moment today's last
 * class ends — but only on days that actually HAD at least one class
 * (skips holidays/no-class days), and only once per calendar day even
 * across refreshes, using a date-stamped localStorage flag.
 */
export function useDayComplete(
  current: ClassCountdownState,
  classesToday: number,
  now: Date,
): { show: boolean; dismiss: () => void } {
  const [show, setShow] = useState(false);
  const todayISO = toLocalISODate(now);

  useEffect(() => {
    if (!isDayOver(current.kind) || classesToday <= 0) return;

    queueMicrotask(() => {
      try {
        if (localStorage.getItem(STORAGE_KEY) === todayISO) return;
        localStorage.setItem(STORAGE_KEY, todayISO);
      } catch {
        // Storage unavailable — celebration just won't be deduped across visits.
      }
      setShow(true);
    });
  }, [current.kind, classesToday, todayISO]);

  const dismiss = () => setShow(false);

  return { show, dismiss };
}
