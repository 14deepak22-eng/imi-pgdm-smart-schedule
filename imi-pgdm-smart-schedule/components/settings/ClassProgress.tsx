import { CalendarCheck2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import type { AvailableSubject } from '@/lib/schedule/deriveAvailableSubjects';

interface ClassProgressProps {
  subjects: AvailableSubject[];
  counts: Record<string, number>;
}

export function ClassProgress({ subjects, counts }: ClassProgressProps) {
  const totalCompleted = subjects.reduce((sum, s) => sum + (counts[s.key] ?? 0), 0);
  const maxCount = Math.max(1, ...subjects.map((s) => counts[s.key] ?? 0));

  if (subjects.length === 0) {
    return (
      <EmptyState
        icon={<CalendarCheck2 className="h-5 w-5" />}
        title="No subjects to track yet"
        description="Pick your subjects in Settings and they'll show up here with a running class count."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted text-sm">
        {totalCompleted} total class{totalCompleted === 1 ? '' : 'es'} completed so far, counted
        straight from the schedule.
      </p>

      <div className="flex flex-col gap-2">
        {subjects.map((subject) => {
          const count = counts[subject.key] ?? 0;
          const widthPct = Math.round((count / maxCount) * 100);
          return (
            <Card key={subject.key} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-sm font-medium">{subject.key}</span>
                <span className="tabular text-accent-2 shrink-0 font-mono text-sm font-semibold">
                  {count} class{count === 1 ? '' : 'es'}
                </span>
              </div>
              <div className="bg-surface-2 h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-accent-2 h-full rounded-full transition-all"
                  style={{ width: count > 0 ? `${widthPct}%` : '0%' }}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
