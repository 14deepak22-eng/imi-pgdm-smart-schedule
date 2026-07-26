'use client';

import { useEffect, useState } from 'react';
import { ANNOUNCEMENT } from '@/lib/announcement';

const STORAGE_KEY = 'pgdm-seen-announcement';

/**
 * Tracks whether the visitor has dismissed the CURRENT announcement
 * (keyed by ANNOUNCEMENT.id) DURING THIS VISIT.
 *
 * Uses sessionStorage (not localStorage), so:
 * - Clicking "Got it" hides the popup while they keep browsing the
 *   site in this tab (navigating between pages won't re-show it).
 * - Closing the tab/browser and coming back later (a new visit)
 *   clears sessionStorage, so the popup shows again.
 */
export function useAnnouncement(): [boolean, () => void] {
  // Default true avoids a flash before we've checked sessionStorage.
  const [hasSeen, setHasSeen] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setHasSeen(sessionStorage.getItem(STORAGE_KEY) === ANNOUNCEMENT.id);
      } catch {
        // Storage unavailable — fail closed (never show it).
        setHasSeen(true);
      }
    });
  }, []);

  const markSeen = () => {
    setHasSeen(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, ANNOUNCEMENT.id);
    } catch {
      // Storage unavailable; it just won't stay dismissed for the visit.
    }
  };

  return [hasSeen, markSeen];
}
