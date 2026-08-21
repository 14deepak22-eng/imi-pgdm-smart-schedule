'use client';

import { useEffect, useRef } from 'react';
import { useSchedule } from '@/components/providers/ScheduleProvider';
import { useCountdown } from '@/hooks/useCountdown';
import { filterClassesBySubjects } from '@/lib/schedule/filterSubjects';
import { filterClassesByBatch } from '@/lib/schedule/filterBatch';
import { mergeAllDaySections } from '@/lib/schedule/mergeSections';

export const REMINDER_ENABLED_KEY = 'pgdm-class-reminders-enabled';
const REMINDER_LEAD_MS = 10 * 60 * 1000; // 10 minutes before class
const LAST_NOTIFIED_KEY = 'pgdm-class-reminder-last-session';

/**
 * Renders nothing — just watches the countdown and fires a browser
 * notification 10 minutes before the next class, if the user has
 * turned reminders on in Settings.
 */
export function ClassReminder() {
  const {
    classes,
    section,
    selectedSubjects,
    subjectLegend,
    showAllSections,
    selectedBatch,
  } = useSchedule();

  const batchClasses = filterClassesByBatch(classes, selectedBatch);
  const scopedClasses = showAllSections ? mergeAllDaySections(batchClasses) : batchClasses;
  const effectiveSection = showAllSections ? 'A' : section;
  const filteredClasses = filterClassesBySubjects(scopedClasses, selectedSubjects, subjectLegend);

  const { current } = useCountdown(filteredClasses, [], effectiveSection);
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (current.kind !== 'upcoming-today') return;

    let enabled = false;
    try {
      enabled = localStorage.getItem(REMINDER_ENABLED_KEY) === '1';
    } catch {
      return;
    }
    if (!enabled) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const sessionKey = current.session.start.toISOString();
    if (firedRef.current === sessionKey) return;

    try {
      if (localStorage.getItem(LAST_NOTIFIED_KEY) === sessionKey) {
        firedRef.current = sessionKey;
        return;
      }
    } catch {
      // ignore, proceed without dedupe persistence
    }

    if (current.msUntilStart > 0 && current.msUntilStart <= REMINDER_LEAD_MS) {
      const entry = current.session.entries[0];
      new Notification(`${entry?.displayCode ?? 'Class'} starts in 10 minutes`, {
        body: entry?.room ? `Room ${entry.room}` : undefined,
        icon: '/icons/icon-192-v2.png',
      });
      firedRef.current = sessionKey;
      try {
        localStorage.setItem(LAST_NOTIFIED_KEY, sessionKey);
      } catch {
        // ignore
      }
    }
  }, [current]);

  return null;
}
