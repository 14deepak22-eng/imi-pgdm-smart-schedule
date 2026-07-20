import type { TargetSection } from '@/types/timetable';
import { TARGET_SECTIONS } from './constants';

/**
 * The sheet's batch labels are inconsistently formatted, e.g.:
 *   "PGDM 2025-27 -A", "PGDM 2025-27- B", "PGDM 2026-28 -A"
 * We normalize by stripping all whitespace before matching, so spacing
 * quirks don't cause silent data loss.
 */
function normalize(label: string): string {
  return label.replace(/\s+/g, '').toUpperCase();
}

// Matches "PGDM" + a year range (e.g. "2025-27") + a section letter,
// after whitespace has been stripped — e.g. "PGDM2025-27-A".
const BATCH_CELL_PATTERN = /^PGDM(\d{4}-\d{2,4})-([ABC])$/;

export interface ParsedBatchCell {
  /** e.g. "PGDM 2025-27" */
  batchPrefix: string;
  section: TargetSection;
}

/**
 * Parses a "Batch and Section" cell into its batch-year prefix and
 * section letter — for ANY batch present in the sheet, not just one
 * hardcoded target. This is what lets the app support multiple
 * concurrently-active batches (e.g. an outgoing 2nd-year batch and an
 * incoming 1st-year batch) without code changes as new batches appear.
 *
 * Returns null for cells that don't match this shape at all (stray
 * text, merged headers, etc.) so callers can just skip them.
 */
export function parseBatchCell(batchCellText: string): ParsedBatchCell | null {
  const normalized = normalize(batchCellText);
  const match = normalized.match(BATCH_CELL_PATTERN);
  if (!match) return null;

  const [, years, sectionLetter] = match;
  const section = sectionLetter as TargetSection;
  if (!(TARGET_SECTIONS as readonly string[]).includes(section)) return null;

  return { batchPrefix: `PGDM ${years}`, section };
}
