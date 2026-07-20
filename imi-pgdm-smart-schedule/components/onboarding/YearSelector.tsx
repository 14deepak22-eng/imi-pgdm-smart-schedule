'use client';

import { CalendarSearch, GraduationCap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/shared/Skeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import type { BatchOption } from '@/lib/schedule/deriveAvailableBatches';

interface YearSelectorProps {
  availableBatches: BatchOption[];
  loading: boolean;
  error: string | null;
  onSelect: (batchPrefix: string) => void;
  onRetry: () => void;
}

export function YearSelector({
  availableBatches,
  loading,
  error,
  onSelect,
  onRetry,
}: YearSelectorProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" className="mb-1 h-14 w-14" />
          <p className="font-display text-2xl font-bold tracking-wide uppercase">
            IMI PGDM Smart Schedule
          </p>
          <p className="text-muted text-sm">Live class schedule, countdowns, and events</p>
        </div>

        <Card className="flex w-full flex-col gap-4 p-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-accent h-5 w-5" />
            <h1 className="font-display text-lg font-bold tracking-wide uppercase">
              Which year are you in?
            </h1>
          </div>
          <p className="text-muted -mt-2 text-sm">
            This tells the app which batch&apos;s schedule to show you. You can switch this anytime
            later from Settings.
          </p>

          {error && !loading && <ErrorState message={error} onRetry={onRetry} />}

          {loading && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          )}

          {!loading && !error && availableBatches.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CalendarSearch className="text-muted h-6 w-6" />
              <p className="text-sm font-medium">No batches found yet</p>
              <p className="text-muted text-xs">
                The schedule may still be loading, or the sheet might not have any recognizable
                batch rows.
              </p>
              <Button variant="outline" onClick={onRetry}>
                Try again
              </Button>
            </div>
          )}

          {!loading && !error && availableBatches.length > 0 && (
            <div className="flex flex-col gap-2">
              {availableBatches.map((option) => (
                <button
                  key={option.batchPrefix}
                  onClick={() => onSelect(option.batchPrefix)}
                  className="border-border bg-surface-2 hover:border-accent flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-left transition-colors"
                >
                  <span className="font-medium">{option.batchPrefix}</span>
                  <span className="bg-accent/15 text-accent rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase">
                    {option.yearLabel}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
