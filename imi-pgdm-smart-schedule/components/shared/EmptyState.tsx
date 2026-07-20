import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      {icon && <div className="text-muted">{icon}</div>}
      <p className="text-foreground font-medium">{title}</p>
      {description && <p className="text-muted max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}
