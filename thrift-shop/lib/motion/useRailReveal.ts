'use client';

/**
 * ============================================================
 *  RAIL REVEAL — Mery Rose
 * ============================================================
 *
 *  An item that reaches a rail fades and lifts into place, a
 *  moment after the item before it — so a row of items fills in
 *  like a hand of cards being dealt, rather than all at once.
 *
 *  The item is measured against the rail it lives in, so the
 *  moment it is counted as arrived is the moment it can really be
 *  seen: the rail is the window, not the screen.
 *
 *  An item that leaves the rail is put away quietly, and it plays
 *  its entrance again the next time it comes round — so a rail
 *  that is scrolled back and forth keeps moving.
 * ============================================================
 */

import { useEffect } from 'react';
import { gsap } from './gsap';
import { DURATION, EASE, prefersReducedMotion } from './tokens';

interface RailRevealOptions {
  /** The rail the items live in. */
  rail: HTMLElement | null;
  /** A selector that finds the items inside the rail. */
  selector: string;
  /** Re-runs the reveal when the set of items changes. */
  deps?: unknown[];
}

/** The gap between two items arriving, in seconds. */
const STAGGER = 0.05;

/** How long an item takes to arrive. */
const ARRIVE = DURATION.slow;

/** How long an item takes to be put away. */
const LEAVE = DURATION.fast;

/** How far an item sits below its place before it arrives. */
const RISE = 8;

/** How small an item is before it arrives. */
const SHRINK = 0.94;

/** How much of an item has to show before it counts as arrived. */
const ARRIVED = 0.35;

export function useRailReveal({ rail, selector, deps = [] }: RailRevealOptions): void {
  useEffect(() => {
    if (!rail) return;

    const items = Array.from(rail.querySelectorAll<HTMLElement>(selector));
    if (!items.length) return;

    // A visitor who asked for less movement sees the row as it is.
    if (prefersReducedMotion()) {
      gsap.set(items, { clearProps: 'opacity,yPercent,scale' });
      return;
    }

    /** The hidden state of an item that is away from the rail. */
    const away = { opacity: 0, yPercent: RISE, scale: SHRINK };

    /**
     * Whether an item is on show.
     *
     * The first pass looks at the rail itself: the items that are
     * already in view are left exactly as they were painted, so the
     * page never flashes while the effect starts.
     */
    const railBox = rail.getBoundingClientRect();
    const shown = new Set<HTMLElement>();

    for (const item of items) {
      const box = item.getBoundingClientRect();
      const inside =
        box.right > railBox.left &&
        box.left < railBox.right &&
        box.bottom > railBox.top &&
        box.top < railBox.bottom;

      if (inside) {
        shown.add(item);
      } else {
        gsap.set(item, away);
      }
    }

    let timer = 0;
    /** The items that have arrived together, in the order they arrived. */
    let batch: HTMLElement[] = [];

    const flush = () => {
      const arriving = batch;
      batch = [];

      arriving.forEach((item, index) => {
        gsap.to(item, {
          opacity: 1,
          yPercent: 0,
          scale: 1,
          duration: ARRIVE,
          ease: EASE.expo,
          // The items of one batch arrive one after another.
          delay: index * STAGGER,
          overwrite: true,
        });
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const item = entry.target as HTMLElement;

          if (entry.isIntersecting && entry.intersectionRatio >= ARRIVED) {
            if (shown.has(item)) continue;

            shown.add(item);
            gsap.killTweensOf(item);
            // The item is put back to its hidden state, then brought
            // in — otherwise it would already be standing there when
            // the animation starts.
            gsap.set(item, away);
            batch.push(item);
          } else if (!entry.isIntersecting && entry.intersectionRatio === 0) {
            if (!shown.has(item)) continue;

            shown.delete(item);
            gsap.killTweensOf(item);
            gsap.to(item, {
              ...away,
              duration: LEAVE,
              ease: EASE.standard,
              overwrite: true,
            });
          }
        }

        if (batch.length) {
          window.clearTimeout(timer);
          timer = window.setTimeout(flush, 16);
        }
      },
      {
        root: rail,
        threshold: [0, ARRIVED, 0.75],
      },
    );

    for (const item of items) observer.observe(item);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      gsap.killTweensOf(items);
      gsap.set(items, { clearProps: 'opacity,yPercent,scale' });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rail, selector, ...deps]);
}
