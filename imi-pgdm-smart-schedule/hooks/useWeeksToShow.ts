'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pgdm-weeks-to-show';
const VALID_VALUES = [1, 2, 3, 4] as const;
export type WeeksToShow = (typeof VALID_VALUES)[number];

function isValidWeeks(value: number): value is WeeksToShow {
  return (VALID_VALUES as readonly number[]).includes(value);
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
    setWeeksState(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // Storage unavailable; preference just won't persist across visits.
    }
  };

  return [weeks, setWeeks];
}
