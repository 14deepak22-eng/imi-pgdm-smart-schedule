'use client';

import { useEffect, useState } from 'react';
import type { TargetSection } from '@/types/timetable';
import { TARGET_SECTIONS } from '@/lib/sheet/constants';

const STORAGE_KEY = 'pgdm-section';

function isValidSection(value: string | null): value is TargetSection {
  return !!value && (TARGET_SECTIONS as readonly string[]).includes(value);
}

export function useSelectedSection(): [TargetSection, (section: TargetSection) => void] {
  const [section, setSectionState] = useState<TargetSection>('A');

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (isValidSection(stored)) setSectionState(stored);
      } catch {
        // Ignore — falls back to default section 'A'.
      }
    });
  }, []);

  const setSection = (next: TargetSection) => {
    setSectionState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable; selection just won't persist across visits.
    }
  };

  return [section, setSection];
}
