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
    // min-w-0 lets this shrink below its content's natural width (flex
    // items don't do this by default), so overflow-x-auto can actually
    // kick in and scroll horizontally on narrow screens — instead of
    // forcing the whole header, and the whole page, wider than the
    // viewport the way 5 un-wrapped tabs otherwise would.
    <nav className="min-w-0 flex-1 overflow-x-auto sm:flex-none">
      <div className="flex items-center gap-1">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                active ? 'bg-surface-2 text-foreground' : 'text-muted hover:text-foreground',
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
