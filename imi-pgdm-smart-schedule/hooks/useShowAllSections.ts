'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pgdm-show-all-sections';

// Defaults to true (all sections shown/combined) until the user explicitly
// chooses otherwise in Settings, at which point their choice is remembered.
export function useShowAllSections(): [boolean, (value: boolean) => void] {
  const [value, setValueState] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        // Only override the default if the user has previously made an
        // explicit choice — no stored value means "use the default".
        if (stored !== null) setValueState(stored === 'true');
      } catch {
        // Ignore — falls back to the default (all sections shown).
      }
    });
  }, []);

  const setValue = (next: boolean) => {
    setValueState(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Storage unavailable; setting just won't persist across visits.
    }
  };

  return [value, setValue];
}
