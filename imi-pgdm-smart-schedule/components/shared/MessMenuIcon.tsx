import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils/cn';

interface GlyphProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Simple, solid fork glyph built from rects/polygon — deliberately avoids
 * fragile hand-drawn bezier paths, which don't render reliably across
 * browsers. Square viewBox so CSS transform-origin percentages line up
 * cleanly when animated.
 */
export function ForkGlyph({ className, style }: GlyphProps) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className} style={style} aria-hidden="true">
      <rect x="37.5" y="6" width="4" height="32" rx="2" />
      <rect x="44.5" y="6" width="4" height="32" rx="2" />
      <rect x="51.5" y="6" width="4" height="32" rx="2" />
      <rect x="58.5" y="6" width="4" height="32" rx="2" />
      <polygon points="37,40 63,40 56,52 44,52" />
      <rect x="44" y="52" width="12" height="42" rx="6" />
    </svg>
  );
}

/** Simple, solid spoon glyph — bowl ellipse + handle, same footprint as ForkGlyph. */
export function SpoonGlyph({ className, style }: GlyphProps) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className} style={style} aria-hidden="true">
      <ellipse cx="50" cy="22" rx="15" ry="20" />
      <rect x="44" y="42" width="12" height="52" rx="6" />
    </svg>
  );
}

/**
 * Static combined icon (fork + spoon, fixed crossed pose) — used where a
 * single non-animated glyph is needed, e.g. the modal header.
 */
export function MessMenuIcon({ className }: { className?: string }) {
  return (
    <span className={cn('relative inline-block', className)}>
      <ForkGlyph className="absolute inset-0" style={{ transform: 'rotate(-14deg)' }} />
      <SpoonGlyph className="absolute inset-0" style={{ transform: 'rotate(14deg)' }} />
    </span>
  );
}
