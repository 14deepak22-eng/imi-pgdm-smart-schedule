/**
 * Types for the Mess Menu feature. Deliberately standalone — no imports
 * from, or references to, the class-schedule types/logic elsewhere in
 * the app.
 */

export type MealType = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

export interface DayMessMenu {
  /** Canonical day name, e.g. "Monday". */
  day: string;
  breakfast: string[];
  lunch: string[];
  snacks: string[];
  dinner: string[];
}
