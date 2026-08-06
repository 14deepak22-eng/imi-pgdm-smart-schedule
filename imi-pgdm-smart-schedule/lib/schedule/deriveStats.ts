import type { DaySchedule, TargetSection } from '@/types/timetable';
import { toLocalISODate } from '@/lib/utils/date';

export interface DashboardStats {
  classesToday: number;
  /** How many of today's classes have already ended, as of `now`. */
  classesDoneToday: number;
  classesThisWeek: number;
  isHolidayToday: boolean;
  /** Class counts for Mon..Sun of the current week, in that order. */
  weekdayCounts: number[];
  /** Index into weekdayCounts for "today" (0 = Monday .. 6 = Sunday). */
  todayWeekdayIndex: number;
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

function countClasses(day: DaySchedule | undefined): number {
  if (!day) return 0;
  return day.sessions.filter((s) => s.entries.length > 0).length;
}

export function computeDashboardStats(
  days: DaySchedule[],
  section: TargetSection,
  now: Date,
): DashboardStats {
  const todayISO = toLocalISODate(now);
  const sectionDays = days.filter((d) => d.section === section);

  const todayEntry = sectionDays.find((d) => d.date === todayISO);
  const classesToday = countClasses(todayEntry);
  const isHolidayToday = todayEntry?.isHoliday ?? false;

  const classesDoneToday = todayEntry
    ? todayEntry.sessions.filter((s) => {
        if (s.entries.length === 0) return false;
        const end = new Date(`${todayEntry.date}T${s.endTime}:00`);
        return end.getTime() <= now.getTime();
      }).length
    : 0;

  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const weekSectionDays = sectionDays.filter((d) => {
    const date = new Date(`${d.date}T00:00:00`);
    return date >= weekStart && date <= weekEnd;
  });

  const classesThisWeek = weekSectionDays.reduce((sum, d) => sum + countClasses(d), 0);

  const weekdayCounts: number[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const iso = toLocalISODate(date);
    return countClasses(weekSectionDays.find((d) => d.date === iso));
  });

  const todayWeekdayIndex = (now.getDay() + 6) % 7; // Monday = 0

  return {
    classesToday,
    classesDoneToday,
    classesThisWeek,
    isHolidayToday,
    weekdayCounts,
    todayWeekdayIndex,
  };
}

/** Short "how's the week going" phrase for the today/week timeline card. */
export function describeWeekTrend(weekdayCounts: number[], todayWeekdayIndex: number): string {
  const todayCount = weekdayCounts[todayWeekdayIndex] ?? 0;
  const nonZero = weekdayCounts.filter((c) => c > 0);
  if (nonZero.length === 0) return 'no classes this week';
  if (todayCount === 0) return 'no classes today';

  const min = Math.min(...nonZero);
  const max = Math.max(...nonZero);
  if (min === max) return 'on track this week';
  if (todayCount === min) return 'lightest day this week';
  if (todayCount === max) return 'busiest day this week';
  return 'on track this week';
}
