'use client';

import { RefreshCw } from 'lucide-react';
import { useLiveClock } from '@/hooks/useLiveClock';
import { useSchedule } from '@/components/providers/ScheduleProvider';
import { formatClockTime, formatFullDate } from '@/lib/utils/date';
import { CREATOR_CREDIT } from '@/lib/sheet/constants';
import { Nav } from './Nav';
import { SectionSwitcher } from './SectionSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

export function Header() {
  const { now, isReady } = useLiveClock();
  const { section, setSection, refresh, loading, showAllSections, selectedBatch } = useSchedule();

  return (
    <header className="border-border bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-xl leading-none font-bold tracking-wide uppercase">
              IMI PGDM Smart Schedule
            </p>
            <p className="text-muted text-xs">
              {selectedBatch ?? 'Session Board'} ·{' '}
              {showAllSections ? 'All Sections' : 'Sections A/B/C'}
            </p>
            <p className="text-accent/80 mt-0.5 text-[11px] font-medium">{CREATOR_CREDIT}</p>
          </div>
          <div className="sm:hidden">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Nav />

          <div className="tabular hidden text-right font-mono sm:block">
            <p className="text-sm leading-none">{isReady ? formatClockTime(now) : '--:--:--'}</p>
            <p className="text-muted mt-1 text-[11px] leading-none">
              {isReady ? formatFullDate(now) : ' '}
            </p>
          </div>

          <SectionSwitcher value={section} onChange={setSection} disabled={showAllSections} />

          <Button
            variant="outline"
            className="h-9 w-9 p-0"
            onClick={refresh}
            aria-label="Refresh schedule"
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
