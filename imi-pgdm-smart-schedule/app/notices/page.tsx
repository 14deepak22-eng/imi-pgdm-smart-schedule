"use client";

import { useEffect, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/shared/Skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { NoticeList } from "@/components/events/NoticeList";
import { useSchedule } from "@/components/providers/ScheduleProvider";
import { isSubjectSelected } from "@/hooks/useSubjectPreferences";
import type { ChangeNotice } from "@/lib/schedule/diffSchedule";

/**
 * Collapses notices that read identically (same category/message) into
 * one entry — used ONLY for display in "show all sections" merged view,
 * so a change that legitimately hit every section (e.g. a room swap
 * applied to A, B, and C) shows once instead of 3 times. Genuinely
 * different per-section changes have different message text, so they're
 * unaffected and still show separately. This never touches what's
 * actually stored — single-section viewers always see their section's
 * own accurate notices, untouched by this.
 */
function dedupeForMergedView(notices: ChangeNotice[]): ChangeNotice[] {
  const seen = new Set<string>();
  const result: ChangeNotice[] = [];
  for (const notice of notices) {
    const key = `${notice.category}::${notice.batch}::${notice.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(notice);
  }
  return result;
}

export default function NoticesPage() {
  const {
    notices,
    clearNotices,
    markNoticesSeen,
    initialLoading,
    error,
    refresh,
    section,
    showAllSections,
    selectedBatch,
    selectedSubjects,
    subjectLegend,
  } = useSchedule();

  const effectiveSection = showAllSections ? "A" : section;

  const matchesSubject = (n: ChangeNotice) => {
    const codes = n.subjectCodes ?? [];
    // Event notices aren't tied to a subject, so they're never filtered out here.
    return (
      codes.length === 0 ||
      codes.some((code) =>
        isSubjectSelected(selectedSubjects, code, subjectLegend),
      )
    );
  };

  // Every notice that matches the current batch/section/subject scope —
  // this is the FULL set (including cross-section duplicates collapsed
  // below for display), because the nav badge dot counts these raw
  // notices, not the deduped display list. Marking-seen has to use this
  // full set too, or the dot never clears in merged "All Sections" view.
  const allScopedNotices = notices.filter((n) => {
    if (n.batch !== selectedBatch) return false;
    if (!showAllSections && n.section !== effectiveSection) return false;
    if (!matchesSubject(n)) return false;
    return true;
  });

  const displayNotices = showAllSections
    ? dedupeForMergedView(allScopedNotices)
    : allScopedNotices;

  const classNotices = useMemo(
    () => displayNotices.filter((n) => n.category.startsWith("class-")),
    [displayNotices],
  );
  const eventNotices = useMemo(
    () => displayNotices.filter((n) => n.category.startsWith("event-")),
    [displayNotices],
  );

  // Visiting this page counts as "having seen" everything in scope —
  // using the full (pre-dedupe) set so the nav badge dot, which counts
  // raw notices, actually clears. Doesn't delete anything (Clear All
  // still does that separately).
  const allScopedNoticeIds = allScopedNotices.map((n) => n.id).join(",");
  useEffect(() => {
    if (!allScopedNoticeIds) return;
    markNoticesSeen(allScopedNoticeIds.split(","));
    // Only re-run when the actual set of matching notice IDs changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allScopedNoticeIds]);

  return (
    <>
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        {error && !initialLoading && (
          <ErrorState message={error} onRetry={refresh} />
        )}

        {initialLoading ? (
          <div className="flex flex-col gap-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-wide uppercase">
                  Notice
                </h1>
                <p className="text-muted text-sm">
                  Auto-detected changes to the sheet, kept visible for 1 week.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  clearNotices(
                    (n) =>
                      n.batch === selectedBatch &&
                      (showAllSections || n.section === effectiveSection) &&
                      matchesSubject(n),
                  )
                }
                disabled={displayNotices.length === 0}
                className="gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </div>

            <NoticeList
              title="Class Notices"
              notices={classNotices}
              emptyTitle="No class changes"
            />
            <NoticeList
              title="Event Notices"
              notices={eventNotices}
              emptyTitle="No event changes"
            />
          </>
        )}
      </main>
    </>
  );
}
