'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Swipe between the main pages, in the same order as the top nav:
 *   Board <-> Events <-> Notice <-> Progress <-> Settings
 *
 * Swipe right-to-left  => next page (e.g. Board -> Events)
 * Swipe left-to-right  => previous page (e.g. Events -> Board)
 * No wrap-around: swiping past Board or Settings does nothing.
 *
 * Deliberately ignored, so it never fights normal touch behaviour:
 *  - swipes that are mostly vertical (normal scrolling)
 *  - swipes that start on inputs / sliders / anything marked data-no-swipe
 *  - swipes while any modal (role="dialog") is open
 *  - swipes inside a horizontally scrollable area (e.g. the weekly
 *    timetable) that can still scroll in that direction — once it hits
 *    its edge, the next swipe changes the page
 *  - swipes starting at the very screen edge (browser back gesture)
 *  - multi-finger gestures (pinch zoom) and text selection
 */
const ROUTES = ['/', '/events', '/notices', '/progress', '/settings'];

const MIN_DISTANCE_PX = 60;
const MAX_DURATION_MS = 800;
const EDGE_GUARD_PX = 24;
const DIRECTION_RATIO = 1.5; // horizontal must beat vertical by this factor

const INTERACTIVE_SELECTOR =
  'input, textarea, select, [contenteditable="true"], [role="slider"], [data-no-swipe]';

function canScrollFurther(el: HTMLElement, dx: number): boolean {
  const max = el.scrollWidth - el.clientWidth;
  if (max <= 1) return false;
  // dx < 0: finger moved left, content moves to reveal its right side
  return dx < 0 ? el.scrollLeft < max - 1 : el.scrollLeft > 1;
}

function insideScrollableArea(target: Element | null, dx: number): boolean {
  let el = target as HTMLElement | null;
  while (el && el !== document.body && el !== document.documentElement) {
    const overflowX = getComputedStyle(el).overflowX;
    if ((overflowX === 'auto' || overflowX === 'scroll') && canScrollFurther(el, dx)) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

interface TouchStart {
  x: number;
  y: number;
  time: number;
  target: Element | null;
}

export function SwipeNavigator() {
  const pathname = usePathname();
  const router = useRouter();
  const startRef = useRef<TouchStart | null>(null);
  const index = ROUTES.indexOf(pathname);

  // Warm up the neighbouring pages so a swipe feels instant.
  useEffect(() => {
    if (index === -1) return;
    if (index > 0) router.prefetch(ROUTES[index - 1]);
    if (index < ROUTES.length - 1) router.prefetch(ROUTES[index + 1]);
  }, [index, router]);

  useEffect(() => {
    if (index === -1) return; // not one of the main pages (e.g. /feedback)

    const onTouchStart = (e: TouchEvent) => {
      startRef.current = null;
      if (e.touches.length !== 1) return;
      if (document.querySelector('[role="dialog"]')) return;

      const touch = e.touches[0];
      if (touch.clientX < EDGE_GUARD_PX || touch.clientX > window.innerWidth - EDGE_GUARD_PX) {
        return;
      }
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest(INTERACTIVE_SELECTOR)) return;

      startRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        target,
      };
    };

    const onTouchEnd = (e: TouchEvent) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;

      if (Date.now() - start.time > MAX_DURATION_MS) return;
      if (Math.abs(dx) < MIN_DISTANCE_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * DIRECTION_RATIO) return;
      if (window.getSelection()?.toString()) return;
      if (insideScrollableArea(start.target, dx)) return;

      const next = dx < 0 ? index + 1 : index - 1;
      if (next < 0 || next >= ROUTES.length) return;
      router.push(ROUTES[next]);
    };

    const onTouchCancel = () => {
      startRef.current = null;
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchCancel, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [index, router]);

  return null;
}
