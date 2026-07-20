'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pgdm-selected-batch';

/**
 * `null` means no batch has been chosen yet — this is what triggers the
 * "Which year are you in?" onboarding screen (see YearGate).
 */
export function useSelectedBatch(): [string | null, (batch: string | null) => void] {
  const [batch, setBatchState] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setBatchState(localStorage.getItem(STORAGE_KEY));
      } catch {
        // Ignore — falls back to no batch selected (triggers onboarding).
      }
    });
  }, []);

  const setBatch = (value: string | null) => {
    setBatchState(value);
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable; selection just won't persist across visits.
    }
  };

  return [batch, setBatch];
}
