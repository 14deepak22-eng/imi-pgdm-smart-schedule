'use client';

import { X, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useHasSeenWelcomeTip } from '@/hooks/useHasSeenWelcomeTip';

const STEPS = [
  {
    title: 'Open the website',
    text: 'Visit IMI PGDM Smart Schedule in your browser.',
  },
  {
    title: 'Select your Year',
    text: 'Choose your batch on the welcome screen.',
  },
  {
    title: 'Go to Settings',
    text: 'Tap Settings in the top menu.',
  },
  {
    title: 'Select your Subjects and Section',
    text: "Choose the subjects you're taking, and your section — or combine all sections into one view.",
  },
  {
    title: 'Return to the Dashboard',
    text: 'Head back to Board to see your personalized class schedule, timings, and next-class countdown.',
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

        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="text-accent h-5 w-5" />
          <h2
            id="welcome-tip-title"
            className="font-display text-lg font-bold tracking-wide uppercase"
          >
            How to Personalise
          </h2>
        </div>
        <p className="text-muted mb-5 text-sm">
          A quick, one-time walkthrough — five steps to a schedule that&apos;s yours.
        </p>

        <ol className="mb-6 flex flex-col gap-3.5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex items-start gap-3">
              <span className="bg-accent/15 text-accent tabular mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-muted text-xs">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <Button onClick={markSeen} className="w-full">
          Got it, thanks!
        </Button>
      </Card>
    </div>
  );
}
