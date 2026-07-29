"use client";

import { Header } from "@/components/layout/Header";
import { ClassProgress } from "@/components/settings/ClassProgress";
import { Skeleton } from "@/components/shared/Skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ExternalLink } from "lucide-react";
import { useSchedule } from "@/components/providers/ScheduleProvider";
import { useLiveClock } from "@/hooks/useLiveClock";
import { deriveAvailableSubjectIdentities } from "@/lib/schedule/deriveAvailableSubjects";
import { deriveSubjectCompletionCounts } from "@/lib/schedule/deriveSubjectCompletionCounts";
import { filterClassesByBatch } from "@/lib/schedule/filterBatch";
import { mergeAllDaySections } from "@/lib/schedule/mergeSections";
import { isSubjectSelected } from "@/hooks/useSubjectPreferences";

const OLT_URL =
  "https://online.imibh.edu.in/academic/default.aspx?ReturnUrl=%2facademic%2fstudent%2ffrmStuddet.aspx";

export default function ProgressPage() {
  const {
    classes,
    section,
    showAllSections,
    selectedBatch,
    selectedSubjects,
    subjectLegend,
    initialLoading,
    error,
    refresh,
  } = useSchedule();
  const { now } = useLiveClock();

  // Same pattern the dashboard uses: filter to the selected batch FIRST,
  // then merge sections if that toggle is on — merging before filtering
  // would mix rows from different batches that share the same dates.
  const batchClasses = filterClassesByBatch(classes, selectedBatch);
  const effectiveSection = showAllSections ? "A" : section;
  const scopedClasses = showAllSections
    ? mergeAllDaySections(batchClasses)
    : batchClasses;

  const availableSubjects = deriveAvailableSubjectIdentities(
    classes,
    selectedBatch,
    subjectLegend,
  );
  const subjectsToShow = availableSubjects
    .map((s) => s.code)
    .filter((code) => isSubjectSelected(selectedSubjects, code, subjectLegend));

  const counts = deriveSubjectCompletionCounts(
    scopedClasses,
    selectedBatch,
    effectiveSection,
    now,
    subjectLegend,
  );

  return (
    <>
      <Header />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
        {error && !initialLoading && (
          <ErrorState message={error} onRetry={refresh} />
        )}

        {initialLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-wide uppercase">
                Progress
              </h1>
              <p className="text-muted text-sm">
                How many classes of each of your selected subjects have already
                happened.
              </p>
            </div>

            <Card className="flex items-center justify-between gap-3 p-3">
              <p className="text-muted flex items-center gap-2 text-xs">
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                This isn&apos;t your real attendance — check that on OLT.
              </p>
              <Button
                className="shrink-0 border-yellow-600 bg-yellow-400 px-2.5 py-1 text-xs text-black shadow-[2px_2px_0_0_#a16207] hover:bg-yellow-300"
                onClick={() =>
                  window.open(OLT_URL, "_blank", "noopener,noreferrer")
                }
              >
                Open OLT
              </Button>
            </Card>

            <ClassProgress subjects={subjectsToShow} counts={counts} />
          </>
        )}
      </main>
    </>
  );
}
