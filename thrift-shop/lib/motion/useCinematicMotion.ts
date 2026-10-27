'use client';

/**
 * ============================================================
 *  CINEMATIC MOTION — Mery Rose
 * ============================================================
 *  The scroll-driven layer for the storefront.
 *
 *  DESIGN NOTES
 *  ------------
 *  1. The legacy markup already encodes *how* each element should arrive
 *     (`scroll-fadeInUp`, `scroll-zoomIn`, `stagger-3`, ...). Rather than
 *     rewriting 1700 lines of JSX we read those classes and translate them
 *     into a cinematic wipe. One vocabulary, two implementations.
 *
 *  2. CSS owns any element whose transform is already spoken for — a card
 *     with `card-hover-enhanced` lifts on hover in CSS, so GSAP reveals it
 *     with clip-path + opacity only and leaves `transform` alone.
 *     Otherwise the two fight and the hover lift dies.
 *
 *  3. Everything degrades. `prefers-reduced-motion` reveals the page
 *     instantly, mobile drops the pinned/scrubbed scenes, and a failed
 *     import can never leave content invisible: `.gsap-motion` in
 *     globals.css is the safety net that shows anything GSAP has not
 *     claimed yet.
 * ============================================================
 */

import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from './gsap';
import { DURATION, EASE, STAGGER_MAX_INDEX, STAGGER_STEP, prefersReducedMotion } from './tokens';

/* ------------------------------------------------------------------ *
 * Word masking
 * ------------------------------------------------------------------ */

/**
 * Split a heading into per-word masks and return the inner word spans.
 *
 * Deliberately hand-rolled rather than using SplitText:
 *
 *  - SplitText measures *lines* and caches the mask height. The display
 *    font (Playfair) arrives after first paint, the cached height goes
 *    stale and the headline gets sliced through the descenders.
 *  - SplitText owns its own revert lifecycle, and the hero heading is
 *    managed by React. Splitting by word instead means the masks are
 *    inline blocks that re-flow with the font, and a resize needs no
 *    re-split at all.
 *
 * The original text is kept on `aria-label` and the generated spans are
 * hidden from assistive technology, so the heading still reads correctly.
 */
function splitWords(el: HTMLElement): HTMLElement[] {
  const text = (el.textContent || '').trim();
  if (!text) return [];

  el.setAttribute('aria-label', text);
  el.textContent = '';

  const words = text.split(/\s+/);
  const spans: HTMLElement[] = [];

  words.forEach((word) => {
    const mask = document.createElement('span');
    mask.className = 'cinematic-word-mask';
    mask.setAttribute('aria-hidden', 'true');

    const span = document.createElement('span');
    span.className = 'cinematic-word';
    span.textContent = word;

    mask.appendChild(span);
    el.appendChild(mask);
    el.appendChild(document.createTextNode(' '));
    spans.push(span);
  });

  return spans;
}

/* ------------------------------------------------------------------ *
 * Reveal vocabulary
 * ------------------------------------------------------------------ */

type Reveal = {
  /** Starting clip-path. */
  clip: string;
  /** Starting transform. Omitted when CSS owns the transform. */
  offset: gsap.TweenVars;
};

const REVEALS: Record<string, Reveal> = {
  'scroll-fadeInUp': { clip: 'inset(0% 0% 100% 0%)', offset: { y: 34 } },
  'scroll-fadeInDown': { clip: 'inset(100% 0% 0% 0%)', offset: { y: -26 } },
  'scroll-fadeInLeft': { clip: 'inset(0% 100% 0% 0%)', offset: { x: 38 } },
  'scroll-fadeInRight': { clip: 'inset(0% 0% 0% 100%)', offset: { x: -38 } },
  'scroll-zoomIn': { clip: 'inset(12% 12% 12% 12%)', offset: { scale: 0.94 } },
  'scroll-slideInScale': { clip: 'inset(8% 8% 8% 8%)', offset: { scale: 0.95, y: 26 } },
};

const DEFAULT_REVEAL: Reveal = { clip: 'inset(0% 0% 100% 0%)', offset: { y: 30 } };

function resolveReveal(el: HTMLElement): Reveal {
  for (const key of Object.keys(REVEALS)) {
    if (el.classList.contains(key)) return REVEALS[key];
  }
  return DEFAULT_REVEAL;
}

/** `stagger-3` → 0.18s of offset, so the group still lands as a group. */
function staggerOffset(el: HTMLElement): number {
  const token = Array.from(el.classList).find((c) => c.startsWith('stagger-'));
  if (!token) return 0;
  const n = Number(token.replace('stagger-', ''));
  if (!Number.isFinite(n)) return 0;
  return Math.min(n - 1, STAGGER_MAX_INDEX) * STAGGER_STEP;
}

/** CSS hover transforms must not be overwritten by an entrance tween. */
function cssOwnsTransform(el: HTMLElement): boolean {
  return el.classList.contains('card-hover-enhanced');
}

/* ------------------------------------------------------------------ *
 * Scenes
 * ------------------------------------------------------------------ */

/**
 * Replace the legacy IntersectionObserver reveal with ScrollTrigger.
 *
 * Every `.scroll-animate` element becomes its own trigger so the entrance
 * happens exactly when that element reaches the fold — the page reads as a
 * sequence of reveals rather than one bulk fade.
 */
function sceneReveals() {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('.scroll-animate'));

  nodes.forEach((el) => {
    const { clip, offset } = resolveReveal(el);
    const ownsTransform = cssOwnsTransform(el);

    const from: gsap.TweenVars = {
      opacity: 0,
      clipPath: clip,
      ...(ownsTransform ? {} : offset),
    };

    const to: gsap.TweenVars = {
      opacity: 1,
      clipPath: 'inset(0% 0% 0% 0%)',
      ...(ownsTransform ? {} : { x: 0, y: 0, scale: 1 }),
      duration: DURATION.reveal,
      ease: EASE.expo,
      delay: staggerOffset(el),
    };

    gsap.fromTo(el, from, {
      ...to,
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true,
      },
    });
  });

  // `.reveal-on-scroll` / `.zoom-on-scroll` are CSS-transform driven.
  // GSAP takes the transform so the two systems cannot fight.
  document.querySelectorAll<HTMLElement>('.reveal-on-scroll').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: DURATION.reveal,
        ease: EASE.expo,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      },
    );
  });

  document.querySelectorAll<HTMLElement>('.zoom-on-scroll').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, scale: 1.1 },
      {
        opacity: 1,
        scale: 1,
        duration: DURATION.slow,
        ease: EASE.standard,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      },
    );
  });
}

/**
 * Hero parallax — the image drifts slower than the page, the copy drifts
 * up and dissolves. The scroll position is the only input.
 */
function sceneHeroParallax() {
  const hero = document.querySelector<HTMLElement>('[data-cinematic="hero"]');
  if (!hero) return;

  gsap.to('[data-cinematic="hero-media-wrap"]', {
    yPercent: 12,
    scale: 1.14,
    ease: EASE.linear,
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4 },
  });

  gsap.to('[data-cinematic="hero-copy-layer"]', {
    yPercent: -16,
    opacity: 0.15,
    ease: EASE.linear,
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4 },
  });

  gsap.to('[data-cinematic="hero-cue"]', {
    autoAlpha: 0,
    y: 14,
    ease: EASE.linear,
    scrollTrigger: { trigger: hero, start: 'top top', end: '25% top', scrub: true },
  });
}

/**
 * Background media drift — used by the burgundy "New Arrivals" block.
 * Purely decorative, so it stays cheap: transform + opacity only.
 */
function sceneMediaDrift() {
  document.querySelectorAll<HTMLElement>('[data-cinematic="parallax-media"]').forEach((el) => {
    gsap.fromTo(
      el,
      { yPercent: -8, scale: 1.08 },
      {
        yPercent: 8,
        scale: 1.16,
        ease: EASE.linear,
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  // The starfield on the burgundy panel turns slowly as you pass it.
  document.querySelectorAll<HTMLElement>('[data-cinematic="starfield"]').forEach((el) => {
    gsap.fromTo(
      el,
      { rotation: -4, scale: 1.04 },
      {
        rotation: 4,
        scale: 1.12,
        ease: EASE.linear,
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}

/**
 * "Why Mery Rose?" — one deliberate entrance, not a pile of effects.
 *
 * The section used to mix a generic clip-wipe reveal with a scrubbed
 * drift, so the cards floated while they were fading in and the two
 * timelines disagreed with each other. It is now a single timeline with
 * a clear order: eyebrow → headline → the italic word wiping in behind
 * a curtain → its underline drawing → lede → the four pillars rising in
 * sequence. Nothing moves once the entrance is over.
 */
function sceneWhyRose() {
  const section = document.querySelector<HTMLElement>('[data-cinematic="why-rose"]');
  if (!section) return;

  const eyebrow = section.querySelector<HTMLElement>('[data-cinematic="why-rose-eyebrow"]');
  const heading = section.querySelector<HTMLElement>('[data-cinematic="why-rose-heading"]');
  const accent = section.querySelector<HTMLElement>('[data-cinematic="why-rose-accent"]');
  const underline = section.querySelector<HTMLElement>('[data-cinematic="why-rose-underline"]');
  const lede = section.querySelector<HTMLElement>('[data-cinematic="why-rose-lede"]');
  const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-cinematic="why-rose-card"]'));
  const icons = Array.from(section.querySelectorAll<HTMLElement>('[data-cinematic="why-rose-icon"]'));

  const timeline = gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top 74%', once: true },
    defaults: { ease: EASE.expo },
  });

  if (eyebrow) {
    timeline.fromTo(
      eyebrow,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.7 },
      0,
    );
  }

  if (heading) {
    timeline.fromTo(
      heading,
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 0.95 },
      0.08,
    );
  }

  // The italic word wipes in from the left behind a soft curtain.
  if (accent) {
    timeline.fromTo(
      accent,
      { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
      { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.95, ease: EASE.cinematic },
      0.2,
    );
  }

  // The underline draws itself once the word has landed.
  if (underline) {
    timeline.fromTo(
      underline,
      { scaleX: 0 },
      { scaleX: 1, duration: 1.05, ease: EASE.cinematic },
      0.6,
    );
  }

  if (lede) {
    timeline.fromTo(
      lede,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.85 },
      0.38,
    );
  }

  if (cards.length) {
    timeline.fromTo(
      cards,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.12 },
      0.45,
    );
  }

  if (icons.length) {
    timeline.fromTo(
      icons,
      { opacity: 0, scale: 0.6 },
      { opacity: 1, scale: 1, duration: 0.85, stagger: 0.12, ease: EASE.spring },
      0.62,
    );
  }
}

/**
 * Cursor spotlight on product media. A rAF-throttled delegated listener
 * writes CSS custom properties; the visual lives entirely in CSS, so the
 * hover never competes with GSAP for the element's transform.
 */
function sceneSpotlight() {
  let frame = 0;
  let pending: { x: number; y: number } | null = null;

  const apply = () => {
    frame = 0;
    const point = pending;
    pending = null;
    if (!point) return;

    const target = document.querySelector<HTMLElement>('[data-spotlight-active="true"]');
    if (!target) return;

    target.style.setProperty('--spot-x', `${point.x}px`);
    target.style.setProperty('--spot-y', `${point.y}px`);
  };

  const onMove = (event: MouseEvent) => {
    const node = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-spotlight]');
    if (!node) return;

    const rect = node.getBoundingClientRect();
    pending = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    document.querySelectorAll<HTMLElement>('[data-spotlight-active="true"]').forEach((el) => {
      if (el !== node) el.removeAttribute('data-spotlight-active');
    });
    node.setAttribute('data-spotlight-active', 'true');

    if (!frame) frame = requestAnimationFrame(apply);
  };

  document.addEventListener('mousemove', onMove, { passive: true });
  return () => {
    document.removeEventListener('mousemove', onMove);
    if (frame) cancelAnimationFrame(frame);
  };
}

/* ------------------------------------------------------------------ *
 * Public hooks
 * ------------------------------------------------------------------ */

/**
 * Page-level choreography.
 *
 * `deps` should list whatever makes the page change shape — loaded
 * products, testimonials, categories. When they change the whole context
 * is reverted and rebuilt so trigger positions are measured against the
 * new layout instead of the old one.
 */
export function useCinematicScroll(deps: unknown[] = []) {
  useGSAP(
    () => {
      const root = document.documentElement;
      root.classList.add('gsap-motion');

      if (prefersReducedMotion()) {
        // Nothing animates, but everything must still be visible.
        gsap.set('.scroll-animate, .reveal-on-scroll, .zoom-on-scroll', {
          clearProps: 'all',
          opacity: 1,
          clipPath: 'none',
        });
        return;
      }

      sceneReveals();
      sceneHeroParallax();
      sceneMediaDrift();
      sceneWhyRose();

      const detachSpotlight = sceneSpotlight();

      // Media and fonts land after first paint and change every measurement.
      const refresh = () => ScrollTrigger.refresh();
      const refreshTimer = window.setTimeout(refresh, 400);
      window.addEventListener('load', refresh, { once: true });

      return () => {
        window.clearTimeout(refreshTimer);
        window.removeEventListener('load', refresh);
        detachSpotlight?.();
      };
    },
    { dependencies: deps },
  );
}

/**
 * Hero choreography, re-run on every slide change.
 *
 * React swaps the hero copy every 5 seconds, so the entrance has to be
 * rebuilt each time: the headline is re-masked into words and the
 * photograph gets a slow Ken Burns push while it fades in.
 */
export function useHeroCinematic(slideIndex: number) {
  useGSAP(
    () => {
      const copy = document.querySelector<HTMLElement>('[data-cinematic="hero-copy"]');
      const media = document.querySelector<HTMLElement>('[data-cinematic="hero-media"]');
      if (!copy && !media) return;

      if (prefersReducedMotion()) {
        if (media) gsap.set(media, { clearProps: 'all', opacity: 1 });
        if (copy) gsap.set(copy, { clearProps: 'all', opacity: 1 });
        return;
      }

      const timeline = gsap.timeline({ defaults: { ease: EASE.expo } });

      if (media) {
        timeline.fromTo(
          media,
          { opacity: 0, scale: 1.04 },
          { opacity: 1, scale: 1, duration: DURATION.cinematic, ease: EASE.standard },
          0,
        );
        // Slow push that runs the length of the slide.
        timeline.to(media, { scale: 1.1, duration: 6.2, ease: EASE.linear }, 0.4);
      }

      const title = copy?.querySelector<HTMLElement>('[data-cinematic="hero-title"]');
      if (title) {
        const words = splitWords(title);
        if (words.length) {
          timeline.from(
            words,
            { yPercent: 115, duration: 1.15, stagger: 0.055, ease: EASE.expo },
            0.22,
          );
        }
      }

      const parts = copy?.querySelectorAll<HTMLElement>('[data-hero-part]');
      if (parts?.length) {
        timeline.from(
          parts,
          { y: 26, opacity: 0, duration: 0.95, stagger: 0.08, ease: EASE.expo },
          0.45,
        );
      }
    },
    { dependencies: [slideIndex] },
  );
}
