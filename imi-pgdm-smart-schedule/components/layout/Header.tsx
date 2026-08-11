'use client';

import { RefreshCw } from 'lucide-react';
import { useLiveClock } from '@/hooks/useLiveClock';
import { useSchedule } from '@/components/providers/ScheduleProvider';
import { formatClockTime, formatFullDate } from '@/lib/utils/date';
import { CREATOR_CREDIT } from '@/lib/sheet/constants';
import { Nav } from './Nav';
import { SectionSwitcher } from './SectionSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { SettingsMenu } from '@/components/shared/SettingsMenu';
import { MessMenuButton } from '@/components/shared/MessMenuButton';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

export function Header() {
  const { now, isReady } = useLiveClock();
  const { section, setSection, refresh, loading, showAllSections, selectedBatch } = useSchedule();

  return (
    <header className="border-border bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-1.5 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <p className="font-display truncate text-[15px] leading-none font-bold tracking-wide uppercase sm:text-xl">
              IMI PGDM Smart Schedule
            </p>
            {/* Mobile: subtitle + credit collapsed into one truncating line to save a row */}
            <p className="text-muted mt-1 truncate text-[10px] sm:hidden">
              {selectedBatch ?? 'Session Board'} ·{' '}
              {showAllSections ? 'All Sections' : 'Sections A/B/C'} ·{' '}
              <span className="text-accent/80 font-medium">{CREATOR_CREDIT}</span>
            </p>
            <p className="text-muted hidden text-xs sm:block">
              {selectedBatch ?? 'Session Board'} ·{' '}
              {showAllSections ? 'All Sections' : 'Sections A/B/C'}
            </p>
            <p className="text-accent/80 mt-0.5 hidden text-[11px] font-medium sm:block">
              {CREATOR_CREDIT}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:hidden">
            <SettingsMenu />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-nowrap items-center gap-1.5 sm:flex-wrap sm:gap-4">
          <div className="min-w-0 flex-1 sm:min-w-fit sm:flex-none">
            <Nav />
          </div>

          <div className="tabular hidden text-right font-mono sm:block">
            <p className="text-sm leading-none">{isReady ? formatClockTime(now) : '--:--:--'}</p>
            <p className="text-muted mt-1 text-[11px] leading-none">
              {isReady ? formatFullDate(now) : ' '}
            </p>
          </div>

          <SectionSwitcher value={section} onChange={setSection} disabled={showAllSections} />

          <Button
            variant="outline"
            className="h-7 w-7 shrink-0 p-0 sm:h-9 sm:w-9"
            onClick={refresh}
            aria-label="Refresh schedule"
            disabled={loading}
          >
            <RefreshCw className={cn('h-3 w-3 sm:h-4 sm:w-4', loading && 'animate-spin')} />
          </Button>

          <div className="hidden items-center gap-1 sm:flex">
            <SettingsMenu />
            <ThemeToggle />
          </div>

          <div className="shrink-0">
            <MessMenuButton />
          </div>
        </div>
      </div>
    </header>
  );
}
