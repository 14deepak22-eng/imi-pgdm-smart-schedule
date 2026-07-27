"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SearchBox } from "@/components/shared/SearchBox";
import { getSubjectFullName } from "@/lib/sheet/constants";
import { cn } from "@/lib/utils/cn";

interface SubjectPickerProps {
  /** Every subject code actually found in the schedule, across all sections. */
  availableSubjects: string[];
  selected: string[] | null;
  /** Used to look up each code's full name; pass null if unknown. */
  selectedBatch: string | null;
  onSave: (subjects: string[]) => void;
}

export function SubjectPicker({
  availableSubjects,
  selected,
  selectedBatch,
  onSave,
}: SubjectPickerProps) {
  // null/empty stored preference = "all selected" by default in the UI.
  const [draft, setDraft] = useState<string[]>(
    selected && selected.length > 0 ? selected : [...availableSubjects],
  );
  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState("");

  const toggle = (code: string) => {
    setSaved(false);
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
    return availableSubjects.filter((code) => {
      const name = getSubjectFullName(selectedBatch, code);
      return code.toLowerCase().includes(q) || name.toLowerCase().includes(q);
    });
  }, [availableSubjects, query, selectedBatch]);

  if (availableSubjects.length === 0) {
    return (
      <p className="text-muted text-sm">
        No subjects found yet — once the schedule finishes loading, they&apos;ll
        show up here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted text-sm">
        Every subject found in your batch&apos;s schedule, across all sections.
        Choose the ones you&apos;re actually taking — the dashboard and weekly
        grid will only show these. Leave all selected to see everything.
      </p>

      <div className="flex items-center justify-between gap-3">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search subject…"
        />
        <span className="text-muted shrink-0 text-xs whitespace-nowrap">
          {draft.length} / {availableSubjects.length} selected
        </span>
      </div>

      <div className="border-border max-h-72 overflow-y-auto rounded-lg border">
        {filtered.length === 0 ? (
          <p className="text-muted p-4 text-sm">
            No subjects match &quot;{query}&quot;.
          </p>
        ) : (
          <div className="divide-border divide-y">
            {filtered.map((code) => {
              const active = draft.includes(code);
              const name = getSubjectFullName(selectedBatch, code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggle(code)}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                    active ? "bg-accent/10" : "hover:bg-surface-2",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                      active
                        ? "border-accent bg-accent text-background"
                        : "border-border bg-surface",
                    )}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        active && "text-accent",
                      )}
                    >
                      {code}
                    </span>
                    {name && (
                      <span className="text-muted mt-0.5 text-xs">{name}</span>
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
        <Button
          variant="ghost"
          onClick={() => setDraft([...availableSubjects])}
        >
          Select all
        </Button>
        <Button variant="ghost" onClick={() => setDraft([])}>
          Clear
        </Button>
        {saved && <span className="text-accent-2 text-xs">Saved</span>}
      </div>
    </div>
  );
}
