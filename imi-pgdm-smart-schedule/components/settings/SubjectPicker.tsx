"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  /**
   * True once `selected` reflects the actual saved preference (rather than
   * just "hasn't finished reading storage yet"). Both states look like
   * `selected === null`/unset, so the draft checklist below must not seed
   * itself until this flips true — otherwise a refresh briefly shows
   * "everything checked" before quietly reverting to the real saved
   * subset, which looks like the picker forgot the selection.
   */
  loaded: boolean;
  onSave: (subjects: string[]) => void;
}

export function SubjectPicker({
  availableSubjects,
  selected,
  loaded,
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

  // The initial useState above only ever runs once, using whatever
  // `selected` happens to be on first render — which, on a fresh page
  // load, is `null` because the real value hasn't finished loading from
  // storage yet. Without this, the checklist gets permanently stuck
  // showing "everything selected" instead of the actual saved subset.
  // Sync draft exactly once, the moment loading genuinely completes.
  const hasSyncedRef = useRef(false);
  useEffect(() => {
    if (!loaded || hasSyncedRef.current) return;
    hasSyncedRef.current = true;
    setDraft(selected && selected.length > 0 ? selected : [...allCodes]);
    // Only re-run when `loaded` flips — not on every `selected`/`allCodes`
    // change, or in-progress edits would keep getting clobbered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

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

  // Sort your selected subjects to the top of the list, so the ones you
  // actually take are easy to find/re-check without scrolling. This is
  // keyed off the *saved* selection (not the live in-progress draft) so
  // the list doesn't jump around under your cursor as you tick boxes —
  // it re-sorts once, right after you hit Save (or on next load).
  const savedSet = useMemo(
    () => new Set(selected && selected.length > 0 ? selected : []),
    [selected],
  );
  const orderedSubjects = useMemo(() => {
    if (savedSet.size === 0) return availableSubjects;
    return [...availableSubjects].sort((a, b) => {
      const aTop = savedSet.has(a.code) ? 0 : 1;
      const bTop = savedSet.has(b.code) ? 0 : 1;
      return aTop - bTop; // stable sort — ties keep original relative order
    });
  }, [availableSubjects, savedSet]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orderedSubjects;
    return orderedSubjects.filter((s) => {
      return (
        s.code.toLowerCase().includes(q) ||
        (s.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [orderedSubjects, query]);

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
