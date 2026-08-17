'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSchedule } from '@/components/providers/ScheduleProvider';
import { isSubjectSelected } from '@/hooks/useSubjectPreferences';
import type { ChangeNotice } from '@/lib/schedule/diffSchedule';
import { cn } from '@/lib/utils/cn';

const LINKS = [
  { href: '/', label: 'Board' },
  { href: '/events', label: 'Events' },
  { href: '/notices', label: 'Notice' },
  { href: '/progress', label: 'Progress' },
  { href: '/feedback', label: 'Feedback' },
  { href: '/settings', label: 'Settings' },
];

// Whether this browser has ever opened Settings — shown as a green dot
// on the Settings tab for brand-new visitors, cleared for good the first
// time they open it (see app/settings/page.tsx). Shared here rather than
// as a separate hook file since Nav is the only place that reads it.
const SETTINGS_VISITED_KEY = 'pgdm-settings-visited';

export function Nav() {
  const pathname = usePathname();
  const { notices, selectedBatch, showAllSections, section, selectedSubjects, subjectLegend, seenNoticeIds } =
    useSchedule();

  // Defaults to "visited" (no dot) so a returning visitor never sees a
  // false flash of the dot before the real value loads from storage.
  const [settingsVisited, setSettingsVisited] = useState(true);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        setSettingsVisited(localStorage.getItem(SETTINGS_VISITED_KEY) === '1');
      } catch {
        setSettingsVisited(true); // storage unavailable — fail closed, no dot
      }
    });
  }, []);

  // Same scoping the Notices page uses to decide what it actually shows
  // you — so a dot here means there's genuinely something new to see,
  // not just noise from an unrelated batch/section/subject.
  const effectiveSection = showAllSections ? 'A' : section;
  const matchesSubject = (n: ChangeNotice) => {
    const codes = n.subjectCodes ?? [];
    return (
      codes.length === 0 ||
      codes.some((code) => isSubjectSelected(selectedSubjects, code, subjectLegend))
    );
  };
  const unseenScopedNotices = notices.filter((n) => {
    if (seenNoticeIds.has(n.id)) return false;
    if (n.batch !== selectedBatch) return false;
    if (!showAllSections && n.section !== effectiveSection) return false;
    if (!matchesSubject(n)) return false;
    return true;
  });

  const hasNoticeUpdate = unseenScopedNotices.length > 0;
  const hasEventUpdate = unseenScopedNotices.some((n) => n.category.startsWith('event-'));

  return (
    // Tighter gap/padding/font on mobile so all 5 tabs fit on one line
    // without wrapping; sm: sizes restore the original, roomier look.
    <nav className="scrollbar-hide flex flex-nowrap items-center gap-0.5 overflow-x-auto sm:flex-wrap sm:gap-1 sm:overflow-visible">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        const showUpdateDot =
          (link.href === '/notices' && hasNoticeUpdate) ||
          (link.href === '/events' && hasEventUpdate);
        // First-visit hint: green, independent of the notice/event
        // "update" dots above — it's about a brand-new visitor never
        // having opened Settings yet, not about anything changing.
        const showFirstVisitDot = link.href === '/settings' && !settingsVisited;
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
            {showUpdateDot && (
              <span
                className="bg-accent-2 border-background absolute top-0 right-0 h-1.5 w-1.5 rounded-full border sm:-top-0.5 sm:-right-0.5"
                aria-label="New update"
              />
            )}
            {showFirstVisitDot && (
              <span
                className="border-background absolute top-0 right-0 h-1.5 w-1.5 rounded-full border bg-green-500 sm:-top-0.5 sm:-right-0.5"
                aria-label="New here — check Settings"
              />
            )}
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
