"use client";

import { useEffect, useState } from "react";
import { resolveSubjectIdentity } from "@/lib/sheet/resolveSubjectIdentity";
import type { SubjectLegendEntry } from "@/lib/sheet/parseSubjectNames";

const STORAGE_KEY = "pgdm-selected-subjects-by-batch";

// Bump this whenever the *shape* of a saved subject code changes (like
// the section/legend-based resolver added here) — old saves are no
// longer meaningful and get wiped automatically, once, on next load.
// Everyone just falls back to "show everything" and can re-pick fresh
// in Settings, instead of ending up with silently mismatched/hidden
// classes.
const SCHEMA_VERSION = "2";
const VERSION_KEY = "pgdm-selected-subjects-schema-version";

function migrateIfNeeded(): void {
  try {
    if (localStorage.getItem(VERSION_KEY) === SCHEMA_VERSION) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(VERSION_KEY, SCHEMA_VERSION);
  } catch {
    // Storage unavailable; nothing to migrate.
  }
}

function readAll(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

/**
 * Subject preferences are stored per-batch (e.g. a 2025-27 student's
 * chosen electives are independent of a 2026-28 student's), keyed by
 * batch prefix in a single localStorage entry.
 *
 * `selected: null` means "no preference saved yet for this batch — show
 * everything". An explicitly-saved empty array is treated the same way,
 * so the dashboard never goes silently blank.
 */
export function useSubjectPreferences(
  batchPrefix: string | null,
): [string[] | null, (subjects: string[]) => void] {
  const [selected, setSelectedState] = useState<string[] | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      migrateIfNeeded();
      if (!batchPrefix) {
        setSelectedState(null);
        return;
      }
      const forBatch = readAll()[batchPrefix];
      setSelectedState(
        Array.isArray(forBatch)
          ? forBatch.filter((s) => typeof s === "string")
          : null,
      );
    });
  }, [batchPrefix]);

  const setSelected = (subjects: string[]) => {
    setSelectedState(subjects);
    if (!batchPrefix) return;
    try {
      const all = readAll();
      all[batchPrefix] = subjects;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      // Storage unavailable; selection just won't persist across visits.
    }
  };

  return [selected, setSelected];
}

/**
 * Checks whether a raw subject code (as it appears in the schedule)
 * falls under one of the selected picker codes, resolving it against
 * the sheet's legend first — so e.g. "GM613(B)(RRG)" correctly matches
 * a saved selection of "GM613(B)".
 *
 * If the code has no match in the legend at all, it was never offered
 * as a pickable option in Settings — so it's always shown, regardless
 * of the saved selection, rather than silently disappearing.
 */
export function isSubjectSelected(
  selected: string[] | null,
  subjectCode: string,
  legend: Record<string, SubjectLegendEntry>,
): boolean {
  if (!selected || selected.length === 0) return true; // no preference = show all
  const resolved = resolveSubjectIdentity(subjectCode, legend);
  if (!legend[resolved.baseCode]) return true; // not a known/pickable subject — never hide it
  return selected.includes(resolved.code);
}
