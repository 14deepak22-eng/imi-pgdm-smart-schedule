'use client';

import { useEffect, useRef } from 'react';

/**
 * A quiet diagonal light wave that continuously breathes through a dot
 * grid behind the whole app — part of the black + electric-blue theme.
 * Each dot's brightness is computed live from a sine wave over its
 * position and the current time (not a repeating background tile), so
 * the motion doesn't look like an obvious loop. Sits fixed behind all
 * page content.
 *
 * Only animates in dark mode — the theme this effect was designed for.
 * In light mode it draws nothing and the plain page background shows
 * through instead. Watches <html> for the light/dark class swap made
 * by ThemeToggle so switching themes turns the wave on/off live.
 *
 * Respects prefers-reduced-motion by drawing one static frame instead
 * of animating.
 */
export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const spacing = 22;
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let isDark = document.documentElement.classList.contains('dark');
    const observer = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      if (reduceMotion) draw(0);
    }
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    function draw(t: number) {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);

      if (isDark) {
        const time = reduceMotion ? 0 : t * 0.00035;
        for (let y = 10; y < h; y += spacing) {
          for (let x = 10; x < w; x += spacing) {
            const wave = Math.sin(x * 0.028 + y * 0.028 - time * 3.2);
            const brightness = (wave + 1) / 2;
            const alpha = 0.03 + brightness * brightness * 0.14;
            ctx!.beginPath();
            ctx!.arc(x, y, 1, 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(46, 125, 250, ${alpha.toFixed(3)})`;
            ctx!.fill();
          }
        }
      }

      if (!reduceMotion) raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
