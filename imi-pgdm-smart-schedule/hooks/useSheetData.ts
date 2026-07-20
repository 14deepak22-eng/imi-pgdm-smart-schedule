'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DaySchedule } from '@/types/timetable';
import type { ScheduleEvent } from '@/types/events';

interface SheetApiSuccess {
  classes: DaySchedule[];
  events: ScheduleEvent[];
  fetchedAt: string;
}
interface SheetApiError {
  error: string;
}

export interface UseSheetDataResult {
  classes: DaySchedule[];
  events: ScheduleEvent[];
  loading: boolean;
  /** True only on the very first load, before any data has ever arrived. */
  initialLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

const REFRESH_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_REFRESH_INTERVAL_MS ?? 300_000);

/**
 * @param sheetIdOverride When set, fetches from this Sheet ID instead of the
 * server's default env-configured sheet (see Settings > Sheet source).
 */
export function useSheetData(sheetIdOverride?: string | null): UseSheetDataResult {
  const [classes, setClasses] = useState<DaySchedule[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);

    try {
      const url = sheetIdOverride
        ? `/api/sheet?sheetId=${encodeURIComponent(sheetIdOverride)}`
        : '/api/sheet';
      const res = await fetch(url, { cache: 'no-store' });
      const json = (await res.json()) as SheetApiSuccess | SheetApiError;

      if (!res.ok || 'error' in json) {
        throw new Error('error' in json ? json.error : 'Failed to load timetable data');
      }

      setClasses(json.classes);
      setEvents(json.events);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong loading the timetable');
    } finally {
      setLoading(false);
      setInitialLoading(false);
      inFlight.current = false;
    }
  }, [sheetIdOverride]);

  useEffect(() => {
    // Deferred via queueMicrotask so the effect body itself stays
    // synchronous (satisfies react-hooks/set-state-in-effect); the actual
    // setState calls happen inside load()'s own async continuation either way.
    queueMicrotask(load);
    const id = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  return { classes, events, loading, initialLoading, error, lastUpdated, refresh: load };
}
