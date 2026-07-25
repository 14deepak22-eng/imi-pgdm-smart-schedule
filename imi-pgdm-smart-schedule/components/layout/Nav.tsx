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
    // flex-wrap lets the tabs drop to a second row on narrow screens
    // instead of forcing the whole page wider than the viewport — same
    // look and sizing as before, just allowed to wrap when needed.
    <nav className="flex flex-wrap items-center gap-1">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active ? 'bg-surface-2 text-foreground' : 'text-muted hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
