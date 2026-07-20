import type { DaySchedule, TargetSection } from '@/types/timetable';
import { toLocalISODate } from '@/lib/utils/date';

export interface DashboardStats {
  classesToday: number;
  classesThisWeek: number;
  isHolidayToday: boolean;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // week starts Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function computeDashboardStats(
  days: DaySchedule[],
  section: TargetSection,
  now: Date,
): DashboardStats {
  const todayISO = toLocalISODate(now);
  const sectionDays = days.filter((d) => d.section === section);

  const todayEntry = sectionDays.find((d) => d.date === todayISO);
  const classesToday = todayEntry
    ? todayEntry.sessions.filter((s) => s.entries.length > 0).length
    : 0;
  const isHolidayToday = todayEntry?.isHoliday ?? false;

  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const classesThisWeek = sectionDays
    .filter((d) => {
      const date = new Date(`${d.date}T00:00:00`);
      return date >= weekStart && date <= weekEnd;
    })
    .reduce((sum, d) => sum + d.sessions.filter((s) => s.entries.length > 0).length, 0);

  return { classesToday, classesThisWeek, isHolidayToday };
}
