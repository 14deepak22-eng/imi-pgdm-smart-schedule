"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { DaySchedule, TargetSection } from "@/types/timetable";
import type { ScheduleEvent } from "@/types/events";
import type { ChangeNotice } from "@/lib/schedule/diffSchedule";
import type { BatchOption } from "@/lib/schedule/deriveAvailableBatches";
import type { SubjectLegendEntry } from "@/lib/sheet/parseSubjectNames";
import {
  deriveAvailableBatches,
  defaultShowAllSectionsForRank,
} from "@/lib/schedule/deriveAvailableBatches";
import { useSheetData } from "@/hooks/useSheetData";
import { useSelectedSection } from "@/hooks/useSelectedSection";
import { useSheetSource } from "@/hooks/useSheetSource";
import { useSelectedBatch } from "@/hooks/useSelectedBatch";
import { useSubjectPreferences } from "@/hooks/useSubjectPreferences";
import { useShowAllSections } from "@/hooks/useShowAllSections";
import { useChangeNotices } from "@/hooks/useChangeNotices";

interface ScheduleContextValue {
  classes: DaySchedule[];
  events: ScheduleEvent[];
  /** Subject code → {name, faculty}, auto-fetched from the sheet's legend tab. Empty if unavailable. */
  subjectLegend: Record<string, SubjectLegendEntry>;
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
  section: TargetSection;
  setSection: (section: TargetSection) => void;
  sheetId: string | null;
  setSheetId: (id: string | null) => void;
  selectedSubjects: string[] | null;
  setSelectedSubjects: (subjects: string[]) => void;
  /** True once the saved subject selection has actually finished loading from storage (see useSubjectPreferences). */
  selectedSubjectsLoaded: boolean;
  showAllSections: boolean;
  setShowAllSections: (value: boolean) => void;
  notices: ChangeNotice[];
  clearNotices: (predicate?: (notice: ChangeNotice) => boolean) => void;
  /** IDs of notices the person has already looked at — used to hide the nav badge dot for those. */
  seenNoticeIds: Set<string>;
  /** True once seenNoticeIds has actually loaded from storage — see useChangeNotices. */
  seenNoticeIdsReady: boolean;
  /** Marks the given notice IDs as seen, e.g. after visiting the Notices or Events page. */
  markNoticesSeen: (ids: string[]) => void;
  /** Every batch found in the sheet, ranked by how recently each started. */
  availableBatches: BatchOption[];
  /** The batch (e.g. "PGDM 2025-27") the student picked, or null before onboarding. */
  selectedBatch: string | null;
  /**
   * Sets the selected batch AND resets "show all sections" to that
   * batch's year-appropriate default (per the requested rule: 1st-year
   * defaults to picking a section, 2nd-year+ defaults to all sections).
   * Use this instead of a raw setter, for both onboarding and later
   * switching in Settings.
   */
  selectBatch: (batchPrefix: string) => void;
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [sheetId, setSheetId] = useSheetSource();
  const sheet = useSheetData(sheetId);
  const [section, setSection] = useSelectedSection();
  const [showAllSections, setShowAllSections] = useShowAllSections();
  const [selectedBatch, setSelectedBatch] = useSelectedBatch();
  const [selectedSubjects, setSelectedSubjects, selectedSubjectsLoaded] =
    useSubjectPreferences(selectedBatch);
  const { notices, clearNotices, seenNoticeIds, seenNoticeIdsReady, markSeen } = useChangeNotices(
    sheet.classes,
    sheet.events,
    sheet.serverFetchedAt,
  );

  const availableBatches = useMemo(
    () => deriveAvailableBatches(sheet.classes, sheet.events),
    [sheet.classes, sheet.events],
  );

  const selectBatch = (batchPrefix: string) => {
    setSelectedBatch(batchPrefix);
    const option = availableBatches.find((b) => b.batchPrefix === batchPrefix);
    setShowAllSections(defaultShowAllSectionsForRank(option?.rank ?? 0));
  };

  return (
    <ScheduleContext.Provider
      value={{
        ...sheet,
        section,
        setSection,
        sheetId,
        setSheetId,
        selectedSubjects,
        setSelectedSubjects,
        selectedSubjectsLoaded,
        showAllSections,
        setShowAllSections,
        notices,
        clearNotices,
        seenNoticeIds,
        seenNoticeIdsReady,
        markNoticesSeen: markSeen,
        availableBatches,
        selectedBatch,
        selectBatch,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule(): ScheduleContextValue {
  const ctx = useContext(ScheduleContext);
  if (!ctx)
    throw new Error("useSchedule must be used within a ScheduleProvider");
  return ctx;
}
