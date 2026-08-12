import type { EventCategory } from '@/types/events';
import { ALL_CATEGORIES, CATEGORY_META } from '@/lib/sheet/categoryMeta';
import { cn } from '@/lib/utils/cn';

interface EventFiltersProps {
  selected: EventCategory[];
  onChange: (categories: EventCategory[]) => void;
}

export function EventFilters({ selected, onChange }: EventFiltersProps) {
  const toggle = (category: EventCategory) => {
    onChange(
      selected.includes(category)
        ? selected.filter((c) => c !== category)
        : [...selected, category],
    );
  };

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by event type">
      {ALL_CATEGORIES.map((category) => {
        const meta = CATEGORY_META[category];
        const active = selected.includes(category);
        return (
          <button
            key={category}
            onClick={() => toggle(category)}
            aria-pressed={active}
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors',
              active
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-border text-muted hover:text-foreground',
            )}
          >
            {meta.label}
          </button>
        );
      })}
      {selected.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="text-muted hover:text-foreground rounded-full px-2.5 py-0.5 text-[11px] font-medium underline-offset-2 hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}
