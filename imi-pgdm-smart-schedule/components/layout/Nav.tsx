'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const LINKS = [
  { href: '/', label: 'Board' },
  { href: '/events', label: 'Events' },
  { href: '/notices', label: 'Notice' },
  { href: '/progress', label: 'Progress' },
  { href: '/settings', label: 'Settings' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    // Tighter gap/padding/font on mobile so all 5 tabs fit on one line
    // without wrapping; sm: sizes restore the original, roomier look.
    <nav className="scrollbar-hide flex flex-nowrap items-center gap-0.5 overflow-x-auto sm:flex-wrap sm:gap-1 sm:overflow-visible">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'relative shrink-0 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors duration-200 sm:px-3 sm:py-1.5 sm:text-sm',
              active ? 'bg-surface-2 text-foreground' : 'text-muted hover:text-foreground',
            )}
          >
            {link.label}
            <span
              className={cn(
                'bg-accent absolute right-2 -bottom-px left-2 h-0.5 rounded-full transition-transform duration-200 sm:right-3 sm:left-3',
                active ? 'scale-x-100' : 'scale-x-0',
              )}
              aria-hidden
            />
          </Link>
        );
      })}
    </nav>
  );
}
