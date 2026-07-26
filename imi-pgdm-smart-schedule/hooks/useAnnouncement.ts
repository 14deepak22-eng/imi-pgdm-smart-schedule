'use client';

import { useEffect, useState } from 'react';
import { ANNOUNCEMENT } from '@/lib/announcement';

const STORAGE_KEY = 'pgdm-seen-announcement';

/**
 * Tracks whether the visitor has dismissed the CURRENT announcement
 * (keyed by ANNOUNCEMENT.id). Changing the id in lib/announcement.ts
 * makes it show again to everyone, even previous dismissers.
 */
export function useAnnouncement(): [boolean, () => void] {
  // Default true avoids a flash before we've checked localStorage.
  const [hasSeen, setHasSeen] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setHasSeen(localStorage.getItem(STORAGE_KEY) === ANNOUNCEMENT.id);
      } catch {
        // Storage unavailable — fail closed (never show it).
        setHasSeen(true);
      }
    });
  }, []);

  const markSeen = () => {
    setHasSeen(true);
    try {
      localStorage.setItem(STORAGE_KEY, ANNOUNCEMENT.id);
    } catch {
      // Storage unavailable; it just won't stay dismissed across visits.
    }
  };

  return [hasSeen, markSeen];
}
