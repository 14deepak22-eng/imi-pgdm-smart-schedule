'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

const AUTO_HIDE_SECONDS = 6; // Banner quietly disappears after 6s if the user doesn't interact.

export function InstallPrompt() {
  const { canShow, ios, promptInstall, dismiss } = useInstallPrompt();
  // Separate from `canShow` (which is the hook's per-day/per-week cooldown
  // decision) — this just controls whether THIS particular appearance is
  // still on screen, so the 6s auto-hide doesn't need to touch the cooldown
  // logic at all.
  const [visible, setVisible] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_HIDE_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAutoHide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!canShow) return;
    setVisible(true);
    setSecondsLeft(AUTO_HIDE_SECONDS);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearAutoHide();
          setVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearAutoHide;
  }, [canShow]);

  const handleInstall = () => {
    clearAutoHide(); // They interacted in time — let the install flow run uninterrupted.
    promptInstall();
  };

  const handleDismiss = () => {
    clearAutoHide();
    dismiss();
  };

  if (!canShow || !visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <Card className="flex w-full max-w-md items-start gap-3 p-4">
        <Download className="text-accent mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Install this app</p>
          {ios ? (
            <p className="text-muted mt-1 text-xs">
              Tap the Share icon, then &quot;Add to Home Screen&quot; for quick, full-screen access.
            </p>
          ) : (
            <p className="text-muted mt-1 text-xs">
              Add Smart Schedule to your home screen for quick, full-screen access.
            </p>
          )}
          {!ios && (
            <Button onClick={handleInstall} className="mt-3 w-full">
              Install ({secondsLeft}s)
            </Button>
          )}
        </div>
        <button onClick={handleDismiss} aria-label="Dismiss" className="text-muted hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </Card>
    </div>
  );
}
