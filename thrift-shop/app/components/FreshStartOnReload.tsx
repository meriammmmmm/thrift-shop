'use client';

import { useEffect } from 'react';

/**
 * A refresh starts at the top of the page.
 *
 * Two things pull the page away from the top when it is reloaded:
 *
 *  - the browser keeps the scroll position of the page it is reloading,
 *  - and the motion layer re-measures the page every time the catalogue
 *    or the pictures arrive, and puts the visitor back where they were.
 *
 * The first one is dealt with in the document head, before the browser
 * restores anything (see `app/layout.tsx`). This is the second: once the
 * page has settled, it is put back at the top.
 *
 * The visitor always wins. The moment they touch the page — a wheel, a
 * finger, a key, a press — this stops interfering and leaves them where
 * they are.
 */
export default function FreshStartOnReload() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;

    // Only a reload. A page opened for the first time is at the top
    // anyway, and a link into an anchor is left to the anchor.
    if (!nav || nav.type !== 'reload') return;
    if (window.location.hash) return;

    let touched = false;

    const stop = () => {
      touched = true;
    };

    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    window.addEventListener('pointerdown', stop, { passive: true });
    window.addEventListener('keydown', stop);

    let quiet = 0;
    const timer = window.setInterval(() => {
      if (touched) {
        window.clearInterval(timer);
        return;
      }

      if (window.scrollY === 0) {
        // The page has held still at the top: nothing left to correct.
        quiet += 1;
        if (quiet >= 3) window.clearInterval(timer);
        return;
      }

      quiet = 0;
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }, 250);

    // Four seconds is the whole of the settling: the catalogue, the
    // pictures and the last re-measure all happen inside it.
    const stopwatch = window.setTimeout(() => window.clearInterval(timer), 4000);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stopwatch);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('pointerdown', stop);
      window.removeEventListener('keydown', stop);
    };
  }, []);

  return null;
}
