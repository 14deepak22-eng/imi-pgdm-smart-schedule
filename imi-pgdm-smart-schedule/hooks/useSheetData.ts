"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DaySchedule } from "@/types/timetable";
import type { ScheduleEvent } from "@/types/events";
import type { SubjectLegendEntry } from "@/lib/sheet/parseSubjectNames";

interface SheetApiSuccess {
  classes: DaySchedule[];
  events: ScheduleEvent[];
  /** Subject code → {name, faculty}, auto-fetched from the sheet's legend tab. Empty if unavailable. */
  subjectLegend: Record<string, SubjectLegendEntry>;
  fetchedAt: string;
}
interface SheetApiError {
  error: string;
}

export interface UseSheetDataResult {
  classes: DaySchedule[];
  events: ScheduleEvent[];
  /** Subject code → {name, faculty}, auto-fetched from the sheet's legend tab. Empty until loaded, or if the sheet has no legend tab. */
  subjectLegend: Record<string, SubjectLegendEntry>;
  loading: boolean;
  /** True only on the very first load, before any data has ever arrived. */
  initialLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  /**
   * The server's own fetch timestamp (ISO string), shared by every visitor
   * who hits the same cached API response. Use this (not each browser's own
   * clock) anywhere a timestamp needs to look identical across users —
   * e.g. change notices — since it doesn't depend on when any one person
   * happened to refresh.
   */
  serverFetchedAt: string | null;
  refresh: () => void;
}

const REFRESH_INTERVAL_MS = Number(
  process.env.NEXT_PUBLIC_REFRESH_INTERVAL_MS ?? 300_000,
);

/**
 * @param sheetIdOverride When set, fetches from this Sheet ID instead of the
 * server's default env-configured sheet (see Settings > Sheet source).
 * @param ready Pass `false` while the caller is still figuring out the real
 * sheetIdOverride (e.g. reading it from localStorage on mount). No fetch is
 * made until this is `true` — otherwise this hook fires an initial fetch
 * with a not-yet-known override (usually `null`/default), and by the time
 * the real override arrives moments later the first fetch may still be
 * in-flight, which causes the corrected fetch to be silently skipped (see
 * the inFlight guard below) until the next interval tick or manual refresh.
 */
export function useSheetData(
  sheetIdOverride?: string | null,
  ready: boolean = true,
): UseSheetDataResult {
  const [classes, setClasses] = useState<DaySchedule[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [subjectLegend, setSubjectLegend] = useState
    Record<string, SubjectLegendEntry>
  >({});
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [serverFetchedAt, setServerFetchedAt] = useState<string | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);

    try {
      const url = sheetIdOverride
        ? `/api/sheet?sheetId=${encodeURIComponent(sheetIdOverride)}`
        : "/api/sheet";
      const res = await fetch(url, { cache: "no-store" });
      const json = (await res.json()) as SheetApiSuccess | SheetApiError;

      if (!res.ok || "error" in json) {
        throw new Error(
          "error" in json ? json.error : "Failed to load timetable data",
        );
      }

      setClasses(json.classes);
      setEvents(json.events);
      setSubjectLegend(json.subjectLegend ?? {});
      setLastUpdated(new Date(json.fetchedAt));
      setServerFetchedAt(json.fetchedAt);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong loading the timetable",
      );
    } finally {
      setLoading(false);
      setInitialLoading(false);
      inFlight.current = false;
    }
  }, [sheetIdOverride]);

  useEffect(() => {
    if (!ready) return;
    // Deferred via queueMicrotask so the effect body itself stays
    // synchronous (satisfies react-hooks/set-state-in-effect); the actual
    // setState calls happen inside load()'s own async continuation either way.
    queueMicrotask(load);
    const id = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load, ready]);

  return {
    classes,
    events,
    subjectLegend,
    loading,
    initialLoading,
    error,
    lastUpdated,
    serverFetchedAt,
    refresh: load,
  };
}
