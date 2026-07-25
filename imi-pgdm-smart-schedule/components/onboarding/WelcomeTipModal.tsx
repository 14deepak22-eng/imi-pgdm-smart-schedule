'use client';

import { X, Sparkles, GraduationCap, Users, BookMarked, Bell, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useHasSeenWelcomeTip } from '@/hooks/useHasSeenWelcomeTip';

const TIPS = [
  {
    icon: GraduationCap,
    title: 'Pick your year',
    text: 'Switch between batches anytime from Settings if you picked the wrong one.',
  },
  {
    icon: Users,
    title: 'Choose your section',
    text: 'View just your own section, or combine A/B/C into one merged view.',
  },
  {
    icon: BookMarked,
    title: 'Select your subjects',
    text: 'Go to Settings and choose your subjects. Your Dashboard will automatically display only the schedule for your selected subjects.',
},
  {
    icon: Bell,
    title: 'Check Notices',
    text: 'Any change to the schedule shows up there automatically for a week.',
  },
  {
    icon: Link2,
    title: 'Change the sheet source',
    text: 'Point the app at a different Google Sheet anytime, no redeploy needed.',
  },
];

export function WelcomeTipModal() {
  const [hasSeen, markSeen] = useHasSeenWelcomeTip();

  if (hasSeen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-tip-title"
    >
      <Card className="relative w-full max-w-md p-6">
        <button
          onClick={markSeen}
          aria-label="Close"
          className="text-muted hover:text-foreground absolute top-4 right-4"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="text-accent h-5 w-5" />
          <h2
            id="welcome-tip-title"
            className="font-display text-lg font-bold tracking-wide uppercase"
          >
            How To Personalize
          </h2>
        </div>

        <p className="text-muted mb-5 text-sm">
          A few things you can personalize from Settings, so the board only shows what matters to
          you:
        </p>

        <ul className="mb-6 flex flex-col gap-3.5">
          {TIPS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <div className="bg-surface-2 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                <Icon className="text-accent-2 h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-muted text-xs">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        <Button onClick={markSeen} className="w-full">
          Got it, thanks!
        </Button>
      </Card>
    </div>
  );
}
