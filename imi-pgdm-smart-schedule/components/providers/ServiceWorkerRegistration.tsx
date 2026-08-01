'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    // The service worker itself already updates aggressively (skipWaiting +
    // clients.claim), but browsers don't reload an already-open tab just
    // because a new worker took control — the tab keeps showing whatever
    // was already loaded. This closes that gap: the moment a new version
    // takes over, reload once automatically so visitors who already had
    // the site open actually see the update, instead of only new tabs.
    let hasReloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hasReloaded) return;
      hasReloaded = true;
      window.location.reload();
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Offline support just won't be available — not worth surfacing to the user.
      });
    });
  }, []);

  return null;
}
