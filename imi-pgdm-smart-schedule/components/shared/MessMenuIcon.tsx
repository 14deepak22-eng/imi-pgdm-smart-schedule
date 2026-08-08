/**
 * Solid fork + spoon glyph, filled (not stroked) so it reads clearly at
 * small sizes. Renders in the current text color — set to white in
 * MessMenuButton, and to the accent gold in the modal header.
 */
export function MessMenuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 980 980" fill="currentColor" className={className} aria-hidden="true">
      <path d="M300 190c-14 0-24 12-22 26l16 150c3 26 20 47 43 55l-14 300c-1 22 16 40 38 40s39-18 38-40l-14-300c23-8 40-29 43-55l16-150c2-14-8-26-22-26s-24 12-22 26l-14 130h-14V196c0-14-11-24-24-24s-24 10-24 24v150h-14V196c0-14-11-24-24-24s-24 10-24 24v150h-14l-14-130c-2-14-12-26-26-26z" />
      <path d="M660 190c-70 0-120 65-120 165 0 75 32 130 80 152l-12 273c-1 22 16 40 38 40h28c22 0 39-18 38-40l-12-273c48-22 80-77 80-152 0-100-50-165-120-165z" />
    </svg>
  );
}
