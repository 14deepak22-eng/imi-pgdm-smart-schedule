'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Settings, UtensilsCrossed, Download, Info, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { MessMenuModal } from './MessMenuModal';
import { AboutModal } from './AboutModal';

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const [showMessMenu, setShowMessMenu] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { alreadyInstalled, ios, promptInstall, hasNativePrompt } = useInstallPrompt();
  const needsManualAndroidSteps = !alreadyInstalled && !ios && !hasNativePrompt;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleDownloadClick = () => {
    if (alreadyInstalled) return;
    if (hasNativePrompt && !ios) {
      void promptInstall();
      setOpen(false);
      return;
    }
    // No real one-tap install available right now — keep the menu open
    // and show manual steps below instead of silently closing.
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors',
          'bg-transparent text-white hover:bg-surface-2',
          'focus-visible:ring-accent focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        )}
      >
        <Settings
          className="h-6 w-6"
          strokeWidth={1.75}
          style={{
            animation: 'settings-gear-spin 6s linear infinite',
            filter:
              'drop-shadow(0 0 6px rgba(46,125,250,1)) drop-shadow(0 0 14px rgba(46,125,250,0.75)) drop-shadow(0 0 22px rgba(46,125,250,0.4))',
          }}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="border-border bg-surface animate-in fade-in zoom-in-95 absolute top-full right-0 z-50 mt-2 w-56 origin-top-right rounded-lg border-2 p-1.5 shadow-[4px_4px_0_0_var(--color-surface-2)] duration-100"
        >
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="text-foreground hover:bg-surface-2 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors"
          >
            <Settings className="text-muted h-4 w-4 shrink-0" aria-hidden />
            Settings
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setShowMessMenu(true);
              setOpen(false);
            }}
            className="text-foreground hover:bg-surface-2 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors"
          >
            <UtensilsCrossed className="text-muted h-4 w-4 shrink-0" aria-hidden />
            Mess Menu
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleDownloadClick}
            disabled={alreadyInstalled}
            className="text-foreground hover:bg-surface-2 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
          >
            {alreadyInstalled ? (
              <Check className="text-accent-2 h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <Download className="text-muted h-4 w-4 shrink-0" aria-hidden />
            )}
            {alreadyInstalled ? 'App installed' : 'Download App'}
          </button>
          {open && !alreadyInstalled && ios && (
            <p className="text-muted px-2.5 pb-1.5 text-[11px] leading-snug">
              Tap Share, then &quot;Add to Home Screen&quot;.
            </p>
          )}
          {open && needsManualAndroidSteps && (
            <p className="text-muted px-2.5 pb-1.5 text-[11px] leading-snug">
              Tap the ⋮ menu (top-right in Chrome), then &quot;Install app&quot;.
            </p>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setShowAbout(true);
              setOpen(false);
            }}
            className="text-foreground hover:bg-surface-2 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors"
          >
            <Info className="text-muted h-4 w-4 shrink-0" aria-hidden />
            About the App
          </button>
        </div>
      )}

      {showMessMenu && <MessMenuModal onClose={() => setShowMessMenu(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      <style>{`
        @keyframes settings-gear-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
