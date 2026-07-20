'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pgdm-selected-subjects-by-batch';

function readAll(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
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
      if (!batchPrefix) {
        setSelectedState(null);
        return;
      }
      const forBatch = readAll()[batchPrefix];
      setSelectedState(
        Array.isArray(forBatch) ? forBatch.filter((s) => typeof s === 'string') : null,
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

export function isSubjectSelected(selected: string[] | null, subjectCode: string): boolean {
  if (!selected || selected.length === 0) return true; // no preference = show all
  return selected.includes(subjectCode);
}
