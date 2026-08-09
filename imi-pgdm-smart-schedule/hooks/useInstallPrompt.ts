'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pgdm-install-dismissed-at';
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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

function isWithinCooldown(): boolean {
  try {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (!dismissedAt) return false;
    return Date.now() - Number(dismissedAt) < COOLDOWN_MS;
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
      setAlreadyInstalled(isStandalone());
      setIos(isIos());
      setDismissed(isWithinCooldown());
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
  // last 7 days, and either Chrome/Android/Desktop gave us a real install
  // prompt, or it's iOS (which needs manual "Add to Home Screen" instructions).
  const canShow = !alreadyInstalled && !dismissed && (Boolean(deferredPrompt) || ios);

  return { canShow, ios, alreadyInstalled, promptInstall, dismiss };
}
