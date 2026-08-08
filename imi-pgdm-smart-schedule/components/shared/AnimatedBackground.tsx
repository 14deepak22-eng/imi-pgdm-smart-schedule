'use client';

import { useEffect, useRef } from 'react';

/**
 * Full-viewport flowing dot-wave background, sitting fixed behind all page
 * content (z-index -1). Same technique as the user-provided reference file
 * (board_black_blue_animated.html): a grid of dots on a canvas, each one's
 * brightness driven by a traveling sine wave, so the whole grid reads as a
 * slow wave sweeping across the screen rather than a static dot pattern.
 *
 * Deliberately literal electric-blue (#2e7dfa), matching the reference
 * exactly — NOT tied to the app's amber/teal accent tokens, per explicit
 * choice ("keep it blue, like the reference file").
 *
 * Dark-mode only: fades out entirely in light mode, where a black canvas
 * would clash with the light theme's cream background. Watches
 * <html>'s class list (the same 'light'/'dark' toggle used everywhere
 * else in this app) via MutationObserver, since the theme can change at
 * any time from Settings without a full page reload.
 *
 * Respects prefers-reduced-motion: renders one static frame instead of
 * animating, rather than skipping the background entirely.
 */
export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    }
    resize();
    window.addEventListener('resize', resize);

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    let rafId: number;
    function draw(t: number) {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const spacing = 22 * dpr;
      ctx.clearRect(0, 0, w, h);
      const time = prefersReducedMotion ? 0 : t * 0.00035;
      for (let y = 10 * dpr; y < h; y += spacing) {
        for (let x = 10 * dpr; x < w; x += spacing) {
          const wave = Math.sin(x * 0.03 + y * 0.03 - time * 3);
          const b = (wave + 1) / 2;
          const alpha = 0.03 + b * b * 0.16;
          ctx.beginPath();
          ctx.arc(x, y, dpr, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(46,125,250,${alpha.toFixed(3)})`;
          ctx.fill();
        }
      }
      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(draw);
      }
    }
    rafId = requestAnimationFrame(draw);

    // Fades the whole canvas out in light mode, watching for the same
    // class toggle Settings uses — no reliance on a page reload.
    function syncVisibility() {
      if (!canvas) return;
      const isDark = document.documentElement.classList.contains('dark');
      canvas.style.opacity = isDark ? '1' : '0';
    }
    syncVisibility();
    const observer = new MutationObserver(syncVisibility);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        transition: 'opacity 0.3s ease',
      }}
    />
  );
}
