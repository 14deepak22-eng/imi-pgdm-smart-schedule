import type { TargetSection } from '@/types/timetable';

/**
 * Builds the unique key/label for one subject offering: its legend
 * identity plus its subject-level section, if it has one — e.g.
 * subjectCode "ST506(B)" + subjectSection "A" → "ST506(B)(A)".
 * Subjects with no section split just return their code unchanged.
 *
 * Used everywhere a single, comparable string is needed for a subject
 * offering: Settings picker selection, preference storage/filtering,
 * "show all sections" merge dedup, and any place two parallel offerings
 * of the same base subject need to stay visually distinct.
 */
export function subjectSelectionKey(entry: {
  subjectCode: string;
  subjectSection?: TargetSection;
}): string {
  return entry.subjectSection ? `${entry.subjectCode}(${entry.subjectSection})` : entry.subjectCode;
}
