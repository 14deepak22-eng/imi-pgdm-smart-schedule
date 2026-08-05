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

// ─── category → visual config ────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  NoticeCategory,
  {
    label: string;
    accent: string;       // left bar + icon colour (Tailwind text-*)
    ring: string;         // icon ring bg
    bar: string;          // left accent strip bg
    Icon: React.FC<{ className?: string }>;
  }
> = {
  'class-removed': {
    label: 'Class removed',
    accent: 'text-accent-2',
    ring:   'bg-accent-2/10',
    bar:    'bg-accent-2',
    Icon: (p) => <CalendarMinus {...p} />,
  },
  'class-added': {
    label: 'Class added',
    accent: 'text-danger',
    ring:   'bg-danger/10',
    bar:    'bg-danger',
    Icon: (p) => <CalendarPlus {...p} />,
  },
  'class-changed': {
    label: 'Class updated',
    accent: 'text-accent',
    ring:   'bg-accent/10',
    bar:    'bg-accent',
    Icon: (p) => <ArrowLeftRight {...p} />,
  },
  'event-added': {
    label: 'Event added',
    accent: 'text-danger',
    ring:   'bg-danger/10',
    bar:    'bg-danger',
    Icon: (p) => <CalendarPlus {...p} />,
  },
  'event-removed': {
    label: 'Event removed',
    accent: 'text-accent-2',
    ring:   'bg-accent-2/10',
    bar:    'bg-accent-2',
    Icon: (p) => <CalendarMinus {...p} />,
  },
  'event-changed': {
    label: 'Event updated',
    accent: 'text-accent',
    ring:   'bg-accent/10',
    bar:    'bg-accent',
    Icon: (p) => <ArrowLeftRight {...p} />,
  },
};

// ─── message parser ───────────────────────────────────────────────────────────

/**
 * Pulls the human-readable detail out of diffSchedule's message strings.
 *
 * Class messages look like:
 *   "New class added: ST509(B) on Fri Aug 21 (Session VII)"
 *   "Class removed: MK630(B) that was on Fri Aug 21 (Session VI)"
 *   "Class updated on Fri Aug 21 (Session VI): MK630(B) → ST509(B)"
 *
 * Event messages look like:
 *   "New event: Placement Talk on Sun Aug 23"
 *   "Event removed: Guest Lecture that was on Sun Aug 23"
 *   "Event updated on Sun Aug 23: Guest Lecture → Placement Talk"
 */
function parseMessage(message: string): {
  codes: string[];      // subject codes or event names (may be 1 or 2)
  day: string;          // "Fri Aug 21"
  session: string | null; // "Session VI" or null for events
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
  // "New event: Placement Talk on Sun Aug 23"
  const addedMatch = message.match(/(?:added|New (?:class|event)):\s*(.+?)\s+on\s+(.+?)(?:\s+\(?(Session [^)]+)\)?)?$/);
  if (addedMatch) {
    const [, code, day, session] = addedMatch;
    return {
      codes: [code.trim()],
      day: day.replace(/\(Session.*/, '').trim(),
      session: session?.trim() ?? null,
    };
  }

  // "Class removed: MK630(B) that was on Fri Aug 21 (Session VI)"
  // "Event removed: Guest Lecture that was on Sun Aug 23"
  const removedMatch = message.match(/removed:\s*(.+?)\s+that was on\s+(.+?)(?:\s+\(?(Session [^)]+)\)?)?$/);
  if (removedMatch) {
    const [, code, day, session] = removedMatch;
    return {
      codes: [code.trim()],
      day: day.replace(/\(Session.*/, '').trim(),
      session: session?.trim() ?? null,
    };
  }

  // fallback — show raw message
  return { codes: [message], day: '', session: null };
}

// ─── single notice card ───────────────────────────────────────────────────────

function NoticeCard({ notice }: { notice: ChangeNotice }) {
  const cfg = CATEGORY_CONFIG[notice.category];
  const { codes, day, session } = parseMessage(notice.message);
  const [from, to] = codes.length === 2 ? codes : [codes[0], null];

  return (
    <div className="border-border bg-surface relative flex items-center gap-3 overflow-hidden rounded-xl border-2 px-4 py-3 shadow-[4px_4px_0_0_var(--color-surface-2)]">
      {/* left accent bar */}
      <span className={cn('absolute top-0 left-0 bottom-0 w-[3px] rounded-l-xl', cfg.bar)} aria-hidden />

      {/* icon */}
      <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full', cfg.ring)}>
        <cfg.Icon className={cn('h-4 w-4', cfg.accent)} />
      </div>

      {/* body */}
      <div className="min-w-0 flex-1">
        <p className={cn('font-display text-[11px] font-bold tracking-[.1em] uppercase leading-none mb-1', cfg.accent)}>
          {cfg.label}
        </p>
        <p className="text-foreground flex flex-wrap items-center gap-1 text-xs leading-snug">
          <code className="bg-surface-2 border-border rounded-[4px] border px-1.5 py-px font-mono text-[11px]">
            {from}
          </code>
          {to && (
            <>
              <span className="text-muted">→</span>
              <code className="bg-surface-2 border-border rounded-[4px] border px-1.5 py-px font-mono text-[11px]">
                {to}
              </code>
            </>
          )}
          {day && <span className="text-muted ml-0.5 text-[11px]">· {day}</span>}
        </p>
      </div>

      {/* meta */}
      <div className="flex flex-shrink-0 flex-col items-end gap-1.5 self-start pt-0.5">
        <span className="text-muted text-[11px] whitespace-nowrap">
          {formatRelativeTime(notice.detectedAt)}
        </span>
        {session && (
          <span className="bg-surface-2 border-border text-muted rounded border px-1.5 py-px text-[10px] font-bold tracking-[.08em] uppercase whitespace-nowrap">
            {session}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── exported list ────────────────────────────────────────────────────────────

interface NoticeListProps {
  title: string;
  notices: ChangeNotice[];
  emptyTitle: string;
}

export function NoticeList({ title, notices, emptyTitle }: NoticeListProps) {
  return (
    <section className="flex flex-col gap-3">
      {/* section header */}
      <div className="flex items-center gap-3">
        <h2 className="font-display text-[11px] font-bold tracking-[.12em] uppercase text-muted whitespace-nowrap">
          {title}
        </h2>
        <span className="bg-surface-2 border-border text-muted rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums">
          {notices.length}
        </span>
        <span className="border-border h-px flex-1 border-t" aria-hidden />
      </div>

      {notices.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title={emptyTitle}
          description="Updates made to the sheet will show up here, and stay visible for 1 week."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {notices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}
        </div>
      )}
    </section>
  );
}
