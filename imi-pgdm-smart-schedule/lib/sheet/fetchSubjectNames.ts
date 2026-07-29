import { fetchSheetRows } from "./fetchSheet";
import {
  parseSubjectLegend,
  type SubjectLegendEntry,
} from "./parseSubjectNames";

export type { SubjectLegendEntry };

// Tried in order against the same spreadsheet. Your second tab is called
// "Course Name & Faculty" — the others are just reasonable fallbacks in
// case it ever gets renamed.
const CANDIDATE_TAB_NAMES = [
  "Course Name & Faculty",
  "Course Names",
  "Subject Names",
  "Legend",
];

/**
 * Best-effort fetch of the subject legend (code → full name + faculty)
 * from a second tab in the same spreadsheet. Never throws — if the tab
 * is missing, renamed, or laid out unexpectedly, this just returns {}
 * so the rest of the app falls back to showing subject codes alone.
 */
export async function fetchSubjectLegend(
  sheetId: string,
): Promise<Record<string, SubjectLegendEntry>> {
  for (const tabName of CANDIDATE_TAB_NAMES) {
    try {
      const rows = await fetchSheetRows(sheetId, tabName);
      const legend = parseSubjectLegend(rows);
      if (Object.keys(legend).length > 0) return legend;
    } catch {
      // Tab doesn't exist under this name, or isn't readable — try the next.
    }
  }
  return {};
}
