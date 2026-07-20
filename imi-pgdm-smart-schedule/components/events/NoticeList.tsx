import { Bell } from 'lucide-react';
import type { ChangeNotice, NoticeCategory } from '@/lib/schedule/diffSchedule';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatRelativeTime } from '@/lib/utils/date';

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
}

export function NoticeList({ title, notices, emptyTitle }: NoticeListProps) {
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
          {notices.map((notice) => (
            <Card key={notice.id} className="flex items-center justify-between gap-3 p-4">
              <p className="text-sm">{notice.message}</p>
              <Badge tone={CATEGORY_TONE[notice.category]} className="shrink-0">
                {formatRelativeTime(notice.detectedAt)}
              </Badge>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
