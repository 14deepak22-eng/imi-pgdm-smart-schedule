'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { extractSheetId } from '@/lib/utils/sheetId';

// The default sheet ID baked in at build time (NEXT_PUBLIC_ vars are safe
// to read client-side — Next.js inlines them into the bundle). Used so
// the field below always shows the currently active sheet instead of
// starting blank.
const DEFAULT_SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID ?? '';

interface SheetSourceFormProps {
  currentOverride: string | null;
  onSave: (sheetId: string | null) => void;
}

export function SheetSourceForm({ currentOverride, onSave }: SheetSourceFormProps) {
  const [value, setValue] = useState(currentOverride ?? DEFAULT_SHEET_ID);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<'saved' | 'reset' | null>(null);

  const save = () => {
    setError(null);
    const id = extractSheetId(value);
    if (!id) {
      setError("That doesn't look like a valid Google Sheet link or ID.");
      return;
    }
    onSave(id);
    setValue(id);
    setSaved('saved');
  };

  const reset = () => {
    setError(null);
    setValue(DEFAULT_SHEET_ID);
    onSave(null);
    setSaved('reset');
  };

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="font-display text-lg font-bold tracking-wide uppercase">Sheet Source</h2>
        <p className="text-muted mt-1 text-sm">
          This is the Google Sheet the dashboard currently reads from. Paste a different link (or
          just its ID) to switch sources — the sheet must be shared as &quot;Anyone with the link
          can view.&quot;
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(null);
          }}
          placeholder="https://docs.google.com/spreadsheets/d/1FEKe5fBUREJ_dx8lrwvW3p89u8kZw1lEo6nC7ERA15U/edit?usp=drivesdk"
          className="border-border bg-surface placeholder:text-muted focus-visible:ring-accent flex-1 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
        />
        <Button onClick={save}>Save</Button>
      </div>

      {error && <p className="text-danger text-xs">{error}</p>}
      {saved === 'saved' && (
        <p className="text-accent-2 text-xs">Saved — reloading data from this sheet.</p>
      )}
      {saved === 'reset' && <p className="text-accent-2 text-xs">Reset to the default sheet.</p>}

      {currentOverride && (
        <div>
          <Button variant="outline" onClick={reset}>
            Reset to default sheet
          </Button>
        </div>
      )}
    </Card>
  );
}
