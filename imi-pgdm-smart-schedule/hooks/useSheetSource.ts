'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pgdm-sheet-id-override';

export function useSheetSource(): [string | null, (id: string | null) => void] {
  const [sheetId, setSheetIdState] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setSheetIdState(localStorage.getItem(STORAGE_KEY));
      } catch {
        // Ignore — falls back to the default (env-configured) sheet.
      }
    });
  }, []);

  const setSheetId = (id: string | null) => {
    setSheetIdState(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable; override just won't persist across visits.
    }
  };

  return [sheetId, setSheetId];
}
