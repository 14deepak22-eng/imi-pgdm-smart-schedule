/**
 * Site-wide announcement popup, shown once to every visitor.
 *
 * HOW TO USE:
 * - Edit `title` / `message` below to whatever you want to announce.
 * - Bump `id` (e.g. "2026-07-26-fees" -> "2026-08-01-exam") any time you
 *   publish a NEW announcement and want it to show again to everyone,
 *   including people who already dismissed a previous one.
 * - Set `startAt` / `endAt` to control the exact window it's live for.
 *   Outside that window the popup never appears, no matter what.
 *   Both are optional — leave either one `null` for "no limit" on that side.
 * - To turn the popup off entirely regardless of the window, set `enabled: false`.
 *
 * DATE FORMAT: use ISO strings like '2026-07-26T00:00:00+05:30' (IST offset
 * shown). Easiest is to just write the date + time in IST and add the
 * '+05:30' at the end, e.g. '2026-07-27T23:59:59+05:30' for "end of day
 * tomorrow, IST".
 */
export const ANNOUNCEMENT = {
  enabled: true,
  id: 'welcome-2026-07-26',
  title: 'Announcement',
  message: 'Welcome to the IMI PGDM Smart Schedule! Check the Settings page to personalize your view.',
  // Example: live from right now until end of day tomorrow (IST).
  startAt: '2026-07-26T00:00:00+05:30' as string | null,
  endAt: '2026-07-27T23:59:59+05:30' as string | null,
};
