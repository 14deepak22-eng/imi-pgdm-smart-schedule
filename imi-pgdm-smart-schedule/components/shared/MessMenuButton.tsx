'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { ForkGlyph, SpoonGlyph } from './MessMenuIcon';
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
            'text-white flex h-7 w-7 -translate-y-0.5 items-center justify-center overflow-hidden rounded-full p-1 transition-all duration-150 sm:h-9 sm:w-9 sm:translate-y-0 sm:p-1.5',
            'shadow-[0_0_0_2px_var(--color-accent),0_0_6px_1.5px_rgba(201,122,34,0.45)] sm:shadow-[0_0_0_2.5px_var(--color-accent),0_0_8px_2px_rgba(201,122,34,0.45)]',
            'group-hover:bg-accent/10 group-hover:brightness-110',
            'group-focus-visible:ring-accent group-focus-visible:ring-offset-background group-focus-visible:ring-2 group-focus-visible:ring-offset-2',
          )}
        >
          <span className="relative h-full w-full">
            <ForkGlyph
              className="absolute inset-0"
              style={{
                transformOrigin: '50% 100%',
                animation: 'mess-fork-swing 2s cubic-bezier(0.6,0,0.2,1) infinite',
              }}
            />
            <SpoonGlyph
              className="absolute inset-0"
              style={{
                transformOrigin: '50% 100%',
                animation: 'mess-spoon-swing 2s cubic-bezier(0.6,0,0.2,1) infinite',
              }}
            />
          </span>
        </span>
        <span className="text-muted text-[8px] leading-none font-bold tracking-wide uppercase sm:text-[9px]">
          Mess Menu
        </span>
      </button>

      {open && <MessMenuModal onClose={() => setOpen(false)} />}
    </>
  );
}
