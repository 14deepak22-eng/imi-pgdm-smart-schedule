'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pgdm-seen-welcome-tip';

/**
 * Tracks whether the user has ever dismissed the one-time "how to
 * personalize" popup. Once dismissed, `hasSeen` stays true permanently
 * (no toggle back) — the popup is meant to show exactly once per
 * browser, ever, not once per session.
 */
export function useHasSeenWelcomeTip(): [boolean, () => void] {
  const [hasSeen, setHasSeen] = useState(true); // default true avoids a flash before we've checked

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setHasSeen(localStorage.getItem(STORAGE_KEY) === 'true');
      } catch {
        // Storage unavailable — treat as already seen so we fail closed
        // (never show it) rather than risk showing it every visit.
        setHasSeen(true);
      }
    });
  }, []);

  const markSeen = () => {
    setHasSeen(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Storage unavailable; it just won't stay dismissed across visits.
    }
  };

  return [hasSeen, markSeen];
}
