'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pgdm-sheet-id-override';

// The default sheet ID baked in at build time (NEXT_PUBLIC_ vars are safe
// to read client-side). We stamp every saved override with this value so
// we can tell, later, whether the env-configured default has changed
// since the override was saved.
const CURRENT_DEFAULT_SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID ?? '';

interface StoredOverride {
  sheetId: string;
  /** The default sheet ID that was active at the moment this override was saved. */
  savedAgainstDefault: string;
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable — nothing to clear.
  }
}

/**
 * Reads the saved override, but only honors it if it was saved against the
 * *current* default sheet ID.
 *
 * - User saves a custom sheet → stamped with today's default → stays active
 *   as long as the env var doesn't change.
 * - Env var (NEXT_PUBLIC_SHEET_ID) changes → the stamp no longer matches →
 *   the override is treated as stale and dropped, so everyone picks up the
 *   new default automatically.
 * - If the user saves another custom sheet after that, it's stamped with
 *   the new default and persists until the *next* env change.
 */
function readStoredOverride(): string | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: StoredOverride | null = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Legacy format from before this versioning existed — just a bare
    // sheet ID string, with no record of which default it was set
    // against. We can't verify it's still valid, so treat it as stale.
    clearStorage();
    return null;
  }

  if (!parsed || typeof parsed.sheetId !== 'string') {
    clearStorage();
    return null;
  }

  if (parsed.savedAgainstDefault !== CURRENT_DEFAULT_SHEET_ID) {
    clearStorage();
    return null;
  }

  return parsed.sheetId;
}

export function useSheetSource(): [string | null, (id: string | null) => void, boolean] {
  const [sheetId, setSheetIdState] = useState<string | null>(null);
  // True once we've actually attempted the localStorage read below — lets
  // callers (useSheetData) hold off fetching until they know the *real*
  // override instead of racing ahead with null/default. See useSheetData's
  // `ready` param for why this matters.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setSheetIdState(readStoredOverride());
      setLoaded(true);
    });
  }, []);

  const setSheetId = (id: string | null) => {
    setSheetIdState(id);
    try {
      if (id) {
        const toStore: StoredOverride = {
          sheetId: id,
          savedAgainstDefault: CURRENT_DEFAULT_SHEET_ID,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Storage unavailable; override just won't persist across visits.
    }
  };

  return [sheetId, setSheetId, loaded];
}
