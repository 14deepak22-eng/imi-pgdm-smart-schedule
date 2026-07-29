"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SearchBox } from "@/components/shared/SearchBox";
import { resolveSubjectInfo, type SubjectInfo } from "@/lib/sheet/subjectNames";
import type { AvailableSubject } from "@/lib/schedule/deriveAvailableSubjects";
import { cn } from "@/lib/utils/cn";

interface SubjectPickerProps {
  /** Every subject offering actually found in the schedule, across all sections. */
  availableSubjects: AvailableSubject[];
  selected: string[] | null;
  /** Subject code → {name, faculty}, auto-fetched from the sheet's legend tab. Codes with no match just show the code alone. */
  subjectNames: Record<string, SubjectInfo>;
  onSave: (subjects: string[]) => void;
}

export function SubjectPicker({
  availableSubjects,
  selected,
  subjectNames,
  onSave,
}: SubjectPickerProps) {
  const allKeys = useMemo(() => availableSubjects.map((s) => s.key), [availableSubjects]);

  // null/empty stored preference = "all selected" by default in the UI.
  const [draft, setDraft] = useState<string[]>(
    selected && selected.length > 0 ? selected : [...allKeys],
  );

  // `selected` (from localStorage) and `availableSubjects` (from the sheet
  // fetch) both load asynchronously, and on the very first render either —
  // or both — can still be empty/unresolved. Without this, `draft`'s
  // initial useState value gets permanently locked to whatever was known
  // at that first instant (often "nothing yet"), and never updates once
  // the real data actually arrives a moment later — which is exactly what
  // made a saved selection appear to reset to "unselected" after a
  // refresh, even though the dashboard (which reads live values, not a
  // frozen snapshot) kept filtering correctly the whole time.
  //
  // This re-syncs draft once real subjects are known, but stops the
  // moment the user actually starts editing, so it never overwrites an
  // in-progress selection.
  const hasUserEdited = useRef(false);
  useEffect(() => {
    if (hasUserEdited.current) return;
    if (availableSubjects.length === 0) return; // still loading — nothing real to sync to yet
    setDraft(selected && selected.length > 0 ? selected : [...allKeys]);
    // Only re-sync when the real preference or the real subject list
    // actually changes — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, availableSubjects.length]);

  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState("");

  // Fade the "Saved" confirmation out on its own after a couple seconds,
  // instead of leaving it sitting there until the next edit.
  useEffect(() => {
    if (!saved) return;
    const id = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(id);
  }, [saved]);

  const toggle = (key: string) => {
    hasUserEdited.current = true;
    setDraft((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const save = () => {
    onSave(draft);
    setSaved(true);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableSubjects;
    return availableSubjects.filter((subject) => {
      const info = resolveSubjectInfo(subjectNames, subject.code);
      return (
        subject.key.toLowerCase().includes(q) ||
        info.name.toLowerCase().includes(q) ||
        info.faculty.toLowerCase().includes(q)
      );
    });
  }, [availableSubjects, query, subjectNames]);

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
          {draft.length}/{availableSubjects.length} selected
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
              const active = draft.includes(subject.key);
              const info = resolveSubjectInfo(subjectNames, subject.code);
              return (
                <button
                  key={subject.key}
                  type="button"
                  onClick={() => toggle(subject.key)}
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
                        {subject.key}
                      </span>
                      {subject.section && (
                        <span className="text-muted bg-surface-2 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                          Section {subject.section}
                        </span>
                      )}
                    </span>
                    {info.name && (
                      <span className="text-muted mt-0.5 truncate text-xs">
                        {info.name}
                      </span>
                    )}
                    {info.faculty && (
                      <span className="text-muted mt-0.5 truncate text-xs italic">
                        {info.faculty}
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
        <Button
          variant="ghost"
          onClick={() => {
            hasUserEdited.current = true;
            setDraft([...allKeys]);
          }}
        >
          Select all
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            hasUserEdited.current = true;
            setDraft([]);
          }}
        >
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
