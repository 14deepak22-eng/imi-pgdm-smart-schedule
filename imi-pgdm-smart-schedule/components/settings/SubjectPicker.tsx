'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

interface SubjectPickerProps {
  /** Every subject code actually found in the schedule, across all sections. */
  availableSubjects: string[];
  selected: string[] | null;
  onSave: (subjects: string[]) => void;
}

export function SubjectPicker({ availableSubjects, selected, onSave }: SubjectPickerProps) {
  // null/empty stored preference = "all selected" by default in the UI.
  const [draft, setDraft] = useState<string[]>(
    selected && selected.length > 0 ? selected : [...availableSubjects],
  );
  const [saved, setSaved] = useState(false);

  const toggle = (code: string) => {
    setSaved(false);
    setDraft((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const save = () => {
    onSave(draft);
    setSaved(true);
  };

  if (availableSubjects.length === 0) {
    return (
      <Card className="p-5">
        <h2 className="font-display text-lg font-bold tracking-wide uppercase">My Subjects</h2>
        <p className="text-muted mt-2 text-sm">
          No subjects found yet — once the schedule finishes loading, they&apos;ll show up here.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="font-display text-lg font-bold tracking-wide uppercase">My Subjects</h2>
        <p className="text-muted mt-1 text-sm">
          Every subject found in your batch&apos;s schedule, across all sections. Choose the ones
          you&apos;re actually taking — the dashboard and weekly grid will only show these. Leave
          all selected to see everything.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {availableSubjects.map((code) => {
          const active = draft.includes(code);
          return (
            <button
              key={code}
              onClick={() => toggle(code)}
              aria-pressed={active}
              className={cn(
                'flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-border text-muted hover:text-foreground',
              )}
            >
              {active && <Check className="h-3.5 w-3.5" />}
              {code}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save}>Save</Button>
        <Button variant="ghost" onClick={() => setDraft([...availableSubjects])}>
          Select all
        </Button>
        <Button variant="ghost" onClick={() => setDraft([])}>
          Clear
        </Button>
        {saved && <span className="text-accent-2 text-xs">Saved</span>}
      </div>
    </Card>
  );
}
