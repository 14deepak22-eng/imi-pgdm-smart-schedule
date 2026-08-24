'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { X, Coffee, UtensilsCrossed, Cookie, Moon, ChevronDown, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/shared/ErrorState';
import { Skeleton } from '@/components/shared/Skeleton';
import { useMessMenu } from '@/hooks/useMessMenu';
import { cn } from '@/lib/utils/cn';
import { MessMenuIcon } from './MessMenuIcon';
import type { DayMessMenu, MealType } from '@/types/messMenu';
import {
  formatMealTimeRange,
  formatMinutesRemaining,
  getMealServingStatus,
  type MealServingStatus,
} from '@/lib/messMenu/mealTiming';

const MEAL_KEYS: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
};

const MEAL_ICONS: Record<MealType, ReactNode> = {
  breakfast: <Coffee className="h-3.5 w-3.5" />,
  lunch: <UtensilsCrossed className="h-3.5 w-3.5" />,
  snacks: <Cookie className="h-3.5 w-3.5" />,
  dinner: <Moon className="h-3.5 w-3.5" />,
};

const MEAL_ICONS_LG: Record<MealType, ReactNode> = {
  breakfast: <Coffee className="text-accent h-5 w-5" />,
  lunch: <UtensilsCrossed className="text-accent h-5 w-5" />,
  snacks: <Cookie className="text-accent h-5 w-5" />,
  dinner: <Moon className="text-accent h-5 w-5" />,
};

/** Refreshes the "now serving" status once a minute — no need for anything
 *  finer-grained since the countdown is minute-level. */
function useMealServingStatus(): MealServingStatus {
  const [status, setStatus] = useState<MealServingStatus>(() => getMealServingStatus());
  useEffect(() => {
    const id = setInterval(() => setStatus(getMealServingStatus()), 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return status;
}

/** Two rising "steam" wisps over a meal icon — shown only while that meal is actively being served. */
function Steam() {
  return (
    <>
      <span
        className="absolute bottom-3 left-1 h-1.5 w-[2.5px] rounded-full"
        style={{
          background: 'color-mix(in srgb, var(--color-accent) 60%, transparent)',
          animation: 'mess-steam-rise 1.8s ease-in infinite',
        }}
        aria-hidden="true"
      />
      <span
        className="absolute bottom-3 left-3 h-1.5 w-[2.5px] rounded-full"
        style={{
          background: 'color-mix(in srgb, var(--color-accent) 60%, transparent)',
          animation: 'mess-steam-rise 1.8s ease-in infinite',
          animationDelay: '0.6s',
        }}
        aria-hidden="true"
      />
    </>
  );
}

function NowBadge({ label }: { label: 'NOW' | 'NEXT' }) {
  const isNow = label === 'NOW';
  return (
    <span
      className={cn(
        'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
        isNow ? 'bg-accent/15 text-accent' : 'bg-accent-2/15 text-accent-2',
      )}
      style={isNow ? { animation: 'mess-badge-pulse 1.8s ease-out infinite' } : undefined}
    >
      {label}
    </span>
  );
}

interface NowServingCardProps {
  status: MealServingStatus;
  today: DayMessMenu | undefined;
  tomorrow: DayMessMenu | undefined;
}

function NowServingCard({ status, today, tomorrow }: NowServingCardProps) {
  if (status.status === 'day-over') {
    const items = tomorrow?.breakfast ?? [];
    return (
      <div className="border-accent/30 bg-accent/[0.06] relative mb-2.5 flex items-center gap-2.5 rounded-xl border px-3 py-2.5">
        <Coffee className="text-accent h-4 w-4 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-muted text-[9.5px] font-bold tracking-wide uppercase">Breakfast &middot; tomorrow</p>
          <p className="text-foreground truncate text-xs">{items.length > 0 ? items.join(', ') : 'Menu not listed yet'}</p>
        </div>
      </div>
    );
  }

  const meal = status.meal;
  if (!meal) return null;
  const items = today?.[meal] ?? [];
  const isCurrent = status.status === 'current';

  return (
    <div className="border-accent/30 bg-accent/[0.08] relative mb-2.5 flex items-center gap-2.5 rounded-xl border px-3 py-2.5">
      <div className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
        {MEAL_ICONS_LG[meal]}
        {isCurrent && <Steam />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-accent text-[9.5px] font-bold tracking-wide uppercase">
          {isCurrent ? 'Now serving' : 'Next up'} &middot; {MEAL_LABELS[meal]}
        </p>
        <p className="text-foreground truncate text-xs">
          {items.length > 0 ? items.join(', ') : 'Menu not listed for today'}
        </p>
      </div>
      {status.minutesRemaining !== null && (
        <span className="text-muted flex-shrink-0 text-[10px]">
          {formatMinutesRemaining(status.minutesRemaining)} {isCurrent ? 'left' : 'to go'}
        </span>
      )}
    </div>
  );
}

interface MealRowProps {
  meal: MealType;
  items: string[];
  isNow: boolean;
  isNext: boolean;
  expanded: boolean;
  onToggle: () => void;
}

function MealRow({ meal, items, isNow, isNext, expanded, onToggle }: MealRowProps) {
  const preview = items.length > 0 ? items.join(', ') : '\u2014';
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="hover:bg-foreground/[0.03] flex w-full items-center gap-2 rounded-md py-1.5 text-left transition-colors"
      >
        <span className={cn('flex-shrink-0', isNow ? 'text-accent' : 'text-muted')}>{MEAL_ICONS[meal]}</span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'mb-0.5 flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase',
              isNow ? 'text-accent' : 'text-muted',
            )}
          >
            {MEAL_LABELS[meal]}
            {isNow && <NowBadge label="NOW" />}
            {isNext && <NowBadge label="NEXT" />}
          </span>
          <span className="text-foreground block truncate text-xs">{preview}</span>
        </span>
        <ChevronDown
          className={cn(
            'text-muted h-3.5 w-3.5 flex-shrink-0 transition-transform duration-300',
            expanded && 'rotate-180',
          )}
        />
      </button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-in-out',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="border-border/60 mt-0.5 space-y-1 border-t py-1.5 pl-[22px]">
            <p className="text-foreground text-xs leading-relaxed">{items.length > 0 ? items.join(', ') : '\u2014'}</p>
            <p className="text-accent flex items-center gap-1 text-[10.5px]">
              <Clock className="h-3 w-3" />
              {formatMealTimeRange(meal)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DayCard({
  day,
  isToday,
  servingStatus,
}: {
  day: DayMessMenu;
  isToday: boolean;
  servingStatus: MealServingStatus;
}) {
  const [expanded, setExpanded] = useState<Set<MealType>>(new Set());
  const toggle = (meal: MealType) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(meal)) next.delete(meal);
      else next.add(meal);
      return next;
    });

  return (
    <div className="border-border bg-surface w-full flex-shrink-0 rounded-xl border-2 px-3 py-2.5">
      <p className="text-accent mb-1 text-[10px] font-bold tracking-wide uppercase">
        {isToday ? `Today \u00b7 ${day.day}` : day.day}
      </p>
      <div className="divide-border/60 divide-y">
        {MEAL_KEYS.map((meal) => (
          <MealRow
            key={meal}
            meal={meal}
            items={day[meal]}
            isNow={isToday && servingStatus.status === 'current' && servingStatus.meal === meal}
            isNext={isToday && servingStatus.status !== 'current' && servingStatus.meal === meal}
            expanded={expanded.has(meal)}
            onToggle={() => toggle(meal)}
          />
        ))}
      </div>
    </div>
  );
}

interface MessMenuModalProps {
  onClose: () => void;
}

export function MessMenuModal({ onClose }: MessMenuModalProps) {
  // Portals need the DOM, which only exists client-side after mount —
  // this also doubles as the guard that stops the modal from ever
  // rendering during SSR.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Lock background scroll while the modal is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const { week, initialLoading, error, refresh } = useMessMenu();
  const servingStatus = useMealServingStatus();
  const now = new Date();
  const todayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowName = tomorrowDate.toLocaleDateString('en-US', { weekday: 'long' });
  const today = week.find((d) => d.day === todayName);
  const tomorrow = week.find((d) => d.day === tomorrowName);

  // Reorder the week to start from today so the tabs/swiper read
  // "Today, tomorrow, the day after..." instead of always Monday-first.
  const displayDays = useMemo(() => {
    if (week.length === 0) return [];
    const idx = week.findIndex((d) => d.day === todayName);
    if (idx === -1) return week;
    return [...week.slice(idx), ...week.slice(0, idx)];
  }, [week, todayName]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedIndexRef = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardWidthRef = useRef(0);
  const dragRef = useRef({ dragging: false, startX: 0, baseOffset: 0, lastDx: 0 });

  const measure = useCallback(() => {
    if (viewportRef.current) cardWidthRef.current = viewportRef.current.getBoundingClientRect().width;
  }, []);

  // Purely imperative — moves the track to a given index without touching
  // React state. Used for continuous drag feedback and resize repositioning.
  const positionTrack = useCallback((index: number, animate: boolean) => {
    if (!trackRef.current) return;
    trackRef.current.style.transition = animate ? 'transform 0.32s cubic-bezier(.22,.9,.35,1)' : 'none';
    trackRef.current.style.transform = `translateX(${-index * cardWidthRef.current}px)`;
  }, []);

  // User-facing navigation (tab tap, drag release) — updates both the
  // visible track position and the React state that drives tabs/dots.
  const snapTo = useCallback(
    (index: number, animate: boolean) => {
      const clamped = Math.max(0, Math.min(displayDays.length - 1, index));
      selectedIndexRef.current = clamped;
      setSelectedIndex(clamped);
      positionTrack(clamped, animate);
    },
    [displayDays.length, positionTrack],
  );

  useEffect(() => {
    measure();
    const clamped = Math.min(selectedIndexRef.current, Math.max(0, displayDays.length - 1));
    selectedIndexRef.current = clamped;
    setSelectedIndex(clamped);
    positionTrack(clamped, false);

    const onResize = () => {
      measure();
      positionTrack(selectedIndexRef.current, false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [displayDays.length, measure, positionTrack]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (displayDays.length <= 1) return;
    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.baseOffset = -selectedIndex * cardWidthRef.current;
    if (trackRef.current) trackRef.current.style.transition = 'none';
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging || !trackRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    dragRef.current.lastDx = dx;
    let offset = dragRef.current.baseOffset + dx;
    const min = -(displayDays.length - 1) * cardWidthRef.current;
    if (offset > 0) offset *= 0.35;
    if (offset < min) offset = min + (offset - min) * 0.35;
    trackRef.current.style.transform = `translateX(${offset}px)`;
  };

  const handlePointerUp = () => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    const dx = dragRef.current.lastDx;
    dragRef.current.lastDx = 0;
    if (Math.abs(dx) > cardWidthRef.current * 0.2) {
      snapTo(selectedIndex + (dx < 0 ? 1 : -1), true);
    } else {
      snapTo(selectedIndex, true);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-16 sm:pt-24"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mess-menu-title"
      onClick={onClose}
    >
      <Card
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-muted hover:text-foreground absolute top-4 right-4"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-3 flex items-center gap-2">
          <MessMenuIcon className="text-accent h-5 w-5" />
          <h2 id="mess-menu-title" className="font-display text-lg font-bold tracking-wide uppercase">
            Mess Menu
          </h2>
        </div>

        {initialLoading && (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {!initialLoading && error && <ErrorState message={error} onRetry={refresh} />}

        {!initialLoading && !error && (
          <>
            <NowServingCard status={servingStatus} today={today} tomorrow={tomorrow} />

            {displayDays.length > 0 && (
              <>
                {/* Day tabs */}
                <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
                  {displayDays.map((d, i) => (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => snapTo(i, true)}
                      className={cn(
                        'flex-shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
                        i === selectedIndex
                          ? 'border-accent bg-accent text-background'
                          : 'border-border text-muted hover:border-accent/50',
                      )}
                    >
                      {i === 0 ? 'Today' : d.day.slice(0, 3)}
                    </button>
                  ))}
                </div>

                {/* Swipeable day card */}
                <div ref={viewportRef} className="overflow-hidden rounded-xl">
                  <div
                    ref={trackRef}
                    className="flex"
                    style={{ touchAction: 'pan-y' }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                  >
                    {displayDays.map((d, i) => (
                      <div key={d.day} className="w-full flex-shrink-0">
                        <DayCard day={d} isToday={i === 0} servingStatus={servingStatus} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {displayDays.length === 0 && (
              <p className="text-muted py-8 text-center text-sm">No mess menu data found.</p>
            )}
          </>
        )}
      </Card>
    </div>,
    document.body,
  );
}
