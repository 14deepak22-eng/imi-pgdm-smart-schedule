'use client';

import { useEffect, useState } from 'react';
import type { DaySchedule } from '@/types/timetable';
import type { ScheduleEvent } from '@/types/events';
import { toLocalISODate } from '@/lib/utils/date';
import {
  diffSchedules,
  noticeContentKey,
  noticeSlotKey,
  type ChangeNotice,
  type ScheduleSnapshot,
} from '@/lib/schedule/diffSchedule';

/**
 * Bump this number any time you want to force EVERY visitor's notices to
 * reset, without touching their device directly (e.g. after a bug caused
 * bad/duplicate notices, like the one on July 27). Changing this number
 * changes the storage key below, so old saved notices are simply
 * abandoned/ignored on each visitor's next load — everyone starts fresh
 * automatically. No other code changes needed.
 */
const NOTICES_VERSION = 4;

const SNAPSHOT_KEY = `pgdm-schedule-snapshot-v${NOTICES_VERSION}`;
const NOTICES_KEY = `pgdm-change-notices-v${NOTICES_VERSION}`;
const SEEN_KEY = `pgdm-seen-notice-ids-v${NOTICES_VERSION}`;
const NOTICE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

function pruneNotices(notices: ChangeNotice[]): ChangeNotice[] {
  const cutoff = Date.now() - NOTICE_LIFETIME_MS;
  const today = toLocalISODate(new Date());
  return notices.filter((n) => {
    if (new Date(n.detectedAt).getTime() < cutoff) return false;
    // The class/event this notice is about is entirely in the past —
    // once that day has ended, the notice stops being useful and should
    // disappear from the list on its own, rather than lingering for the
    // full 1-week window regardless of whether the day already happened.
    if (n.date < today) return false;
    return true;
  });
}

/**
 * Collapses notices describing the exact same real-world change (same
 * category/batch/section/message) into a single entry, keeping the first
 * one encountered. Notices are always stored newest-first, so this keeps
 * the most recent detection of a repeated change and drops the older
 * repeats — without ever dropping a genuinely different notice.
 */
function dedupeNotices(notices: ChangeNotice[]): ChangeNotice[] {
  const seen = new Set<string>();
  const result: ChangeNotice[] = [];
  for (const notice of notices) {
    const key = noticeContentKey(notice);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(notice);
  }
  return result;
}

/**
 * Old notices saved before the `subjectCodes` field existed won't have
 * it in localStorage — this backfills it to an empty array so pages
 * that read `notice.subjectCodes` never crash on stale stored data.
 */
function migrateNotice(notice: ChangeNotice): ChangeNotice {
  return { ...notice, subjectCodes: notice.subjectCodes ?? [] };
}

function readNotices(): ChangeNotice[] {
  try {
    const raw = localStorage.getItem(NOTICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? dedupeNotices(pruneNotices(parsed.map(migrateNotice))) : [];
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

function readSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
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
  /** IDs of notices the person has already looked at. */
  seenNoticeIds: Set<string>;
  /**
   * True once seenNoticeIds has actually been loaded from storage at
   * least once. Starts false (seenNoticeIds starts as an empty Set
   * purely as a placeholder) — any consumer that snapshots
   * seenNoticeIds to decide what counts as "new" (e.g. the Notices
   * page) must wait for this to flip true first, or it'll capture that
   * placeholder empty set and treat every notice as new.
   */
  seenNoticeIdsReady: boolean;
  /** Marks the given notice IDs as seen (persisted across visits). */
  markSeen: (ids: string[]) => void;
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
  serverFetchedAt: string | null,
): UseChangeNoticesResult {
  const [notices, setNotices] = useState<ChangeNotice[]>([]);
  const [seenNoticeIds, setSeenNoticeIds] = useState<Set<string>>(new Set());
  const [seenNoticeIdsReady, setSeenNoticeIdsReady] = useState(false);
  const hasData = classes.length > 0 || events.length > 0;

  useEffect(() => {
    if (!hasData) return;

    queueMicrotask(() => {
      const prevSnapshot = readSnapshot();
      const existingNotices = readNotices();
      const next: ScheduleSnapshot = { classes, events };
      // Prefer the server's own fetch time — identical for every visitor
      // who hit the same 5-minute cached response — over this browser's
      // local clock, so notices show the same time to everyone instead
      // of "whenever I personally happened to refresh."
      const detectedAt = serverFetchedAt ?? new Date().toISOString();

      let updatedNotices = pruneNotices(existingNotices);

      if (prevSnapshot) {
        const detectedNotices = diffSchedules(prevSnapshot, next, detectedAt);
        // A "detected" notice whose content (category/batch/section/date/
        // session/message) already matches one we have stored is the SAME
        // real-world change being re-detected — not a new one. Drop it here
        // so it can never displace the original's id/detectedAt below; only
        // genuinely new content reaches the merge. Without this, a notice
        // you already saw could silently get a fresh id + "just now"
        // timestamp on a later re-fetch and reappear as new.
        const existingKeys = new Set(updatedNotices.map(noticeContentKey));
        const newNotices = detectedNotices.filter(
          (n) => !existingKeys.has(noticeContentKey(n)),
        );
        if (newNotices.length > 0) {
          // A fresh class-notice detection describes the SAME physical
          // slot (day + session + section) as an older stored notice —
          // e.g. an earlier "A → B" and this one being "B → A" — is a
          // newer transition for that one slot, not a second, unrelated
          // change. Drop the superseded old notice for that slot so the
          // list only ever shows the latest known change per slot, not
          // every intermediate edit stacked on top of each other.
          const newSlotKeys = new Set(
            newNotices
              .filter((n) => n.category.startsWith('class'))
              .map(noticeSlotKey),
          );
          const withoutSuperseded = updatedNotices.filter((n) => {
            if (!n.category.startsWith('class')) return true;
            return !newSlotKeys.has(noticeSlotKey(n));
          });
          updatedNotices = dedupeNotices(
            pruneNotices([...newNotices, ...withoutSuperseded]),
          );
        }
      }

      try {
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(next));
        localStorage.setItem(NOTICES_KEY, JSON.stringify(updatedNotices));
      } catch {
        // Storage unavailable — notices just won't persist across visits.
      }

      setNotices(updatedNotices);

      // Keep seenNoticeIds trimmed to only IDs that still exist, so it
      // doesn't grow forever as old (pruned/cleared) notices drop off.
      const validIds = new Set(updatedNotices.map((n) => n.id));
      const storedSeen = readSeenIds();
      const trimmedSeen = new Set([...storedSeen].filter((id) => validIds.has(id)));
      setSeenNoticeIds(trimmedSeen);
      setSeenNoticeIdsReady(true);
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify([...trimmedSeen]));
      } catch {
        // Storage unavailable — seen state just won't persist across visits.
      }
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

  const markSeen = (ids: string[]) => {
    if (ids.length === 0) return;
    setSeenNoticeIds((prev) => {
      const updated = new Set(prev);
      for (const id of ids) updated.add(id);
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify([...updated]));
      } catch {
        // Storage unavailable — seen state just won't persist across visits.
      }
      return updated;
    });
  };

  return { notices, clearNotices, seenNoticeIds, seenNoticeIdsReady, markSeen };
}
