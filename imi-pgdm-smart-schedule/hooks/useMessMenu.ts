'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DayMessMenu } from '@/types/messMenu';

interface MessMenuApiSuccess {
  week: DayMessMenu[];
  fetchedAt: string;
}
interface MessMenuApiError {
  error: string;
}

export interface UseMessMenuResult {
  week: DayMessMenu[];
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  refresh: () => void;
}

// Matches the API route's own 30-minute cache — no point polling faster
// than the data can actually change.
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

export function useMessMenu(): UseMessMenuResult {
  const [week, setWeek] = useState<DayMessMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);

    try {
      const res = await fetch('/api/mess-menu', { cache: 'no-store' });
      const json = (await res.json()) as MessMenuApiSuccess | MessMenuApiError;

      if (!res.ok || 'error' in json) {
        throw new Error('error' in json ? json.error : 'Failed to load the mess menu');
      }

      setWeek(json.week);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong loading the mess menu');
    } finally {
      setLoading(false);
      setInitialLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
    const id = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  return { week, loading, initialLoading, error, refresh: load };
}
