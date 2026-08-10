/**
 * Site-wide announcement popup, shown once to every visitor.
 *
 * HOW TO USE:
 * - Edit `title` / `message` below to whatever you want to announce.
 *   For multiple paragraphs/sentences, use a template literal (backticks)
 *   with a blank line between each one — each becomes its own paragraph
 *   in the popup. See the example below.
 * - Bump `id` (e.g. "2026-07-26-fees" -> "2026-08-01-exam") any time you
 *   publish a NEW announcement and want it to show again to everyone,
 *   including people who already dismissed a previous one.
 * - Set `startAt` / `endAt` to control the exact window it's live for.
 *   Outside that window the popup never appears, no matter what.
 *   Both are optional — leave either one `null` for "no limit" on that side.
 * - To turn the popup off entirely regardless of the window, set `enabled: false`.
 * - `videoUrl` is optional — paste any normal YouTube link (a full
 *   youtube.com/watch?v=... link, or a youtu.be/... short link both
 *   work) to show an embedded video in the popup. Leave it `null` for
 *   a text-only announcement.
 * - `imageUrl` is optional — shows a photo in the popup, above the
 *   message. Two ways to set it:
 *     1. Drop the image file into the `public/` folder (e.g.
 *        `public/announcements/fest-poster.jpg`) and set
 *        imageUrl: "/announcements/fest-poster.jpg"
 *     2. Or paste any direct https image URL (must end in the image
 *        itself, not a webpage — e.g. a link that opens straight to a
 *        .jpg/.png, like Google Drive's "uc?export=view&id=..." link
 *        or an Imgur direct link).
 *   Leave it `null` for no photo. If both imageUrl and videoUrl are
 *   set, the photo shows and the video is skipped.
 *
 * DATE FORMAT: use ISO strings like '2026-07-26T00:00:00+05:30' (IST offset
 * shown). Easiest is to just write the date + time in IST and add the
 * '+05:30' at the end, e.g. '2026-07-27T23:59:59+05:30' for "end of day
 * tomorrow, IST".
 */
export const ANNOUNCEMENT = {
  enabled: true,
  id: "sheet-year-error-26ju",
  title: "🔎 Now on Google! 🎉",
  message:`Just search "IMI PGDM Smart Schedule" on Google and you can find the website directly. 🌐
No need to search for the link separately anymore! 😄`,
  videoUrl: null as string | null,
  imageUrl: "/announcements/WhatsApp Image 2026-08-10 at 8.20.09 PM.jpeg" as string | null,
  // Example: live from right now until end of day tomorrow (IST).
  startAt: "2026-08-10T00:00:00+05:30" as string | null,
  endAt: "2026-08-11T17:59:59+05:30" as string | null,
};
