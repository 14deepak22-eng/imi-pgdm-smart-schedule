import {
  CalendarMinus,
  CalendarPlus,
  ArrowLeftRight,
  Bell,
} from 'lucide-react';
import type { ChangeNotice, NoticeCategory } from '@/lib/schedule/diffSchedule';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatRelativeTime } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

// ─────── category → visual config ──────────────────────────────────────────
const CATEGORY_CONFIG: Record<
  NoticeCategory,
  {
    label: string;
    colorName: 'removed' | 'added' | 'changed';
    Icon: React.FC<{ className?: string }>;
  }
> = {
  'class-removed': {
    label: 'Class removed',
    colorName: 'removed',
    Icon: (p) => <CalendarMinus {...p} />,
  },
  'class-added': {
    label: 'Class added',
    colorName: 'added',
    Icon: (p) => <CalendarPlus {...p} />,
  },
  'class-changed': {
    label: 'Class updated',
    colorName: 'changed',
    Icon: (p) => <ArrowLeftRight {...p} />,
  },
  'event-added': {
    label: 'Event added',
    colorName: 'added',
    Icon: (p) => <CalendarPlus {...p} />,
  },
  'event-removed': {
    label: 'Event removed',
    colorName: 'removed',
    Icon: (p) => <CalendarMinus {...p} />,
  },
  'event-changed': {
    label: 'Event updated',
    colorName: 'changed',
    Icon: (p) => <ArrowLeftRight {...p} />,
  },
};

// ─────── color palette (matches your design) ─────────────────────────────
const COLOR_PALETTE = {
  removed: {
    bar: 'bg-[#4caf82]', // green
    icon: 'text-[#4caf82]',
    ring: 'bg-[rgba(76,175,130,.15)]',
    title: 'text-[#4caf82]',
  },
  added: {
    bar: 'bg-[#e2604f]', // danger/red
    icon: 'text-[#e2604f]',
    ring: 'bg-[rgba(226,96,79,.15)]',
    title: 'text-[#e2604f]',
  },
  changed: {
    bar: 'bg-[#f0c179]', // amber-soft
    icon: 'text-[#f0c179]',
    ring: 'bg-[rgba(232,163,61,.15)]',
    title: 'text-[#f0c179]',
  },
};

// ─────── message parser ──────────────────────────────────────────────────
function parseMessage(message: string): {
  codes: string[];
  day: string;
  session: string | null;
} {
  // "Class updated on Fri Aug 21 (Session VI): MK630(B) → ST509(B)"
  const changedMatch = message.match(
    /updated on (.+?)\s*\(?(Session [^)]+)?\)?\s*:\s*(.+?)\s*→\s*(.+)/,
  );
  if (changedMatch) {
    const [, day, session, before, after] = changedMatch;
    return {
      codes: [before.trim(), after.trim()],
      day: day.trim(),
      session: session?.trim() ?? null,
    };
  }

  // "New class added: ST509(B) on Fri Aug 21 (Session VII)"
  const addedMatch = message.match(
    /(?:added|New (?:class|event)):\s*(.+?)\s+on\s+(.+?)(?:\s+\(?(Session [^)]+)\)?)?$/,
  );
  if (addedMatch) {
    const [, code, day, session] = addedMatch;
    return {
      codes: [code.trim()],
      day: day.replace(/\(Session.*/, '').trim(),
      session: session?.trim() ?? null,
    };
  }

  // "Class removed: MK630(B) that was on Fri Aug 21 (Session VI)"
  const removedMatch = message.match(
    /removed:\s*(.+?)\s+that was on\s+(.+?)(?:\s+\(?(Session [^)]+)\)?)?$/,
  );
  if (removedMatch) {
    const [, code, day, session] = removedMatch;
    return {
      codes: [code.trim()],
      day: day.replace(/\(Session.*/, '').trim(),
      session: session?.trim() ?? null,
    };
  }

  return { codes: [message], day: '', session: null };
}

// ─────── single notice card ───────────────────────────────────────────────
function NoticeCard({ notice, isNew }: { notice: ChangeNotice; isNew: boolean }) {
  const cfg = CATEGORY_CONFIG[notice.category];
  const colors = COLOR_PALETTE[cfg.colorName];
  const { codes, day, session } = parseMessage(notice.message);
  const [from, to] = codes.length === 2 ? codes : [codes[0], null];

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 overflow-hidden rounded-xl border-2',
        'border-[rgba(243,241,234,0.12)] bg-[#1b1f2a] px-4 py-3',
        'transition-colors duration-150 hover:border-[rgba(243,241,234,0.22)]',
        isNew && 'border-[rgba(232,163,61,0.4)]',
      )}
    >
      {/* left accent bar */}
      <span
        className={cn('absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl', colors.bar)}
        aria-hidden
      />

      {/* icon */}
      <div
        className={cn(
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
          colors.ring,
        )}
      >
        <cfg.Icon className={cn('h-4 w-4', colors.icon)} />
      </div>

      {/* body */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'mb-1 flex items-center gap-1.5 font-display text-xs font-bold uppercase leading-none tracking-[.07em]',
            colors.title,
          )}
        >
          {cfg.label}
          {isNew && (
            <span className="rounded-full bg-[rgba(232,163,61,0.18)] px-1.5 py-0.5 text-[9px] font-bold tracking-[.08em] text-[#e8a33d]">
              NEW
            </span>
          )}
        </p>
        <p className="flex flex-wrap items-center gap-1 text-xs leading-snug text-[#f3f1ea]">
          <code className="rounded border border-[rgba(243,241,234,0.12)] bg-[#232837] px-1.5 py-px font-mono text-[11px] text-[#f3f1ea]">
            {from}
          </code>
          {to && (
            <>
              <span className="text-[#8a8f9c]">→</span>
              <code className="rounded border border-[rgba(243,241,234,0.12)] bg-[#232837] px-1.5 py-px font-mono text-[11px] text-[#f3f1ea]">
                {to}
              </code>
            </>
          )}
          {day && <span className="ml-0.5 text-[11px] text-[#8a8f9c]">· {day}</span>}
        </p>
      </div>

      {/* meta */}
      <div className="flex flex-shrink-0 flex-col items-end gap-1 self-start pt-0.5">
        <span className="whitespace-nowrap text-[11px] text-[#8a8f9c]">
          {formatRelativeTime(notice.detectedAt)}
        </span>
        {session && (
          <span className="rounded border border-[rgba(243,241,234,0.12)] bg-[#232837] px-1.5 py-px text-[9px] font-bold uppercase tracking-[.1em] text-[#8a8f9c]">
            {session}
          </span>
        )}
      </div>
    </div>
  );
}

// ─────── exported list ────────────────────────────────────────────────────
interface NoticeListProps {
  title: string;
  notices: ChangeNotice[];
  emptyTitle: string;
  seenNoticeIds?: Set<string>;
}

export function NoticeList({ title, notices, emptyTitle, seenNoticeIds }: NoticeListProps) {
  // Chronological by the day the change actually affects — Day 1 first,
  // then Day 2, etc. — NOT by when it was detected or whether it's new
  // (a "new" tag marks new ones in place; it no longer reorders the list,
  // since jumping new items to the top was breaking day order).
  // Array.prototype.sort is stable, so same-day notices keep their
  // existing relative order (newest-detected-first) as a tiebreaker.
  const ordered = [...notices].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section className="flex flex-col gap-3">
      {/* section header */}
      <div className="flex items-center gap-3">
        <h2 className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[.14em] text-[#8a8f9c]">
          {title}
        </h2>
        <span className="rounded-full border border-[rgba(243,241,234,0.12)] bg-[#232837] px-2 py-0.5 text-[10px] font-bold tabular-nums text-[#8a8f9c]">
          {notices.length}
        </span>
        <span className="h-px flex-1 border-t border-[rgba(243,241,234,0.12)]" aria-hidden />
      </div>

      {notices.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title={emptyTitle}
          description="Updates made to the sheet will show up here, and stay visible for 1 week."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {ordered.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              isNew={seenNoticeIds ? !seenNoticeIds.has(notice.id) : false}
            />
          ))}
        </div>
      )}
    </section>
  );
}
