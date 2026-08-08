/**
 * Hand-drawn plate + spoon glyph — there's no fitting icon for this in
 * lucide-react, so it's a small custom SVG using currentColor (matches
 * MessMenuButton's ring/text color automatically in both themes).
 */
export function MessMenuIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* plate rim */}
      <circle cx="12" cy="12" r="8.5" />
      {/* plate inner ring */}
      <circle cx="12" cy="12" r="5.2" />
      {/* spoon bowl */}
      <ellipse cx="8.7" cy="8.2" rx="1.7" ry="2.5" transform="rotate(-38 8.7 8.2)" />
      {/* spoon handle */}
      <line x1="9.9" y1="10.1" x2="15" y2="15.5" />
    </svg>
  );
}
