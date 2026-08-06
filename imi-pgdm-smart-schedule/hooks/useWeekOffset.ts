'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pgdm-week-offset';

/**
 * Upper bound for how far ahead a person can navigate. Not arbitrary —
 * keeps "Next week" arrow-spamming from wandering into terms that don't
 * have data yet. Raise this if you'd like a higher ceiling.
 */
export const MAX_WEEK_OFFSET = 11;

export type WeekOffset = number;

function isValidOffset(value: number): value is WeekOffset {
  return Number.isInteger(value) && value >= 0 && value <= MAX_WEEK_OFFSET;
}

/** 0 = this week, 1 = next week, and so on. Persists across visits. */
export function useWeekOffset(): [WeekOffset, (value: WeekOffset) => void] {
  const [offset, setOffsetState] = useState<WeekOffset>(0);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = Number(localStorage.getItem(STORAGE_KEY));
        if (isValidOffset(stored)) setOffsetState(stored);
      } catch {
        // Ignore — falls back to this week.
      }
    });
  }, []);

  const setOffset = (value: WeekOffset) => {
    const clamped = Math.min(MAX_WEEK_OFFSET, Math.max(0, value));
    if (!isValidOffset(clamped)) return;
    setOffsetState(clamped);
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch {
      // Storage unavailable; preference just won't persist across visits.
    }
  };

  return [offset, setOffset];
}
