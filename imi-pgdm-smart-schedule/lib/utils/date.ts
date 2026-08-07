const SESSION_LABELS: Record<string, string> = {
  I: 'Session I',
  II: 'Session II',
  III: 'Session III',
  LUNCH: 'Lunch',
  IV: 'Session IV',
  V: 'Session V',
  VI: 'Session VI',
};

export function sessionLabel(session: string): string {
  return SESSION_LABELS[session] ?? session;
}

/**
 * Formats a Date as a local "yyyy-MM-dd" string, using local calendar
 * fields (getFullYear/getMonth/getDate) rather than Date#toISOString().
 *
 * toISOString() converts to UTC first, which silently shifts the date
 * backward by one day for any timezone ahead of UTC (e.g. India,
 * UTC+5:30) whenever the Date represents local midnight or early
 * morning — exactly the kind of bug that made "this week" show the
 * wrong date range. Always use this instead of
 * `date.toISOString().slice(0, 10)` when the intent is "today's date
 * where the user is", not "today's date in UTC".
 */
export function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Formats a "HH:mm" 24-hour time as "h:mm AM/PM", e.g. "08:30" -> "8:30 AM". */
export function formatTime12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const hour24 = parseInt(hStr, 10);
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${mStr} ${period}`;
}

/** Formats a session's start-end range, e.g. "8:30 AM – 10:00 AM". */
export function formatSessionTimeRange(start: string, end: string): string {
  return `${formatTime12h(start)} – ${formatTime12h(end)}`;
}

/** Formats a millisecond duration as "1h 24m 03s" (or "24m 03s", or "03s"). */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  if (minutes > 0) return `${minutes}m ${pad(seconds)}s`;
  return `${seconds}s`;
}

/** Formats a millisecond duration as "01:24:03" for the flap-digit display. */
export function formatCountdownDigits(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

/** Formats a millisecond duration as "1h 24m" / "24m", rounded to the minute. */
export function formatShortDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${minutes}m`;
}

export function formatDayCountdown(ms: number): string {
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

/**
 * Formats a millisecond duration as "1 day 3 hours" (or just "2 days" if
 * the hour remainder is 0). Meant for countdowns of 24h or longer, where
 * showing raw hours (e.g. "25h") is harder to read than day+hour terms.
 */
export function formatDaysHoursCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);

  const dayLabel = `${days} day${days === 1 ? '' : 's'}`;
  if (hours === 0) return dayLabel;

  return `${dayLabel} ${hours}Hr`;
}

export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Returns midnight of the Monday that starts the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // week starts Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Formats a week's Mon–Sun range, e.g. "3 – 9 Aug 2026". */
export function formatWeekRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = sameMonth
    ? start.getDate().toString()
    : start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const endLabel = end.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${startLabel} – ${endLabel}`;
}

/** Formats an ISO timestamp as a short relative time, e.g. "2h ago", "3d ago". */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}
