'use client';

import { X, Megaphone } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAnnouncement } from '@/hooks/useAnnouncement';
import { ANNOUNCEMENT } from '@/lib/announcement';

function isWithinWindow(): boolean {
  const now = Date.now();
  if (ANNOUNCEMENT.startAt && now < new Date(ANNOUNCEMENT.startAt).getTime()) return false;
  if (ANNOUNCEMENT.endAt && now > new Date(ANNOUNCEMENT.endAt).getTime()) return false;
  return true;
}

export function AnnouncementModal() {
  const [hasSeen, markSeen] = useAnnouncement();

  if (!ANNOUNCEMENT.enabled || hasSeen || !isWithinWindow()) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-title"
    >
      <Card className="relative w-full max-w-md p-6">
        <button
          onClick={markSeen}
          aria-label="Close"
          className="text-muted hover:text-foreground absolute top-4 right-4"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-2 flex items-center gap-2">
          <Megaphone className="text-accent h-5 w-5" />
          <h2
            id="announcement-title"
            className="font-display text-lg font-bold tracking-wide uppercase"
          >
            {ANNOUNCEMENT.title}
          </h2>
        </div>

        <p className="text-muted mb-6 text-sm">{ANNOUNCEMENT.message}</p>

        <Button onClick={markSeen} className="w-full">
          Got it
        </Button>
      </Card>
    </div>
  );
}
