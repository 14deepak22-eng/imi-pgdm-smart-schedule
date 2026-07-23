import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ClassProgressProps {
  availableSubjects: string[];
  counts: Record<string, number>;
}

export function ClassProgress({ availableSubjects, counts }: ClassProgressProps) {
  const totalCompleted = availableSubjects.reduce((sum, code) => sum + (counts[code] ?? 0), 0);

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="font-display text-lg font-bold tracking-wide uppercase">Class Progress</h2>
        <p className="text-muted mt-1 text-sm">
          How many classes of each subject have already happened, counted straight from the
          schedule — updates automatically as the term goes on.
        </p>
      </div>

      {availableSubjects.length === 0 ? (
        <p className="text-muted text-sm">No subjects found yet.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {availableSubjects.map((code) => {
              const count = counts[code] ?? 0;
              return (
                <div
                  key={code}
                  className="border-border bg-surface-2 flex items-center justify-between gap-3 rounded-md border px-4 py-2.5"
                >
                  <span className="text-sm font-medium">{code}</span>
                  <Badge tone={count > 0 ? 'teal' : 'muted'}>
                    {count} class{count === 1 ? '' : 'es'} done
                  </Badge>
                </div>
              );
            })}
          </div>
          <p className="text-muted text-xs">
            {totalCompleted} total class{totalCompleted === 1 ? '' : 'es'} completed across all
            subjects.
          </p>
        </>
      )}
    </Card>
  );
}
