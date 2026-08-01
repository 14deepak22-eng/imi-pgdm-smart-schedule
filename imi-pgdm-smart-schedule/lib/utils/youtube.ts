/**
 * Turns a normal YouTube link — youtube.com/watch?v=..., youtu.be/...,
 * or already an /embed/... URL — into an embeddable
 * https://www.youtube.com/embed/VIDEO_ID URL. Returns null if the
 * video ID can't be found, so callers can safely skip rendering
 * rather than showing a broken embed.
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "");

    let videoId: string | null = null;

    if (host === "youtu.be") {
      videoId = parsed.pathname.slice(1);
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v");
      } else if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/embed/")[1];
      } else if (parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.split("/shorts/")[1];
      }
    }

    videoId = videoId?.split(/[?&/]/)[0] || null;
    if (!videoId) return null;

    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
}
