import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Card className="border-danger/30 flex flex-col items-center gap-3 px-6 py-10 text-center">
      <AlertTriangle className="text-danger h-6 w-6" aria-hidden />
      <div>
        <p className="text-foreground font-medium">Couldn&apos;t load the schedule</p>
        <p className="text-muted mt-1 max-w-sm text-sm">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Card>
  );
}
