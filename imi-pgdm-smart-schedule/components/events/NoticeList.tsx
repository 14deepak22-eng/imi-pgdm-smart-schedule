import { Bell } from 'lucide-react';
import type { ChangeNotice, NoticeCategory } from '@/lib/schedule/diffSchedule';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatRelativeTime } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

const CATEGORY_TONE: Record<NoticeCategory, 'amber' | 'teal' | 'danger' | 'muted'> = {
  'class-added': 'teal',
  'class-removed': 'danger',
  'class-changed': 'amber',
  'event-added': 'teal',
  'event-removed': 'danger',
  'event-changed': 'amber',
};

interface NoticeListProps {
  title: string;
  notices: ChangeNotice[];
  emptyTitle: string;
  /**
   * IDs already seen as of the START of this page visit — frozen by the
   * caller for the whole visit (not live), so a notice that was new when
   * you arrived keeps its "New" tag and top position for the entire time
   * you're on the page, and only stops being "new" the NEXT time you
   * visit. Omit to render with no "New" tags at all (e.g. nowhere to
   * persist seen-state).
   */
  seenNoticeIds?: Set<string>;
}

export function NoticeList({ title, notices, emptyTitle, seenNoticeIds }: NoticeListProps) {
  // New notices float to the top; within each group (new/not-new) the
  // original newest-first order from the caller is preserved.
  const ordered = seenNoticeIds
    ? [...notices].sort((a, b) => {
        const aNew = !seenNoticeIds.has(a.id) ? 1 : 0;
        const bNew = !seenNoticeIds.has(b.id) ? 1 : 0;
        return bNew - aNew;
      })
    : notices;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-bold tracking-wide uppercase">
        {title} <span className="text-muted font-sans text-sm font-normal">({notices.length})</span>
      </h2>
      {notices.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title={emptyTitle}
          description="Updates made to the sheet will show up here, and stay visible for 1 week."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {ordered.map((notice) => {
            const isNew = seenNoticeIds ? !seenNoticeIds.has(notice.id) : false;
            return (
              <Card
                key={notice.id}
                className={cn(
                  'flex items-center justify-between gap-3 p-4',
                  isNew && 'border-l-4 border-l-accent',
                )}
              >
                <div className="flex items-center gap-2">
                  {isNew && (
                    <Badge tone="amber" className="shrink-0">
                      New
                    </Badge>
                  )}
                  <p className="text-sm">{notice.message}</p>
                </div>
                <Badge tone={CATEGORY_TONE[notice.category]} className="shrink-0">
                  {formatRelativeTime(notice.detectedAt)}
                </Badge>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
