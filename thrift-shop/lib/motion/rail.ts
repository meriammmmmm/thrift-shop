'use client';

/**
 * ============================================================
 *  RAIL SCROLL ENGINE — Mery Rose
 * ============================================================
 *
 *  Every row of items on the shop — brands, reviews, clips — is a
 *  rail: a box that scrolls sideways and shows one item at a time.
 *
 *  WHY NOT `scrollTo({ behavior: 'smooth' })`
 *  -----------------------------------------
 *  The browser's own smooth scroll is a fixed curve that the rail
 *  has no say in. It cannot carry the speed of a fling, it cannot
 *  stop on a card when the visitor lets go, and — worst of all —
 *  it fights the CSS scroll snapping that holds the rail in place:
 *  the rail is halfway through the move when the browser decides
 *  the nearest card is somewhere else and pulls it back.
 *
 *  So the rail is driven by hand here. The position is animated
 *  with the same easing the rest of the site uses, the snap is
 *  suspended while the rail is in flight, and a fling keeps its
 *  momentum and lands on a card instead of stopping dead.
 * ============================================================
 */

import { gsap } from './gsap';
import { DURATION, EASE, prefersReducedMotion } from './tokens';

/**
 * Suspends CSS scroll snapping while the rail is in flight.
 *
 * The class carries the rail, so the rule that reads it lives in
 * globals.css next to the rails themselves.
 */
export const RAIL_IN_FLIGHT = 'is-in-flight';

export interface RailFlightOptions {
  /** How long the move takes, in seconds. */
  duration?: number;
  /** The GSAP ease that shapes the move. */
  ease?: string;
  /** Called once the rail has landed. */
  onComplete?: () => void;
}

/** Every rail that is still moving, so a new move can take over. */
const flights = new WeakMap<HTMLElement, gsap.core.Tween>();

/** How far the rail may travel. */
export function railLimit(rail: HTMLElement): number {
  return Math.max(0, rail.scrollWidth - rail.clientWidth);
}

/** Keep a position inside the rail. */
export function clampRail(rail: HTMLElement, left: number): number {
  return Math.min(Math.max(left, 0), railLimit(rail));
}

/**
 * Stop a rail that is still moving and leave it where it is.
 *
 * Called when a visitor grabs the rail: a rail that is being
 * dragged must not also be being animated.
 */
export function stopRail(rail: HTMLElement | null): void {
  if (!rail) return;

  const tween = flights.get(rail);
  if (!tween) return;

  tween.kill();
  flights.delete(rail);
  rail.classList.remove(RAIL_IN_FLIGHT);
}

/**
 * Travel to a position with an eased animation.
 *
 * The rail is moved by writing its scroll offset on every frame of
 * the tween, so the move can be interrupted, can carry a velocity,
 * and can land exactly on a card.
 */
export function scrollRailTo(
  rail: HTMLElement | null,
  left: number,
  options: RailFlightOptions = {},
): void {
  if (!rail) return;

  const target = clampRail(rail, left);

  // Whatever was moving stops — the new move takes over from here.
  stopRail(rail);

  // A visitor who asked for less movement gets none: the rail is
  // put where it belongs and the page stays still.
  if (prefersReducedMotion() || Math.abs(target - rail.scrollLeft) < 1) {
    rail.scrollLeft = target;
    options.onComplete?.();
    return;
  }

  rail.classList.add(RAIL_IN_FLIGHT);

  const proxy = { x: rail.scrollLeft };
  const distance = Math.abs(target - rail.scrollLeft);

  /**
   * A short move should not take as long as a long one.
   *
   * The move to the next card is a small thing and is over quickly;
   * the move across the whole rail is worth watching. The duration
   * grows with the distance and is kept inside a sane band.
   */
  const duration =
    options.duration ??
    Math.min(DURATION.cinematic, DURATION.base + distance / 2400);

  const tween = gsap.to(proxy, {
    x: target,
    duration,
    ease: options.ease ?? EASE.expo,
    overwrite: true,
    onUpdate() {
      rail.scrollLeft = proxy.x;
    },
    onComplete() {
      flights.delete(rail);
      rail.classList.remove(RAIL_IN_FLIGHT);
      // Land exactly, so the snap that comes back finds nothing to fix.
      rail.scrollLeft = target;
      options.onComplete?.();
    },
  });

  flights.set(rail, tween);
}

/** Travel by a distance. */
export function scrollRailBy(
  rail: HTMLElement | null,
  delta: number,
  options: RailFlightOptions = {},
): void {
  if (!rail) return;
  scrollRailTo(rail, rail.scrollLeft + delta, options);
}

/* ------------------------------------------------------------------ *
 * Fling — the rail carries the speed of the hand that let go
 * ------------------------------------------------------------------ */

export interface PointerSample {
  /** The time of the sample, in milliseconds. */
  t: number;
  /** The horizontal position of the pointer, in pixels. */
  x: number;
}

/**
 * The clock a sample is taken with.
 *
 * The pointer's own timestamp is not used: it is the time the browser
 * stamped the event, and that stamp does not always move between two
 * events of the same gesture — a synthesised event can carry the same
 * stamp all the way through. A clock that always moves is the only
 * honest way to measure how fast a hand was travelling.
 */
export function now(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

/**
 * The speed of the last movement of the pointer, in pixels a second.
 *
 * The samples are the tail of the drag: an old sample would report
 * a speed the visitor has already lost.
 */
export function pointerVelocity(samples: PointerSample[]): number {
  if (samples.length < 2) return 0;

  const first = samples[0];
  const last = samples[samples.length - 1];
  const elapsed = last.t - first.t;

  if (elapsed <= 0) return 0;

  return ((last.x - first.x) / elapsed) * 1000;
}

/**
 * How far a throw may carry the rail, in pixels.
 *
 * A hard fling should skip a few cards, not throw the visitor to the
 * far end of the rail.
 */
const MAX_CARRY = 600;

/**
 * Where a fling lands.
 *
 * The rail is thrown a little further than the hand was travelling,
 * and then it settles on the card closest to where it was heading.
 * A flick therefore skips over the cards it passed, the way a
 * thrown card does.
 */
export function flingStop(
  current: number,
  velocity: number,
  stops: number[],
  projection = 0.18,
): number {
  if (!stops.length) return current;

  const carried = Math.min(Math.abs(velocity) * projection, MAX_CARRY);
  const projected = current + Math.sign(velocity) * carried;

  let best = stops[0];
  let bestDistance = Math.abs(best - projected);

  for (const stop of stops) {
    const distance = Math.abs(stop - projected);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = stop;
    }
  }

  return best;
}

/**
 * The places a rail may land on, in scroll coordinates.
 *
 * The cards are measured against the rail itself rather than against
 * a positioned ancestor, so the stops are right whatever the page
 * around the rail is doing.
 */
export function railStops(
  rail: HTMLElement,
  items: HTMLElement[],
  position: (rail: HTMLElement, item: HTMLElement) => number,
): number[] {
  return items.map((item) => clampRail(rail, position(rail, item)));
}
