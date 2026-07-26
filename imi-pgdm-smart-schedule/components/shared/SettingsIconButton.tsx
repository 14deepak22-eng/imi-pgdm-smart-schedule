import Link from 'next/link';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function SettingsIconButton() {
  return (
    <Link
      href="/settings"
      aria-label="Open settings"
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors',
        'bg-transparent text-foreground hover:bg-surface-2',
        'focus-visible:ring-accent focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
      )}
    >
      <Settings className="h-4 w-4" />
    </Link>
  );
}
