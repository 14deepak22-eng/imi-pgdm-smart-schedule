'use client';

import { Download, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export function InstallPrompt() {
  const { canShow, ios, promptInstall, dismiss } = useInstallPrompt();

  if (!canShow) return null;

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
            <Button onClick={promptInstall} className="mt-3 w-full">
              Install
            </Button>
          )}
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="text-muted hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </Card>
    </div>
  );
}
