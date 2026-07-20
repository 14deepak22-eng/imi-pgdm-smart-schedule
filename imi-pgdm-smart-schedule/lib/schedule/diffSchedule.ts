import type { DaySchedule, TargetSection } from '@/types/timetable';
import type { ScheduleEvent } from '@/types/events';

export type NoticeCategory =
  | 'class-added'
  | 'class-removed'
  | 'class-changed'
  | 'event-added'
  | 'event-removed'
  | 'event-changed';

export interface ChangeNotice {
  id: string;
  /** ISO timestamp of when this change was detected (client-side, at fetch time). */
  detectedAt: string;
  batch: string;
  section: TargetSection;
  category: NoticeCategory;
  message: string;
}

export interface ScheduleSnapshot {
  classes: DaySchedule[];
  events: ScheduleEvent[];
}

interface ClassSlotInfo {
  desc: string;
  dayLabel: string;
  session: string;
  batch: string;
  section: TargetSection;
}

function describeEntries(entries: { subjectCode: string; room?: string }[]): string {
  return entries.map((e) => (e.room ? `${e.subjectCode} (${e.room})` : e.subjectCode)).join(' / ');
}

function buildClassMap(days: DaySchedule[]): Map<string, ClassSlotInfo> {
  const map = new Map<string, ClassSlotInfo>();
  for (const day of days) {
    if (day.isHoliday) continue;
    for (const slot of day.sessions) {
      if (slot.entries.length === 0) continue;
      // Includes batch so two different batches never collide on the same key.
      const key = `${day.batch}|${day.date}|${day.section}|${slot.session}`;
      map.set(key, {
        desc: describeEntries(slot.entries),
        dayLabel: day.dayLabel,
        session: slot.session,
        batch: day.batch,
        section: day.section,
      });
    }
  }
  return map;
}

function buildEventMap(events: ScheduleEvent[]): Map<string, ScheduleEvent> {
  return new Map(events.map((e) => [e.id, e]));
}

/**
 * Compares a previous schedule snapshot to the latest one and returns a
 * list of human-readable notices describing what changed. Returns an
 * empty list if nothing differs.
 */
export function diffSchedules(
  prev: ScheduleSnapshot,
  next: ScheduleSnapshot,
  detectedAt: string,
): ChangeNotice[] {
  const notices: ChangeNotice[] = [];

  const prevClasses = buildClassMap(prev.classes);
  const nextClasses = buildClassMap(next.classes);
  const allClassKeys = new Set([...prevClasses.keys(), ...nextClasses.keys()]);

  for (const key of allClassKeys) {
    const before = prevClasses.get(key);
    const after = nextClasses.get(key);

    if (!before && after) {
      notices.push({
        id: `${detectedAt}-added-${key}`,
        detectedAt,
        batch: after.batch,
        section: after.section,
        category: 'class-added',
        message: `New class added: ${after.desc} on ${after.dayLabel} (Session ${after.session})`,
      });
    } else if (before && !after) {
      notices.push({
        id: `${detectedAt}-removed-${key}`,
        detectedAt,
        batch: before.batch,
        section: before.section,
        category: 'class-removed',
        message: `Class removed: ${before.desc} that was on ${before.dayLabel} (Session ${before.session})`,
      });
    } else if (before && after && before.desc !== after.desc) {
      notices.push({
        id: `${detectedAt}-changed-${key}`,
        detectedAt,
        batch: after.batch,
        section: after.section,
        category: 'class-changed',
        message: `Class updated on ${after.dayLabel} (Session ${after.session}): ${before.desc} → ${after.desc}`,
      });
    }
  }

  const prevEvents = buildEventMap(prev.events);
  const nextEvents = buildEventMap(next.events);
  const allEventIds = new Set([...prevEvents.keys(), ...nextEvents.keys()]);

  for (const id of allEventIds) {
    const before = prevEvents.get(id);
    const after = nextEvents.get(id);

    if (!before && after) {
      notices.push({
        id: `${detectedAt}-eadded-${id}`,
        detectedAt,
        batch: after.batch,
        section: after.section,
        category: 'event-added',
        message: `New event: ${after.title} on ${after.dayLabel}`,
      });
    } else if (before && !after) {
      notices.push({
        id: `${detectedAt}-eremoved-${id}`,
        detectedAt,
        batch: before.batch,
        section: before.section,
        category: 'event-removed',
        message: `Event removed: ${before.title} that was on ${before.dayLabel}`,
      });
    } else if (before && after && before.title !== after.title) {
      notices.push({
        id: `${detectedAt}-echanged-${id}`,
        detectedAt,
        batch: after.batch,
        section: after.section,
        category: 'event-changed',
        message: `Event updated on ${after.dayLabel}: ${before.title} → ${after.title}`,
      });
    }
  }

  return notices;
}
