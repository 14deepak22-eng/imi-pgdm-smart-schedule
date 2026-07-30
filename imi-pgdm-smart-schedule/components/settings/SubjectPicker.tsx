"use client";

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SearchBox } from "@/components/shared/SearchBox";
import type { ResolvedSubject } from "@/lib/sheet/resolveSubjectIdentity";
import { cn } from "@/lib/utils/cn";

interface SubjectPickerProps {
  /** Every subject actually found in the schedule, across all sections, resolved against the sheet's legend. */
  availableSubjects: ResolvedSubject[];
  selected: string[] | null;
  onSave: (subjects: string[]) => void;
}

export function SubjectPicker({
  availableSubjects,
  selected,
  onSave,
}: SubjectPickerProps) {
  const allCodes = useMemo(
    () => availableSubjects.map((s) => s.code),
    [availableSubjects],
  );

  // null/empty stored preference = "all selected" by default in the UI.
  const [draft, setDraft] = useState<string[]>(
    selected && selected.length > 0 ? selected : [...allCodes],
  );
  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState("");

  // Fade the "Saved" confirmation out on its own after a couple seconds,
  // instead of leaving it sitting there until the next edit.
  useEffect(() => {
    if (!saved) return;
    const id = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(id);
  }, [saved]);

  const toggle = (code: string) => {
    setDraft((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const save = () => {
    onSave(draft);
    setSaved(true);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableSubjects;
    return availableSubjects.filter((s) => {
      return (
        s.code.toLowerCase().includes(q) ||
        (s.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [availableSubjects, query]);

  if (availableSubjects.length === 0) {
    return (
      <Card className="p-5">
        <h2 className="font-display text-lg font-bold tracking-wide uppercase">
          My Subjects
        </h2>
        <p className="text-muted mt-2 text-sm">
          No subjects found yet — once the schedule finishes loading,
          they&apos;ll show up here.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="font-display text-lg font-bold tracking-wide uppercase">
          My Subjects
        </h2>
        <p className="text-muted mt-1 text-sm">
          Choose the subjects you&apos;re actually taking — the dashboard and
          weekly grid will only show these.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search subject…"
        />
        <span className="text-muted shrink-0 text-xs whitespace-nowrap">
          {draft.length}/{allCodes.length} selected
        </span>
      </div>

      <div className="border-border max-h-72 overflow-y-auto rounded-lg border">
        {filtered.length === 0 ? (
          <p className="text-muted p-4 text-sm">
            No subjects match &quot;{query}&quot;.
          </p>
        ) : (
          <div className="divide-border divide-y">
            {filtered.map((subject) => {
              const active = draft.includes(subject.code);
              return (
                <button
                  key={subject.code}
                  type="button"
                  onClick={() => toggle(subject.code)}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    active ? "bg-accent/10" : "hover:bg-surface-2",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                      active
                        ? "border-accent bg-accent text-background"
                        : "border-border bg-surface",
                    )}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          active && "text-accent",
                        )}
                      >
                        {subject.baseCode}
                      </span>
                      {subject.section && (
                        <span className="border-border text-muted rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                          Section {subject.section}
                        </span>
                      )}
                    </span>
                    {subject.name && (
                      <span className="text-muted mt-0.5 truncate text-xs">
                        {subject.name}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save}>Save</Button>
        <Button variant="ghost" onClick={() => setDraft([...allCodes])}>
          Select all
        </Button>
        <Button variant="ghost" onClick={() => setDraft([])}>
          Clear
        </Button>
        <span
          className={cn(
            "text-accent-2 text-xs transition-opacity duration-500",
            saved ? "opacity-100" : "opacity-0",
          )}
        >
          Saved
        </span>
      </div>
    </Card>
  );
}
