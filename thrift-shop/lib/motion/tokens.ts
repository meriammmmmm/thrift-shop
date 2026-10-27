/**
 * ============================================================
 *  MOTION TOKENS — Mery Rose
 * ============================================================
 *  Every duration, easing and brand colour used by the cinematic
 *  layer lives here. Tuning the feel of the whole site should never
 *  require hunting through component files.
 *
 *  Companion to the legacy `lib/theme.tsx` (which owns colour + copy
 *  that merchants can change at runtime). Motion is not merchandised,
 *  so it stays static and compiled.
 * ============================================================
 */

export const DURATION = {
  /** Micro-feedback (hover, press). */
  instant: 0.12,
  /** State swaps that should feel immediate but not abrupt. */
  fast: 0.25,
  /** Standard UI transition. */
  base: 0.45,
  /** Large element entrance. */
  slow: 0.8,
  /** Scroll-triggered reveal — long enough to read as intentional. */
  reveal: 1.05,
  /** Hero / sequence choreography. */
  cinematic: 1.4,
  /** Scrubbed parallax transit across a full viewport. */
  transit: 1,
} as const;

export const EASE = {
  /** Default entrance: decisive, gentle landing. */
  standard: 'power3.out',
  /** Cinematic reveals — fast start, long luxurious settle. */
  expo: 'expo.out',
  /** Used when something both enters and leaves (hero swap). */
  cinematic: 'expo.inOut',
  /** Symmetric movement (parallax, pinning). */
  smooth: 'power2.inOut',
  /** Scrubbed timelines — linear, because the scroll position drives them. */
  linear: 'none',
  /** Playful overshoot for small, tactile elements. */
  spring: 'back.out(1.6)',
} as const;

/** Brand tokens — kept in sync with the palette in globals.css. */
export const BRAND = {
  primary: '#731528',
  primaryHover: '#5A1020',
  primaryLight: '#F6E8EB',
  accent: '#C98C9C',
  ink: '#111827',
} as const;

/** Gap between siblings in a staggered group. */
export const STAGGER_STEP = 0.09;

/** Upper bound so the last item of a long list never feels broken. */
export const STAGGER_MAX_INDEX = 6;

/**
 * Runtime feature detection for reduced motion.
 *
 * Read this in JS when the decision changes what we build (skip a scrubbed
 * timeline entirely); for pure styling rely on the
 * `@media (prefers-reduced-motion: reduce)` block in globals.css.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
