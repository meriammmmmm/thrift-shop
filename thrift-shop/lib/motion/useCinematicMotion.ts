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
      { opacity: 1, y: 0, duration: 0.35 },
      0,
    );
  }

  if (heading) {
    timeline.fromTo(
      heading,
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 0.4 },
      0.04,
    );
  }

  // The italic word wipes in from the left behind a soft curtain.
  if (accent) {
    timeline.fromTo(
      accent,
      { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
      { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.4, ease: EASE.cinematic },
      0.1,
    );
  }

  // The underline draws itself once the word has landed.
  if (underline) {
    timeline.fromTo(
      underline,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.45, ease: EASE.cinematic },
      0.24,
    );
  }

  if (lede) {
    timeline.fromTo(
      lede,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.38 },
      0.16,
    );
  }

  if (cards.length) {
    timeline.fromTo(
      cards,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.05 },
      0.2,
    );
  }

  if (icons.length) {
    timeline.fromTo(
      icons,
      { opacity: 0, scale: 0.6 },
      { opacity: 1, scale: 1, duration: 0.38, stagger: 0.05, ease: EASE.spring },
      0.26,
    );
  }
}

/**
 * The brand backdrop drifts with the page.
 *
 * The blurred orbs already have a slow drift of their own in CSS, so the
 * layer that holds them is what travels: the backdrop of the "Shop by
 * Brand" section slides behind the rail instead of sitting still.
 */
function sceneBrandAmbient() {
  const ambient = document.querySelector<HTMLElement>('.brand-ambient');
  if (!ambient) return;

  gsap.fromTo(
    ambient,
    { yPercent: 7, scale: 1.02 },
    {
      yPercent: -7,
      scale: 1.1,
      ease: EASE.linear,
      scrollTrigger: {
        trigger: ambient.parentElement ?? ambient,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    },
  );
}

/**
 * The New Arrivals copy arrives when the reader reaches it.
 *
 * It used a CSS fade that ran the moment the page loaded — and this block
 * sits below the fold, so the fade had finished long before anybody could
 * see it. The copy now waits for the reader, in the order it is read:
 * heading, then the line under it, then the button.
 */
function sceneArrivalsCopy() {
  const section = document.querySelector<HTMLElement>('[data-cinematic="arrivals"]');
  if (!section) return;

  const heading = section.querySelector<HTMLElement>('[data-cinematic="arrivals-heading"]');
  const lede = section.querySelector<HTMLElement>('[data-cinematic="arrivals-lede"]');
  const cta = section.querySelector<HTMLElement>('[data-cinematic="arrivals-cta"]');

  const timeline = gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top 82%', once: true },
    defaults: { ease: EASE.expo },
  });

  if (heading) {
    timeline.fromTo(
      heading,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: DURATION.slow },
      0,
    );
  }

  if (lede) {
    timeline.fromTo(
      lede,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: DURATION.slow },
      0.08,
    );
  }

  if (cta) {
    timeline.fromTo(
      cta,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: DURATION.slow },
      0.16,
    );
  }
}

/**
 * The footer rises.
 *
 * The last thing on the page deserves an entrance of its own — the columns
 * come up in a row, like the shelves being put back in place.
 */
function sceneFooterRise() {
  const footer = document.querySelector<HTMLElement>('[data-cinematic="footer"]');
  if (!footer) return;

  const columns = Array.from(
    footer.querySelectorAll<HTMLElement>('[data-cinematic="footer-column"]'),
  );
  const base = footer.querySelector<HTMLElement>('[data-cinematic="footer-base"]');

  const timeline = gsap.timeline({
    scrollTrigger: { trigger: footer, start: 'top 92%', once: true },
    defaults: { ease: EASE.expo },
  });

  if (columns.length) {
    timeline.fromTo(
      columns,
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: DURATION.slow, stagger: 0.06 },
      0,
    );
  }

  if (base) {
    timeline.fromTo(
      base,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: DURATION.slow },
      0.14,
    );
  }
}

/**
 * The heading of the video section.
 *
 * The section itself wipes in as one block; the heading is given its own
 * moment so the section reads as a title and a row of clips rather than one
 * large shape.
 */
function sceneVideoHead() {
  const head = document.querySelector<HTMLElement>('[data-cinematic="video-head"]');
  if (!head) return;

  gsap.fromTo(
    head,
    { opacity: 0, y: 22 },
    {
      opacity: 1,
      y: 0,
      duration: DURATION.slow,
      ease: EASE.expo,
      scrollTrigger: { trigger: head, start: 'top 88%', once: true },
    },
  );
}

/**
 * The catalogue hero — the banner that stands above the grid.
 *
 * The picture behind it comes up slowly while the headline wipes in over
 * it, and the whole banner drifts against the page as the customer scrolls
 * towards the collection. The copy dissolves on the way out, so the grid is
 * what the customer lands on.
 *
 * The headline is deliberately *not* split into words: the shop's name
 * arrives from the API after the page has painted, and React would then
 * rewrite the text of a headline that no longer owns its text nodes. A
 * wipe reads just as well and cannot go stale.
 */
function sceneCatalogueHero() {
  const hero = document.querySelector<HTMLElement>('[data-cinematic="catalogue-hero"]');
  if (!hero) return;

  /**
   * The hero plays once. The scene is rebuilt whenever the collection
   * changes — a filter, a new page of products — and the banner should not
   * introduce itself again every time the grid changes shape.
   */
  if (hero.dataset.cinematicPlayed === 'true') return;
  hero.dataset.cinematicPlayed = 'true';

  const media = hero.querySelector<HTMLElement>('[data-cinematic="catalogue-hero-media"]');
  const copy = hero.querySelector<HTMLElement>('[data-cinematic="catalogue-hero-copy"]');
  const title = hero.querySelector<HTMLElement>('[data-cinematic="catalogue-hero-title"]');
  const lede = hero.querySelector<HTMLElement>('[data-cinematic="catalogue-hero-lede"]');
  const note = hero.querySelector<HTMLElement>('[data-cinematic="catalogue-hero-note"]');

  const timeline = gsap.timeline({ defaults: { ease: EASE.expo } });

  if (media) {
    timeline.fromTo(
      media,
      { opacity: 0.25 },
      { opacity: 0.6, duration: 1.1, ease: EASE.standard },
      0,
    );
  }

  if (title) {
    timeline.fromTo(
      title,
      { opacity: 0, y: 34, clipPath: 'inset(0% 0% 100% 0%)' },
      { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6 },
      0.12,
    );
  }

  if (lede) {
    timeline.fromTo(lede, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.45 }, 0.3);
  }

  if (note) {
    timeline.fromTo(note, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45 }, 0.4);
  }

  /* The picture travels as the banner leaves; the copy dissolves with it. */
  if (media) {
    gsap.fromTo(
      media,
      { scale: 1.08 },
      {
        scale: 1.22,
        ease: EASE.linear,
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4 },
      },
    );
  }

  if (copy) {
    gsap.to(copy, {
      yPercent: -22,
      opacity: 0.12,
      ease: EASE.linear,
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4 },
    });
  }
}

/**
 * The filter bar.
 *
 * The category pills arrive one after another and the row of filters slides
 * up behind them, so the bar reads as a piece of the shop rather than a
 * form that happened to be at the top of the page.
 */
function sceneCatalogueFilters() {
  const bar = document.querySelector<HTMLElement>('[data-cinematic="catalogue-filters"]');
  if (!bar) return;

  if (bar.dataset.cinematicPlayed === 'true') return;
  bar.dataset.cinematicPlayed = 'true';

  const pills = bar.querySelectorAll<HTMLElement>('[data-cinematic="catalogue-pill"]');
  const row = bar.querySelector<HTMLElement>('[data-cinematic="catalogue-filter-row"]');

  const timeline = gsap.timeline({ defaults: { ease: EASE.expo } });

  if (pills.length) {
    timeline.fromTo(
      pills,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.34, stagger: 0.03 },
      0,
    );
  }

  if (row) {
    timeline.fromTo(row, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.42 }, 0.14);
  }
}

/**
 * The line above the grid — "142 Products".
 *
 * The number is counted up to whatever the collection currently holds, so
 * a filter that narrows the shop is seen as well as read.
 */
function sceneCatalogueHead() {
  const head = document.querySelector<HTMLElement>('[data-cinematic="catalogue-head"]');
  if (!head) return;

  const title = head.querySelector<HTMLElement>('[data-cinematic="catalogue-head-title"]');
  const count = head.querySelector<HTMLElement>('[data-cinematic="catalogue-head-count"]');
  const note = head.querySelector<HTMLElement>('[data-cinematic="catalogue-head-note"]');

  const timeline = gsap.timeline({
    scrollTrigger: { trigger: head, start: 'top 90%', once: true },
    defaults: { ease: EASE.expo },
  });

  if (count) {
    const target = Number(count.dataset.count || '0');
    const counted = Number(count.dataset.counted ?? '-1');

    /**
     * The number is only counted when it has actually changed. The scene is
     * rebuilt every time another row of pieces arrives, and the collection
     * did not get bigger then — only the number of tiles on the screen did.
     */
    if (Number.isFinite(target) && target > 0 && target !== counted) {
      count.dataset.counted = String(target);

      const state = { n: 0 };
      timeline.to(
        state,
        {
          n: target,
          duration: 0.85,
          ease: EASE.standard,
          onUpdate: () => {
            count.textContent = String(Math.round(state.n));
          },
        },
        0,
      );
    }
  }

  if (title) {
    timeline.fromTo(title, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.42 }, 0.06);
  }

  if (note) {
    timeline.fromTo(note, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4 }, 0.16);
  }
}

/**
 * The grid of pieces.
 *
 * A hundred and forty pieces cannot each be given their own scroll
 * trigger — that is a wall of wipes rather than a collection. They arrive
 * in rows instead: the pictures wipe down into their frames while the
 * names and prices rise underneath them, one row after the next.
 */
function sceneCatalogueCards() {
  /**
   * Only the pieces that have not arrived yet are animated. The scene is
   * rebuilt every time another row is added to the grid, and the pieces
   * that are already on the screen have had their moment.
   */
  const cards = gsap.utils.toArray<HTMLElement>(
    '[data-cinematic="catalogue-card"]:not([data-cinematic-revealed])',
  );
  if (!cards.length) return;

  ScrollTrigger.batch(cards, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => {
      batch.forEach((card) => {
        (card as HTMLElement).dataset.cinematicRevealed = 'true';
      });

      const media = batch
        .map((card) => card.querySelector<HTMLElement>('[data-cinematic="card-media"]'))
        .filter(Boolean) as HTMLElement[];
      const info = batch
        .map((card) => card.querySelector<HTMLElement>('[data-cinematic="card-info"]'))
        .filter(Boolean) as HTMLElement[];

      const timeline = gsap.timeline({ defaults: { ease: EASE.expo } });

      timeline.fromTo(
        batch,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, stagger: 0.055 },
        0,
      );

      if (media.length) {
        timeline.fromTo(
          media,
          { clipPath: 'inset(0% 0% 100% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, stagger: 0.055 },
          0,
        );
      }

      if (info.length) {
        timeline.fromTo(
          info,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.055 },
          0.08,
        );
      }
    },
  });
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
      sceneBrandAmbient();
      sceneArrivalsCopy();
      sceneVideoHead();
      sceneCatalogueHero();
      sceneCatalogueFilters();
      sceneCatalogueHead();
      sceneCatalogueCards();
      sceneFooterRise();

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
            { yPercent: 115, duration: 0.5, stagger: 0.025, ease: EASE.expo },
            0.1,
          );
        }
      }

      const parts = copy?.querySelectorAll<HTMLElement>('[data-hero-part]');
      if (parts?.length) {
        timeline.from(
          parts,
          { y: 26, opacity: 0, duration: 0.4, stagger: 0.035, ease: EASE.expo },
          0.2,
        );
      }
    },
    { dependencies: [slideIndex] },
  );
}
