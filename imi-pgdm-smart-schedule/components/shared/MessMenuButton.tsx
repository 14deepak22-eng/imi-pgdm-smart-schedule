'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { MessMenuIcon } from './MessMenuIcon';
import { MessMenuModal } from './MessMenuModal';

export function MessMenuButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open mess menu"
        className="group flex flex-col items-center gap-1 focus-visible:outline-none"
      >
        <span
          className={cn(
            'border-accent text-accent flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-150',
            'group-hover:bg-accent/10 group-hover:brightness-110',
            'group-focus-visible:ring-accent group-focus-visible:ring-offset-background group-focus-visible:ring-2 group-focus-visible:ring-offset-2',
          )}
        >
          <MessMenuIcon className="h-4 w-4" />
        </span>
        <span className="text-muted text-[9px] leading-none font-bold tracking-wide uppercase">
          Mess Menu
        </span>
      </button>

      {open && <MessMenuModal onClose={() => setOpen(false)} />}
    </>
  );
}
