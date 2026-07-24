'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pgdm-weeks-to-show';

/**
 * Upper bound for how many weeks can be shown at once. Not arbitrary —
 * each week renders a full table, so this keeps the page from becoming
 * unreasonably long while still covering a full term's look-ahead.
 * Raise this if you'd like a higher ceiling.
 */
export const MAX_WEEKS_TO_SHOW = 12;

export type WeeksToShow = number;

function isValidWeeks(value: number): value is WeeksToShow {
  return Number.isInteger(value) && value >= 1 && value <= MAX_WEEKS_TO_SHOW;
}

export function useWeeksToShow(): [WeeksToShow, (value: WeeksToShow) => void] {
  const [weeks, setWeeksState] = useState<WeeksToShow>(1);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = Number(localStorage.getItem(STORAGE_KEY));
        if (isValidWeeks(stored)) setWeeksState(stored);
      } catch {
        // Ignore — falls back to showing 1 week.
      }
    });
  }, []);

  const setWeeks = (value: WeeksToShow) => {
    if (!isValidWeeks(value)) return;
    setWeeksState(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // Storage unavailable; preference just won't persist across visits.
    }
  };

  return [weeks, setWeeks];
}
