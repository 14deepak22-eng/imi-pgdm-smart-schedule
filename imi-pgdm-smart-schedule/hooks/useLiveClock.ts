'use client';

import { useEffect, useState } from 'react';

export interface LiveClock {
  now: Date;
  /** False until the first client-side tick — use to avoid rendering a
   * stale/placeholder time before hydration. */
  isReady: boolean;
}

/**
 * Returns the current time, updated every second. `now` is only meaningful
 * after mount (avoids SSR/client hydration mismatches from `new Date()`
 * differing between server render and client render).
 */
export function useLiveClock(): LiveClock {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    queueMicrotask(() => setNow(new Date()));
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return { now: now ?? new Date(), isReady: now !== null };
}
