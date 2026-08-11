'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CalendarClock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { CREATOR_CREDIT } from '@/lib/sheet/constants';

interface AboutModalProps {
  onClose: () => void;
}

const APP_NAME = 'IMI PGDM Smart Schedule';
const APP_DESCRIPTION =
  'Live class schedules, next-class countdowns, events, notices, and mess menu for IMI Bhubaneswar PGDM batches - auto-synced from the master Google Sheet.';

export function AboutModal({ onClose }: AboutModalProps) {
  // Portals need the DOM, which only exists client-side after mount —
  // this also doubles as the guard that stops the modal from ever
  // rendering during SSR.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-16 sm:pt-24"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-app-title"
      onClick={onClose}
    >
      <Card
        className="relative w-full max-w-sm p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-muted hover:text-foreground absolute top-4 right-4"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-accent bg-accent/10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2">
          <CalendarClock className="text-accent h-7 w-7" aria-hidden />
        </div>

        <h2
          id="about-app-title"
          className="font-display mt-4 text-lg leading-tight font-bold tracking-wide uppercase"
        >
          {APP_NAME}
        </h2>
        <p className="text-muted mt-2 text-sm leading-relaxed">{APP_DESCRIPTION}</p>

        <div className="border-border mt-5 border-t pt-4">
          <p className="text-accent/80 text-xs font-medium">{CREATOR_CREDIT}</p>
          <a
            href="https://www.linkedin.com/in/deepak-kumar-dk14"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-accent mt-1 inline-block text-xs underline underline-offset-2"
          >
            Connect on LinkedIn
          </a>
        </div>
      </Card>
    </div>,
    document.body,
  );
}
