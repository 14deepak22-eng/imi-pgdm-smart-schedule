'use client';

import type { ReactNode } from 'react';
import { useSchedule } from '@/components/providers/ScheduleProvider';
import { YearSelector } from './YearSelector';

export function YearGate({ children }: { children: ReactNode }) {
  const { selectedBatch, availableBatches, initialLoading, error, refresh, selectBatch } =
    useSchedule();

  if (!selectedBatch) {
    return (
      <YearSelector
        availableBatches={availableBatches}
        loading={initialLoading}
        error={error}
        onSelect={selectBatch}
        onRetry={refresh}
      />
    );
  }

  return <>{children}</>;
}
