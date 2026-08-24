import type { MealType } from "@/types/messMenu";

/**
 * Actual mess serving windows, in minutes-since-midnight. Used to figure out
 * what's being served right now (or next) so the modal can lead with that
 * instead of making the user scan a static table.
 */
export const MEAL_TIMINGS: Record<
  MealType,
  { start: number; end: number; label: string }
> = {
  breakfast: { start: 8 * 60 + 30, end: 9 * 60 + 30, label: "Breakfast" },
  lunch: { start: 13 * 60 + 30, end: 14 * 60 + 30, label: "Lunch" },
  snacks: { start: 17 * 60 + 30, end: 18 * 60 + 30, label: "Snacks" },
  dinner: { start: 20 * 60, end: 21 * 60 + 30, label: "Dinner" },
};

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "snacks", "dinner"];

export interface MealServingStatus {
  /** 'current' if a meal window is open right now, 'upcoming' if the next
   *  window is still later today, 'day-over' once dinner has ended. */
  status: "current" | "upcoming" | "day-over";
  meal: MealType | null;
  /** Minutes until this window ends (status 'current') or starts (status 'upcoming'). */
  minutesRemaining: number | null;
}

export function getMealServingStatus(
  now: Date = new Date(),
): MealServingStatus {
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  for (const meal of MEAL_ORDER) {
    const { start, end } = MEAL_TIMINGS[meal];
    if (minutesNow >= start && minutesNow < end) {
      return { status: "current", meal, minutesRemaining: end - minutesNow };
    }
  }

  for (const meal of MEAL_ORDER) {
    const { start } = MEAL_TIMINGS[meal];
    if (minutesNow < start) {
      return { status: "upcoming", meal, minutesRemaining: start - minutesNow };
    }
  }

  return { status: "day-over", meal: null, minutesRemaining: null };
}

/** e.g. "8:30 – 9:30 AM" */
export function formatMealTimeRange(meal: MealType): string {
  const { start, end } = MEAL_TIMINGS[meal];
  return `${formatMinutesOfDay(start)} – ${formatMinutesOfDay(end)}`;
}

/** e.g. "42m" or "1h 12m" */
export function formatMinutesRemaining(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatMinutesOfDay(total: number): string {
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}
