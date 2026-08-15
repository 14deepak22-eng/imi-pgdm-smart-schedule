'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pgdm-install-dismissed-at';
const COOLDOWN_MS_DEFAULT = 1 * 24 * 60 * 60 * 1000; // 1 day — Android/desktop (real install prompt)
const COOLDOWN_MS_IOS = 7 * 24 * 60 * 60 * 1000; // 7 days — iOS (manual "Add to Home Screen" only)

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari-specific flag for installed home-screen apps.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isWithinCooldown(cooldownMs: number): boolean {
  try {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (!dismissedAt) return false;
    return Date.now() - Number(dismissedAt) < cooldownMs;
  } catch {
    return false;
  }
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true); // default true avoids a flash
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const onIos = isIos();
      setAlreadyInstalled(isStandalone());
      setIos(onIos);
      setDismissed(isWithinCooldown(onIos ? COOLDOWN_MS_IOS : COOLDOWN_MS_DEFAULT));
    });

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Storage unavailable; banner just won't stay dismissed across visits.
    }
  };

  // Show the banner if: not already installed, not dismissed within the
  // cooldown (7 days on iOS, 1 day elsewhere), and either Chrome/Android/
  // Desktop gave us a real install prompt, or it's iOS (which needs manual
  // "Add to Home Screen" instructions).
  const canShow = !alreadyInstalled && !dismissed && (Boolean(deferredPrompt) || ios);

  // The moment the banner is actually about to be shown, immediately start
  // its cooldown — same as if the person had dismissed it. Without this,
  // someone who never taps the close button (just reopens the app a few
  // times that day) would see the banner on every single open instead of
  // just once per cooldown window.
  useEffect(() => {
    if (!canShow) return;
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Storage unavailable; banner may reappear more often than intended.
    }
  }, [canShow]);

  return { canShow, ios, alreadyInstalled, promptInstall, dismiss };
}
