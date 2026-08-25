"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  X,
  Coffee,
  UtensilsCrossed,
  Cookie,
  Moon,
  ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/shared/Skeleton";
import { useMessMenu } from "@/hooks/useMessMenu";
import { cn } from "@/lib/utils/cn";
import { MessMenuIcon } from "./MessMenuIcon";
import type { DayMessMenu, MealType } from "@/types/messMenu";
import {
  formatMinutesRemaining,
  getMealServingStatus,
  type MealServingStatus,
} from "@/lib/messMenu/mealTiming";

const MEAL_KEYS: MealType[] = ["breakfast", "lunch", "snacks", "dinner"];

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snacks: "Snacks",
  dinner: "Dinner",
};

const MEAL_ICONS: Record<MealType, ReactNode> = {
  breakfast: <Coffee className="h-3.5 w-3.5" />,
  lunch: <UtensilsCrossed className="h-3.5 w-3.5" />,
  snacks: <Cookie className="h-3.5 w-3.5" />,
  dinner: <Moon className="h-3.5 w-3.5" />,
};

const MEAL_ICONS_LG: Record<MealType, ReactNode> = {
  breakfast: <Coffee className="text-accent h-4 w-4" />,
  lunch: <UtensilsCrossed className="text-accent h-4 w-4" />,
  snacks: <Cookie className="text-accent h-4 w-4" />,
  dinner: <Moon className="text-accent h-4 w-4" />,
};

/** Refreshes the "now serving" status once a minute — no need for anything
 *  finer-grained since the countdown is minute-level. */
function useMealServingStatus(): MealServingStatus {
  const [status, setStatus] = useState<MealServingStatus>(() =>
    getMealServingStatus(),
  );
  useEffect(() => {
    const id = setInterval(() => setStatus(getMealServingStatus()), 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return status;
}

interface NowServingCardProps {
  status: MealServingStatus;
  today: DayMessMenu | undefined;
  tomorrow: DayMessMenu | undefined;
}

/** Flat, full-width strip at the top of the modal — shows whichever meal is
 *  currently open (or coming up next) with its complete item list, not a
 *  truncated preview. This is the one thing the user opens the modal for. */
function NowServingCard({ status, today, tomorrow }: NowServingCardProps) {
  if (status.status === "day-over") {
    const items = tomorrow?.breakfast ?? [];
    return (
      <div className="bg-accent/10 mb-2.5 rounded-xl px-3 py-2.5">
        <div className="mb-1 flex items-center gap-2">
          <Coffee className="text-accent h-4 w-4 flex-shrink-0" />
          <span className="text-accent text-[10.5px] font-bold tracking-wide uppercase">
            Breakfast &middot; tomorrow
          </span>
        </div>
        <p className="text-foreground text-[13px] leading-relaxed">
          {items.length > 0 ? items.join(", ") : "Menu not listed yet"}
        </p>
      </div>
    );
  }

  const meal = status.meal;
  if (!meal) return null;
  const items = today?.[meal] ?? [];
  const isCurrent = status.status === "current";

  return (
    <div className="bg-accent/10 mb-2.5 rounded-xl px-3 py-2.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {MEAL_ICONS_LG[meal]}
          <span className="text-accent text-[10.5px] font-bold tracking-wide uppercase">
            {isCurrent ? "Now serving" : "Next up"} &middot; {MEAL_LABELS[meal]}
          </span>
        </div>
        {status.minutesRemaining !== null && (
          <span className="text-muted flex-shrink-0 text-[10.5px]">
            {formatMinutesRemaining(status.minutesRemaining)}{" "}
            {isCurrent ? "left" : "to go"}
          </span>
        )}
      </div>
      <p className="text-foreground text-[13px] leading-relaxed">
        {items.length > 0 ? items.join(", ") : "Menu not listed for today"}
      </p>
    </div>
  );
}

/** A single plain meal block in the "Today" list — no border, no card, no
 *  expand interaction, just an icon, label, and the full item list. */
function TodayMealBlock({ meal, items }: { meal: MealType; items: string[] }) {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="text-muted mb-0.5 flex items-center gap-1.5 text-[10.5px] font-bold tracking-wide uppercase">
        {MEAL_ICONS[meal]}
        {MEAL_LABELS[meal]}
      </div>
      <p className="text-foreground text-[13.5px] leading-relaxed">
        {items.length > 0 ? items.join(", ") : "\u2014"}
      </p>
    </div>
  );
}

/** A single compact meal row inside the "This week" swipeable card —
 *  truncated to one line since it's a quick-scan preview, not the main event. */
function WeekMealRow({ meal, items }: { meal: MealType; items: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const preview = items.length > 0 ? items.join(", ") : "\u2014";
  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      aria-expanded={expanded}
      className="hover:bg-foreground/[0.04] flex w-full items-center gap-2 rounded-md py-1.5 text-left transition-colors"
    >
      <span className="text-muted flex-shrink-0">{MEAL_ICONS[meal]}</span>
      <div className="min-w-0 flex-1">
        <div className="text-muted text-[9.5px] font-bold tracking-wide uppercase">
          {MEAL_LABELS[meal]}
        </div>
        <div
          className={cn("text-foreground text-[12px]", !expanded && "truncate")}
        >
          {preview}
        </div>
      </div>
      <ChevronDown
        className={cn(
          "text-muted h-3 w-3 flex-shrink-0 transition-transform duration-300",
          expanded && "rotate-180",
        )}
      />
    </button>
  );
}

function WeekDayCard({ day }: { day: DayMessMenu }) {
  return (
    <div className="bg-surface-2 w-full flex-shrink-0 rounded-lg px-3 py-1">
      <div className="divide-border/50 divide-y">
        {MEAL_KEYS.map((meal) => (
          <WeekMealRow key={meal} meal={meal} items={day[meal]} />
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
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const { week, initialLoading, error, refresh } = useMessMenu();
  const servingStatus = useMealServingStatus();
  const now = new Date();
  const todayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowName = tomorrowDate.toLocaleDateString("en-US", {
    weekday: "long",
  });
  const today = week.find((d) => d.day === todayName);
  const tomorrow = week.find((d) => d.day === tomorrowName);

  // The meal already shown in full up top — skip it in the Today list below
  // so the same items aren't printed twice.
  const heroMeal =
    servingStatus.status !== "day-over" ? servingStatus.meal : null;
  const todayMealsToList = MEAL_KEYS.filter((m) => m !== heroMeal);

  // "This week" only needs the days after today — today's already covered
  // by the hero card + the list right above this section.
  const upcomingDays = useMemo(() => {
    if (week.length === 0) return [];
    const idx = week.findIndex((d) => d.day === todayName);
    if (idx === -1) return week;
    return [...week.slice(idx + 1), ...week.slice(0, idx)];
  }, [week, todayName]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedIndexRef = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardWidthRef = useRef(0);
  const dragRef = useRef({
    dragging: false,
    startX: 0,
    baseOffset: 0,
    lastDx: 0,
  });

  const measure = useCallback(() => {
    if (viewportRef.current)
      cardWidthRef.current = viewportRef.current.getBoundingClientRect().width;
  }, []);

  // Purely imperative — moves the track to a given index without touching
  // React state. Used for continuous drag feedback and resize repositioning.
  const positionTrack = useCallback((index: number, animate: boolean) => {
    if (!trackRef.current) return;
    trackRef.current.style.transition = animate
      ? "transform 0.32s cubic-bezier(.22,.9,.35,1)"
      : "none";
    trackRef.current.style.transform = `translateX(${-index * cardWidthRef.current}px)`;
  }, []);

  // User-facing navigation (tab tap, drag release) — updates both the
  // visible track position and the React state that drives the tabs.
  const snapTo = useCallback(
    (index: number, animate: boolean) => {
      const clamped = Math.max(0, Math.min(upcomingDays.length - 1, index));
      selectedIndexRef.current = clamped;
      setSelectedIndex(clamped);
      positionTrack(clamped, animate);
    },
    [upcomingDays.length, positionTrack],
  );

  useEffect(() => {
    measure();
    const clamped = Math.min(
      selectedIndexRef.current,
      Math.max(0, upcomingDays.length - 1),
    );
    selectedIndexRef.current = clamped;
    setSelectedIndex(clamped);
    positionTrack(clamped, false);

    const onResize = () => {
      measure();
      positionTrack(selectedIndexRef.current, false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [upcomingDays.length, measure, positionTrack]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (upcomingDays.length <= 1) return;
    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.baseOffset = -selectedIndex * cardWidthRef.current;
    if (trackRef.current) trackRef.current.style.transition = "none";
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging || !trackRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    dragRef.current.lastDx = dx;
    let offset = dragRef.current.baseOffset + dx;
    const min = -(upcomingDays.length - 1) * cardWidthRef.current;
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
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-3 pt-10 sm:pt-20"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mess-menu-title"
      onClick={onClose}
    >
      <Card
        className="relative max-h-[75vh] w-full max-w-lg overflow-y-auto p-3.5 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-muted hover:text-foreground absolute top-4 right-4"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-2.5 flex items-center gap-2">
          <MessMenuIcon className="text-accent h-5 w-5" />
          <h2
            id="mess-menu-title"
            className="font-display text-lg font-bold tracking-wide uppercase"
          >
            Mess Menu
          </h2>
        </div>

        {initialLoading && (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {!initialLoading && error && (
          <ErrorState message={error} onRetry={refresh} />
        )}

        {!initialLoading && !error && (
          <>
            <NowServingCard
              status={servingStatus}
              today={today}
              tomorrow={tomorrow}
            />

            {today && (
              <section className="mb-3">
                <p className="text-muted mb-1.5 text-[10.5px] font-bold tracking-wide uppercase">
                  Today &middot; {today.day}
                </p>
                {todayMealsToList.map((meal) => (
                  <TodayMealBlock key={meal} meal={meal} items={today[meal]} />
                ))}
              </section>
            )}

            {upcomingDays.length > 0 && (
              <section>
                <p className="text-muted mb-1.5 text-[10.5px] font-bold tracking-wide uppercase">
                  This week
                </p>

                <div className="mb-1.5 flex gap-1 overflow-x-auto pb-0.5">
                  {upcomingDays.map((d, i) => (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => snapTo(i, true)}
                      className={cn(
                        "flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium transition-colors",
                        i === selectedIndex
                          ? "border-accent bg-accent text-background"
                          : "border-border text-muted hover:border-accent/50",
                      )}
                    >
                      {d.day.slice(0, 3)}
                    </button>
                  ))}
                </div>

                <div ref={viewportRef} className="overflow-hidden rounded-lg">
                  <div
                    ref={trackRef}
                    className="flex"
                    style={{ touchAction: "pan-y" }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                  >
                    {upcomingDays.map((d) => (
                      <div key={d.day} className="w-full flex-shrink-0">
                        <WeekDayCard day={d} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {!today && upcomingDays.length === 0 && (
              <p className="text-muted py-8 text-center text-sm">
                No mess menu data found.
              </p>
            )}
          </>
        )}
      </Card>
    </div>,
    document.body,
  );
}
