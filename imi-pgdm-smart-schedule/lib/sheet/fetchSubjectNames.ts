import { fetchSheetRows } from "./fetchSheet";
import { parseSubjectNames } from "./parseSubjectNames";

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
 * Best-effort fetch of the subject code → full name legend from a second
 * tab in the same spreadsheet. Never throws — if the tab is missing,
 * renamed, or laid out unexpectedly, this just returns {} so the picker
 * falls back to showing subject codes only.
 */
export async function fetchSubjectNameMap(
  sheetId: string,
): Promise<Record<string, string>> {
  for (const tabName of CANDIDATE_TAB_NAMES) {
    try {
      const rows = await fetchSheetRows(sheetId, tabName);
      const names = parseSubjectNames(rows);
      if (Object.keys(names).length > 0) return names;
    } catch {
      // Tab doesn't exist under this name, or isn't readable — try the next.
    }
  }
  return {};
}
