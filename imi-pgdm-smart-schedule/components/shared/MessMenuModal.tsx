'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, Coffee, UtensilsCrossed, Cookie, Moon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/shared/ErrorState';
import { Skeleton } from '@/components/shared/Skeleton';
import { useMessMenu } from '@/hooks/useMessMenu';
import { cn } from '@/lib/utils/cn';
import { MessMenuIcon } from './MessMenuIcon';

interface MealBlockProps {
  label: string;
  icon: ReactNode;
  items: string[];
  compact?: boolean;
}

function MealBlock({ label, icon, items, compact }: MealBlockProps) {
  return (
    <div>
      <div className="text-muted mb-1 flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase">
        {icon}
        {label}
      </div>
      <p className={cn('text-foreground leading-snug', compact ? 'text-xs' : 'text-sm')}>
        {items.length > 0 ? items.join(', ') : '—'}
      </p>
    </div>
  );
}

interface MessMenuModalProps {
  onClose: () => void;
}

export function MessMenuModal({ onClose }: MessMenuModalProps) {
  // Portals need the DOM, which only exists client-side after mount —
  // this also doubles as the guard that stops the modal from ever
  // rendering during SSR.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Lock background scroll while the modal is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const { week, initialLoading, error, refresh } = useMessMenu();
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const today = week.find((d) => d.day === todayName);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-16 sm:pt-24"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mess-menu-title"
      onClick={onClose}
    >
      <Card
        className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-muted hover:text-foreground absolute top-4 right-4"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-2">
          <MessMenuIcon className="text-accent h-5 w-5" />
          <h2 id="mess-menu-title" className="font-display text-lg font-bold tracking-wide uppercase">
            Mess Menu
          </h2>
        </div>

        {initialLoading && (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {!initialLoading && error && <ErrorState message={error} onRetry={refresh} />}

        {!initialLoading && !error && (
          <>
            {today && (
              <section className="mb-6">
                <p className="text-accent mb-2 text-xs font-bold tracking-wide uppercase">
                  Today · {today.day}
                </p>
                <div className="border-accent/30 bg-accent/5 grid grid-cols-1 gap-4 rounded-lg border-2 p-4 sm:grid-cols-2">
                  <MealBlock label="Breakfast" icon={<Coffee className="h-3.5 w-3.5" />} items={today.breakfast} />
                  <MealBlock label="Lunch" icon={<UtensilsCrossed className="h-3.5 w-3.5" />} items={today.lunch} />
                  <MealBlock label="Snacks" icon={<Cookie className="h-3.5 w-3.5" />} items={today.snacks} />
                  <MealBlock label="Dinner" icon={<Moon className="h-3.5 w-3.5" />} items={today.dinner} />
                </div>
              </section>
            )}

            {week.length > 0 && (
              <section>
                <p className="text-muted mb-2 text-xs font-bold tracking-wide uppercase">This Week</p>
                <div className="space-y-3">
                  {week.map((d) => (
                    <div
                      key={d.day}
                      className={cn(
                        'border-border rounded-lg border-2 p-3',
                        d.day === todayName && 'border-accent/40 bg-accent/5',
                      )}
                    >
                      <p className="mb-2 text-sm font-bold">{d.day}</p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <MealBlock compact label="Breakfast" icon={<Coffee className="h-3 w-3" />} items={d.breakfast} />
                        <MealBlock compact label="Lunch" icon={<UtensilsCrossed className="h-3 w-3" />} items={d.lunch} />
                        <MealBlock compact label="Snacks" icon={<Cookie className="h-3 w-3" />} items={d.snacks} />
                        <MealBlock compact label="Dinner" icon={<Moon className="h-3 w-3" />} items={d.dinner} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {week.length === 0 && (
              <p className="text-muted py-8 text-center text-sm">No mess menu data found.</p>
            )}
          </>
        )}
      </Card>
    </div>,
    document.body,
  );
}
