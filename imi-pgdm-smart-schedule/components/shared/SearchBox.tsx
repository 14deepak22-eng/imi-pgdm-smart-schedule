'use client';

import { Search, X } from 'lucide-react';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: 'md' | 'sm';
}

export function SearchBox({
  value,
  onChange,
  placeholder = 'Search subject code…',
  size = 'md',
}: SearchBoxProps) {
  const isSmall = size === 'sm';
  return (
    <div className={isSmall ? 'relative w-full sm:w-56' : 'relative w-full sm:w-64'}>
      <Search
        className={
          isSmall
            ? 'text-muted pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2'
            : 'text-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2'
        }
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={
          isSmall
            ? 'border-border bg-surface placeholder:text-muted focus-visible:ring-accent w-full rounded-md border py-1.5 pr-7 pl-8 text-xs outline-none focus-visible:ring-2'
            : 'border-border bg-surface placeholder:text-muted focus-visible:ring-accent w-full rounded-md border py-2 pr-8 pl-9 text-sm outline-none focus-visible:ring-2'
        }
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className={
            isSmall
              ? 'text-muted hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2'
              : 'text-muted hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2'
          }
        >
          <X className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        </button>
      )}
    </div>
  );
}
