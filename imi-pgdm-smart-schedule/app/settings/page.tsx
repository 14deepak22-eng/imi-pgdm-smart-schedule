'use client';

import { Header } from '@/components/layout/Header';
import { SubjectPicker } from '@/components/settings/SubjectPicker';
import { SheetSourceForm } from '@/components/settings/SheetSourceForm';
import { YearSwitcher } from '@/components/settings/YearSwitcher';
import { ClassProgress } from '@/components/settings/ClassProgress';
import { Card } from '@/components/ui/Card';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { useSchedule } from '@/components/providers/ScheduleProvider';
import { useLiveClock } from '@/hooks/useLiveClock';
import { deriveAvailableSubjects } from '@/lib/schedule/deriveAvailableSubjects';
import { deriveSubjectCompletionCounts } from '@/lib/schedule/deriveSubjectCompletionCounts';
import { mergeAllDaySections } from '@/lib/schedule/mergeSections';

export default function SettingsPage() {
  const {
    classes,
    section,
    showAllSections,
    sheetId,
    setSheetId,
    selectedSubjects,
    setSelectedSubjects,
    setShowAllSections,
    availableBatches,
    selectedBatch,
    selectBatch,
  } = useSchedule();
  const { now } = useLiveClock();

  const availableSubjects = deriveAvailableSubjects(classes, selectedBatch);

  const effectiveSection = showAllSections ? 'A' : section;
  const scopedClasses = showAllSections ? mergeAllDaySections(classes) : classes;
  const completionCounts = deriveSubjectCompletionCounts(
    scopedClasses,
    selectedBatch,
    effectiveSection,
    now,
  );

  return (
    <>
      <Header />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
        <h1 className="font-display text-2xl font-bold tracking-wide uppercase">Settings</h1>

        <YearSwitcher
          availableBatches={availableBatches}
          selectedBatch={selectedBatch}
          onSelect={selectBatch}
        />

        <Card className="p-5">
          <ToggleSwitch
            checked={showAllSections}
            onChange={setShowAllSections}
            label="Show all sections"
            description="Combine Sections A, B, and C into one merged view instead of switching between them. The section switcher in the header is disabled while this is on."
          />
        </Card>

        {/* Keyed by batch so the picker's draft state resets cleanly when switching years. */}
        <SubjectPicker
          key={selectedBatch ?? 'none'}
          availableSubjects={availableSubjects}
          selected={selectedSubjects}
          onSave={setSelectedSubjects}
        />

        <ClassProgress availableSubjects={availableSubjects} counts={completionCounts} />

        <SheetSourceForm currentOverride={sheetId} onSave={setSheetId} />
      </main>
    </>
  );
}
