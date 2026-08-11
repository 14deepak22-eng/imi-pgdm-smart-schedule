'use client';

import { useState } from 'react';
import { Plus, Minus, ArrowLeftRight, ArrowRight, ChevronRight, Bell, Users } from 'lucide-react';
import type { ChangeNotice, NoticeCategory } from '@/lib/schedule/diffSchedule';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatRelativeTime } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

// ─────── category → visual config ──────────────────────────────────────────
// Tone reuses the app's existing palette (see globals.css): teal for
// "added" (positive), the shared danger red for "removed", and amber
// (the app's "live now" accent) for "changed" — no new colors introduced.
const CATEGORY_CONFIG: Record<
  NoticeCategory,
  {
    label: string;
    tone: 'added' | 'removed' | 'changed';
    Icon: React.FC<{ className?: string }>;
  }
> = {
  'class-added': { label: 'Class added', tone: 'added', Icon: Plus },
  'class-removed': { label: 'Class removed', tone: 'removed', Icon: Minus },
  'class-changed': { label: 'Class updated', tone: 'changed', Icon: ArrowLeftRight },
  'event-added': { label: 'Event added', tone: 'added', Icon: Plus },
  'event-removed': { label: 'Event removed', tone: 'removed', Icon: Minus },
  'event-changed': { label: 'Event updated', tone: 'changed', Icon: ArrowLeftRight },
};

const TONE_CLASSES: Record<'added' | 'removed' | 'changed', { bg: string; text: string }> = {
  added: { bg: 'bg-accent-2/15', text: 'text-accent-2' },
  removed: { bg: 'bg-danger/15', text: 'text-danger' },
  changed: { bg: 'bg-accent/15', text: 'text-accent' },
};

// ─────── message parser ──────────────────────────────────────────────────
// notice.date and notice.session are already structured fields on
// ChangeNotice, so only the subject code(s) — "before" / "after" — need
// pulling out of the free-text message here.
function parseCodes(message: string): { from: string; to: string | null } {
  // "Class updated on Fri Aug 21 (Session VI): MK630(B) → ST509(B)"
  const changedMatch = message.match(/:\s*(.+?)\s*→\s*(.+)$/);
  if (changedMatch) {
    const [, before, after] = changedMatch;
    return { from: before.trim(), to: after.trim() };
  }

  // "New class added: ST509(B) on Fri Aug 21 (Session VII)"
  const addedMatch = message.match(/(?:added|New (?:class|event)):\s*(.+?)\s+on\s+/);
  if (addedMatch) {
    return { from: addedMatch[1].trim(), to: null };
  }

  // "Class removed: MK630(B) that was on Fri Aug 21 (Session VI)"
  const removedMatch = message.match(/removed:\s*(.+?)\s+that was on\s+/);
  if (removedMatch) {
    return { from: removedMatch[1].trim(), to: null };
  }

  return { from: message, to: null };
}

function formatShortDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

// ─────── single notice row ────────────────────────────────────────────────
function NoticeCard({ notice, isNew }: { notice: ChangeNotice; isNew: boolean }) {
  const [open, setOpen] = useState(false);
  const cfg = CATEGORY_CONFIG[notice.category];
  const tone = TONE_CLASSES[cfg.tone];
  const { from, to } = parseCodes(notice.message);
  const removed = notice.category.endsWith('removed');

  return (
    <div
      onClick={() => setOpen((v) => !v)}
      className="notice-row cursor-pointer rounded-lg transition-colors active:bg-surface-2"
    >
      <div className="flex items-center gap-2.5 px-0.5 py-2.5">
        {/* icon */}
        <div
          className={cn(
            'notice-icon relative flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full',
            tone.bg,
            isNew && 'notice-icon-live',
          )}
          style={isNew ? ({ '--ring-c': `var(--${cfg.tone === 'added' ? 'accent-2' : cfg.tone === 'removed' ? 'danger' : 'accent'})` } as React.CSSProperties) : undefined}
        >
          <cfg.Icon className={cn('notice-icon-glyph h-4 w-4', tone.text)} />
        </div>

        {/* body */}
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1 text-sm leading-snug">
            <code
              className={cn(
                'rounded border border-border bg-surface-2 px-1.5 py-px font-mono text-[11px]',
                removed && 'line-through',
              )}
            >
              {from}
            </code>
            {to && (
              <>
                <ArrowRight className="text-muted h-3 w-3" aria-hidden />
                <code className="rounded border border-border bg-surface-2 px-1.5 py-px font-mono text-[11px] font-medium">
                  {to}
                </code>
              </>
            )}
          </p>
          <p className="text-muted mt-0.5 text-xs">
            {cfg.label}
            {notice.session && <> · {notice.session}</>}
          </p>
        </div>

        {/* time / date, right-aligned */}
        <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
          <span className="text-foreground text-xs whitespace-nowrap">
            {formatRelativeTime(notice.detectedAt)}
          </span>
          <span className="text-muted text-[11px] whitespace-nowrap">
            {formatShortDate(notice.date)}
          </span>
        </div>

        <ChevronRight
          className={cn('text-muted h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200', open && 'rotate-90')}
          aria-hidden
        />
      </div>

      {/* expand: section detail */}
      <div
        className={cn(
          'ml-[38px] overflow-hidden transition-all duration-300',
          open ? 'max-h-8 pb-2 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <span className="bg-surface-2 text-foreground inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px]">
          <Users className="h-3 w-3" aria-hidden />
          Section {notice.section}
        </span>
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
  // Unseen (new) notices are grouped at the top, seen ones below —
  // and each group is sorted date-wise within itself (Day 1 first,
  // then Day 2, etc). This is what makes a just-detected change jump
  // to the top: as soon as it's marked seen (on your next visit to
  // this page), it drops out of the "new" group and takes its normal
  // date-wise place among the rest.
  //
  // seenNoticeIds here is the frozen "seen at visit start" snapshot
  // from the page, so this order stays stable for the whole visit —
  // it won't reshuffle under you mid-scroll just because markSeen ran
  // in the background a moment after you opened the page.
  const isUnseen = (n: ChangeNotice) => (seenNoticeIds ? !seenNoticeIds.has(n.id) : false);
  const ordered = [...notices].sort((a, b) => {
    const aUnseen = isUnseen(a);
    const bUnseen = isUnseen(b);
    if (aUnseen !== bUnseen) return aUnseen ? -1 : 1;
    return a.date.localeCompare(b.date);
  });

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h2 className="text-muted text-[10px] font-bold tracking-[.14em] whitespace-nowrap uppercase">
          {title}
        </h2>
        <span className="border-border bg-surface-2 text-muted rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums">
          {notices.length}
        </span>
        <span className="border-border h-px flex-1 border-t" aria-hidden />
      </div>

      {notices.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title={emptyTitle}
          description="Updates made to the sheet will show up here, and stay visible until their day passes."
        />
      ) : (
        <div className="divide-border divide-y">
          {ordered.map((notice, i) => (
            <div
              key={notice.id}
              className="notice-enter"
              style={{ animationDelay: `${Math.min(i, 8) * 0.05}s` }}
            >
              <NoticeCard
                notice={notice}
                isNew={seenNoticeIds ? !seenNoticeIds.has(notice.id) : false}
              />
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes notice-rise-in {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .notice-enter {
          animation: notice-rise-in 0.4s cubic-bezier(0.22, 0.85, 0.35, 1) both;
        }
        @keyframes notice-pop-in {
          0% { transform: scale(0); }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .notice-icon-glyph {
          animation: notice-pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes notice-ring-pulse {
          0% { box-shadow: 0 0 0 0 var(--ring-c); }
          100% { box-shadow: 0 0 0 8px transparent; }
        }
        .notice-icon-live::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 9999px;
          animation: notice-ring-pulse 1.6s ease-out infinite;
        }
        @keyframes notice-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-14deg); }
          75% { transform: rotate(14deg); }
        }
        .notice-icon-live .notice-icon-glyph {
          animation:
            notice-pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both,
            notice-wiggle 2.4s ease-in-out 1.2s infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .notice-enter, .notice-icon-glyph, .notice-icon-live::after, .notice-icon-live .notice-icon-glyph {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
