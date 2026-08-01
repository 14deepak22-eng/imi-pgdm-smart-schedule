import { Radio, ArrowRight, CalendarClock, CalendarX } from "lucide-react";
import type { ClassCountdownState } from "@/hooks/useCountdown";
import type { SubjectLegendEntry } from "@/lib/sheet/parseSubjectNames";
import { resolveSubjectIdentity } from "@/lib/sheet/resolveSubjectIdentity";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FlapDigits } from "./FlapDigits";
import { formatCountdownDigits, formatDaysHoursCountdown, sessionLabel } from "@/lib/utils/date";
import { Skeleton } from "@/components/shared/Skeleton";
import { cn } from "@/lib/utils/cn";

interface NextClassCardProps {
  state: ClassCountdownState;
  /** Subject code → {name, faculty}, auto-fetched from the sheet's legend tab. Used to show the faculty name below the room. */
  subjectLegend: Record<string, SubjectLegendEntry>;
}

export function NextClassCard({ state, subjectLegend }: NextClassCardProps) {
  if (state.kind === "not-ready") {
    return (
      <Card className="p-6 sm:p-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-12 w-64" />
        <Skeleton className="mt-4 h-4 w-40" />
      </Card>
    );
  }

  if (state.kind === "schedule-ended") {
    return (
      <Card className="flex flex-col items-center gap-2 p-8 text-center">
        <CalendarX className="text-muted h-6 w-6" aria-hidden />
        <p className="font-display text-2xl font-bold tracking-wide uppercase">
          Board is clear
        </p>
        <p className="text-muted text-sm">
          No more sessions found in the published schedule.
        </p>
      </Card>
    );
  }

  const isLive = state.kind === "live-now";
  const session = state.session;
  const msValue = isLive ? state.msRemaining : state.msUntilStart;
  // Past 24 hours, "25h 03m 12s" is harder to read than "1 day 1 hour" —
  // switch to day+hour wording instead of letting the flap clock's hour
  // count climb past 24.
  const isDayScale = msValue >= 24 * 60 * 60 * 1000;
  const digits = formatCountdownDigits(msValue);
  const dayCountdownText = formatDaysHoursCountdown(msValue);
  const primaryEntry = session.entries[0];
  const extraCount = session.entries.length - 1;
  const faculty = primaryEntry
    ? resolveSubjectIdentity(primaryEntry.subjectCode, subjectLegend).faculty
    : undefined;
  // Reconstructs the full code exactly as it'd appear in the sheet,
  // including the trailing section letter if this subject is split
  // (e.g. "ST509(B)" + section "A" → "ST509(B)(A)") — without that, the
  // heading would silently drop the section on split subjects.
 const primaryLabel = primaryEntry?.subjectCode ?? "Class";

  return (
    <Card
      className={cn(
        "overflow-hidden p-6 transition-shadow duration-500 sm:p-8",
        isLive
          ? "ring-accent/40 shadow-[0_0_0_1px_var(--color-accent),0_0_28px_-8px_rgba(232,163,61,0.45)]"
          : "shadow-[0_0_0_1px_rgba(79,182,168,0.25),0_0_24px_-10px_rgba(79,182,168,0.3)]",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isLive ? (
            <Badge tone="amber" className="gap-1.5">
              <Radio className="h-3 w-3 animate-pulse" /> Live now
            </Badge>
          ) : (
            <Badge tone="teal" className="gap-1.5">
              <ArrowRight className="h-3 w-3" />
              {state.kind === "upcoming-today" ? "Next up today" : "Next class"}
            </Badge>
          )}
          <span className="text-muted text-sm">
            {sessionLabel(session.session)}
          </span>
        </div>
        <span className="text-muted flex items-center gap-1.5 text-xs">
          <CalendarClock className="h-3.5 w-3.5" />
          {new Date(session.start).toLocaleDateString("en-IN", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-3xl leading-none font-extrabold tracking-wide uppercase sm:text-4xl">
            {primaryLabel}
          </p>
          {primaryEntry?.room && (
            <p className="text-muted mt-2 text-sm">Room {primaryEntry.room}</p>
          )}
          {faculty && <p className="text-muted mt-0.5 text-sm">{faculty}</p>}
          {extraCount > 0 && (
            <p className="text-muted mt-1 text-xs">
              +{extraCount} more offering{extraCount > 1 ? "s" : ""} in this
              slot
            </p>
          )}
        </div>

        <div className="flex flex-col items-start gap-1 sm:items-end">
          <span className="text-muted text-xs tracking-wide uppercase">
            {isLive ? "Time remaining" : "Starts in"}
          </span>
          {isDayScale ? (
            <span
              className={cn(
                "font-display text-2xl font-bold tracking-wide sm:text-3xl",
                isLive ? "text-accent" : "text-accent-2",
              )}
            >
              {dayCountdownText}
            </span>
          ) : (
            <FlapDigits value={digits} tone={isLive ? "amber" : "teal"} />
          )}
        </div>
      </div>
    </Card>
  );
}
