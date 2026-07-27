'use client';

import { Header } from '@/components/layout/Header';
import { ClassProgress } from '@/components/settings/ClassProgress';
import { Skeleton } from '@/components/shared/Skeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ExternalLink } from 'lucide-react';
import { useSchedule } from '@/components/providers/ScheduleProvider';
import { useLiveClock } from '@/hooks/useLiveClock';
import { deriveAvailableSubjects } from '@/lib/schedule/deriveAvailableSubjects';
import { deriveSubjectCompletionCounts } from '@/lib/schedule/deriveSubjectCompletionCounts';
import { filterClassesByBatch } from '@/lib/schedule/filterBatch';
import { mergeAllDaySections } from '@/lib/schedule/mergeSections';
import { isSubjectSelected } from '@/hooks/useSubjectPreferences';

const OLT_URL =
  'https://online.imibh.edu.in/academic/default.aspx?ReturnUrl=%2facademic%2fstudent%2ffrmStuddet.aspx';

export default function ProgressPage() {
  const {
    classes,
    section,
    showAllSections,
    selectedBatch,
    selectedSubjects,
    initialLoading,
    error,
    refresh,
  } = useSchedule();
  const { now } = useLiveClock();

  // Same pattern the dashboard uses: filter to the selected batch FIRST,
  // then merge sections if that toggle is on — merging before filtering
  // would mix rows from different batches that share the same dates.
  const batchClasses = filterClassesByBatch(classes, selectedBatch);
  const effectiveSection = showAllSections ? 'A' : section;
  const scopedClasses = showAllSections ? mergeAllDaySections(batchClasses) : batchClasses;

  const availableSubjects = deriveAvailableSubjects(classes, selectedBatch);
  const subjectsToShow = availableSubjects.filter((code) =>
    isSubjectSelected(selectedSubjects, code),
  );

  const counts = deriveSubjectCompletionCounts(
    scopedClasses,
    selectedBatch,
    effectiveSection,
    now,
  );

  return (
    <>
      <Header />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
        {error && !initialLoading && <ErrorState message={error} onRetry={refresh} />}

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
                How many classes of each of your selected subjects have already happened.
              </p>
            </div>

            <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-bold tracking-wide uppercase">Official Attendance</p>
                <p className="text-muted mt-0.5 text-xs">
                  This page tracks class completion, not attendance. Check your real attendance % on OLT.
                </p>
              </div>
              <Button onClick={() => window.open(OLT_URL, '_blank', 'noopener,noreferrer')}>
                <ExternalLink className="h-4 w-4" />
                Check on OLT
              </Button>
            </Card>

            <ClassProgress subjects={subjectsToShow} counts={counts} />
          </>
        )}
      </main>
    </>
  );
}
