'use client';

import { Search, X } from 'lucide-react';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBox({
  value,
  onChange,
  placeholder = 'Search subject code…',
}: SearchBoxProps) {
  return (
    <div className="relative w-full sm:w-64">
      <Search className="text-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-border bg-surface placeholder:text-muted focus-visible:ring-accent w-full rounded-md border py-2 pr-8 pl-9 text-sm outline-none focus-visible:ring-2"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="text-muted hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
