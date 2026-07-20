'use client';

import { useEffect, useState } from 'react';
import type { DaySchedule } from '@/types/timetable';
import type { ScheduleEvent } from '@/types/events';
import {
  diffSchedules,
  type ChangeNotice,
  type ScheduleSnapshot,
} from '@/lib/schedule/diffSchedule';

const SNAPSHOT_KEY = 'pgdm-schedule-snapshot';
const NOTICES_KEY = 'pgdm-change-notices';
const NOTICE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

function pruneNotices(notices: ChangeNotice[]): ChangeNotice[] {
  const cutoff = Date.now() - NOTICE_LIFETIME_MS;
  return notices.filter((n) => new Date(n.detectedAt).getTime() >= cutoff);
}

function readNotices(): ChangeNotice[] {
  try {
    const raw = localStorage.getItem(NOTICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? pruneNotices(parsed) : [];
  } catch {
    return [];
  }
}

function readSnapshot(): ScheduleSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export interface UseChangeNoticesResult {
  notices: ChangeNotice[];
  /**
   * Clears notices. Pass a predicate to clear only matching notices
   * (e.g. just the currently-viewed batch/section) — omit it to clear
   * everything.
   */
  clearNotices: (predicate?: (notice: ChangeNotice) => boolean) => void;
}

/**
 * Detects changes to the sheet by comparing each successful fetch against
 * the last-seen snapshot (stored in this browser). Any difference — a
 * class added/removed/changed, a new or removed event — becomes a
 * "notice" that stays visible for 1 week, then is automatically pruned.
 *
 * The very first time this runs (no prior snapshot saved yet), it just
 * establishes the baseline without generating notices — otherwise every
 * new visitor would see the entire term's worth of classes as "new".
 */
export function useChangeNotices(
  classes: DaySchedule[],
  events: ScheduleEvent[],
): UseChangeNoticesResult {
  const [notices, setNotices] = useState<ChangeNotice[]>([]);
  const hasData = classes.length > 0 || events.length > 0;

  useEffect(() => {
    if (!hasData) return;

    queueMicrotask(() => {
      const prevSnapshot = readSnapshot();
      const existingNotices = readNotices();
      const next: ScheduleSnapshot = { classes, events };

      let updatedNotices = pruneNotices(existingNotices);

      if (prevSnapshot) {
        const newNotices = diffSchedules(prevSnapshot, next, new Date().toISOString());
        if (newNotices.length > 0) {
          updatedNotices = pruneNotices([...newNotices, ...updatedNotices]);
        }
      }

      try {
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(next));
        localStorage.setItem(NOTICES_KEY, JSON.stringify(updatedNotices));
      } catch {
        // Storage unavailable — notices just won't persist across visits.
      }

      setNotices(updatedNotices);
    });
    // Re-run whenever the underlying data actually changes (a new fetch
    // resolved) — comparing serialized content, not just array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(classes), JSON.stringify(events)]);

  const clearNotices = (predicate?: (notice: ChangeNotice) => boolean) => {
    const remaining = predicate ? notices.filter((n) => !predicate(n)) : [];
    setNotices(remaining);
    try {
      localStorage.setItem(NOTICES_KEY, JSON.stringify(remaining));
    } catch {
      // Storage unavailable — clearing just won't persist across visits.
    }
  };

  return { notices, clearNotices };
}
