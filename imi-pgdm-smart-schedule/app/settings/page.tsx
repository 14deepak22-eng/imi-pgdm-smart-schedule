"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { SubjectPicker } from "@/components/settings/SubjectPicker";
import { SheetSourceForm } from "@/components/settings/SheetSourceForm";
import { YearSwitcher } from "@/components/settings/YearSwitcher";
import { Card } from "@/components/ui/Card";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { useSchedule } from "@/components/providers/ScheduleProvider";
import { deriveAvailableSubjectIdentities } from "@/lib/schedule/deriveAvailableSubjects";
import { cn } from "@/lib/utils/cn";

export default function SettingsPage() {
  const {
    classes,
    subjectLegend,
    sheetId,
    setSheetId,
    selectedSubjects,
    setSelectedSubjects,
    selectedSubjectsLoaded,
    showAllSections,
    setShowAllSections,
    availableBatches,
    selectedBatch,
    selectBatch,
  } = useSchedule();
  const availableSubjects = deriveAvailableSubjectIdentities(
    classes,
    selectedBatch,
    subjectLegend,
  );

  // Sheet Source is rarely touched, so it stays tucked away by default —
  // keeps the page short without turning every section into an accordion.
  const [showSheetSource, setShowSheetSource] = useState(false);

  return (
    <>
      <Header />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
        <h1 className="font-display text-2xl font-bold tracking-wide uppercase">
          Settings
        </h1>

        {/* Keyed by batch so the picker's draft state resets cleanly when switching years. */}
        <SubjectPicker
          key={selectedBatch ?? "none"}
          availableSubjects={availableSubjects}
          selected={selectedSubjects}
          loaded={selectedSubjectsLoaded}
          onSave={setSelectedSubjects}
        />

        <Card className="p-3">
          <ToggleSwitch
            checked={showAllSections}
            onChange={setShowAllSections}
            label="Show all sections"
            description="Combine A, B, C into one view."
          />
        </Card>

        <YearSwitcher
          availableBatches={availableBatches}
          selectedBatch={selectedBatch}
          onSelect={selectBatch}
        />

        <Card className="overflow-hidden p-0">
          <button
            type="button"
            onClick={() => setShowSheetSource((v) => !v)}
            aria-expanded={showSheetSource}
            className="hover:bg-surface-2 flex w-full items-center justify-between gap-4 p-4 text-left transition-colors"
          >
            <div>
              <h2 className="font-display text-lg font-bold tracking-wide uppercase">
                Sheet Source
              </h2>
              <p className="text-muted mt-1 text-sm">
                Advanced — rarely needs changing.
              </p>
            </div>
            <ChevronDown
              className={cn(
                "text-muted h-5 w-5 shrink-0 transition-transform duration-200",
                showSheetSource && "rotate-180",
              )}
            />
          </button>
          {showSheetSource && (
            <div className="border-border border-t p-4">
              <SheetSourceForm currentOverride={sheetId} onSave={setSheetId} />
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
