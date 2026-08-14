'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pgdm-sheet-id-override';

export function useSheetSource(): [string | null, (id: string | null) => void, boolean] {
  const [sheetId, setSheetIdState] = useState<string | null>(null);
  // True once we've actually attempted the localStorage read below — lets
  // callers (useSheetData) hold off fetching until they know the *real*
  // override instead of racing ahead with null/default. See useSheetData's
  // `ready` param for why this matters.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setSheetIdState(localStorage.getItem(STORAGE_KEY));
      } catch {
        // Ignore — falls back to the default (env-configured) sheet.
      } finally {
        setLoaded(true);
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

  return [sheetId, setSheetId, loaded];
}
