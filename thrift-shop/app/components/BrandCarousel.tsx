'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { BrandEntry, brandHref } from '../../lib/brands';
import { gsap } from '../../lib/motion/gsap';
import { DURATION, EASE, prefersReducedMotion } from '../../lib/motion/tokens';

interface BrandCarouselProps {
  brands: BrandEntry[];
  primary: string;
}

/** Pointer travel before a drag counts as a drag rather than a click. */
const DRAG_THRESHOLD = 6;

/** How far a card leans away from the cursor, in degrees, at its very edge. */
const MAX_TILT_X = 9;
const MAX_TILT_Y = 13;

/** How far the cards at the edge of the rail turn away from the viewer. */
const MAX_DEPTH_ROTATION = 32;
const MAX_DEPTH_RECESS = 120;
/** How far the edge cards slide back towards the middle of the rail. */
const MAX_DEPTH_PULL = 16;

/** How far the whole deck leans towards the pointer, in degrees. */
const MAX_STAGE_TILT_X = 7;
const MAX_STAGE_TILT_Y = 11;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function BrandCarousel({ brands, primary }: BrandCarouselProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });
  const tiltRef = useRef<HTMLElement | null>(null);
  const depthFrameRef = useRef(0);
  const scrollTimerRef = useRef(0);
  /** The deck leans towards the pointer — smoothed by GSAP. */
  const stageRef = useRef({ x: 0, y: 0 });

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const tiles = useMemo(() => brands.map((brand) => ({ ...brand })), [brands]);

  /** Re-read the rail's scroll geometry. */
  const syncScrollState = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const maxScroll = rail.scrollWidth - rail.clientWidth;
    setCanPrev(rail.scrollLeft > 4);
    setCanNext(rail.scrollLeft < maxScroll - 4);
  }, []);

  /**
   * Coverflow depth.
   *
   * The further a card sits from the middle of the rail, the further it
   * turns away from the viewer and the further it recedes — so the strip
   * reads as a fanned deck instead of a flat row of boxes.
   *
   * `offsetLeft` is a layout value, so it keeps describing where the tile
   * really is even while the tile is transformed. A bounding box would
   * measure the card we just turned and the maths would chase itself.
   *
   * The values travel as custom properties rather than as a written
   * transform, so this never fights GSAP or the hover states for the same
   * element.
   */
  const applyDepth = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const nodes = Array.from(rail.querySelectorAll<HTMLElement>('[data-brand-tile]'));
    const half = Math.max(rail.clientWidth / 2, 1);
    const scroll = rail.scrollLeft;

    // Read every position first. Mixing a layout read with a style write
    // would force a reflow for each card in turn.
    const readings = nodes.map((el) => ({
      el,
      center: el.offsetLeft + el.offsetWidth / 2 - scroll,
    }));

    for (const { el, center } of readings) {
      const offset = clamp((center - half) / half, -1.6, 1.6);
      const falloff = Math.min(Math.abs(offset), 1);

      el.style.setProperty('--brand-dry', `${(offset * MAX_DEPTH_ROTATION).toFixed(2)}deg`);
      el.style.setProperty('--brand-dz', `${(-falloff * MAX_DEPTH_RECESS).toFixed(1)}px`);
      el.style.setProperty('--brand-ds', (1 - falloff * 0.06).toFixed(3));
      el.style.setProperty(
        '--brand-dx',
        `${(-Math.sign(offset) * Math.pow(falloff, 1.4) * MAX_DEPTH_PULL).toFixed(1)}px`,
      );
      // The card nearest the middle of the rail is the one on top.
      el.style.zIndex = String(Math.round((1 - falloff) * 40) + 1);
    }
  }, []);

  /** Depth follows the scroll, but only once per frame. */
  const scheduleDepth = useCallback(() => {
    if (depthFrameRef.current) return;

    depthFrameRef.current = window.requestAnimationFrame(() => {
      depthFrameRef.current = 0;
      applyDepth();
    });
  }, [applyDepth]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const refresh = () => {
      applyDepth();
    };

    const onScroll = () => {
      syncScrollState();
      scheduleDepth();
      // While the rail is moving, the depth must track it exactly — a
      // transition here would smear the cards behind the scroll.
      rail.classList.add('is-scrolling');
      if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = window.setTimeout(() => {
        rail.classList.remove('is-scrolling');
      }, 140);
    };

    refresh();
    syncScrollState();

    rail.addEventListener('scroll', onScroll, { passive: true });

    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(refresh) : null;
    observer?.observe(rail);
    window.addEventListener('resize', refresh);

    // Products load in the background — the rail grows, so recompute.
    const timer = window.setTimeout(refresh, 400);

    return () => {
      rail.removeEventListener('scroll', onScroll);
      observer?.disconnect();
      window.removeEventListener('resize', refresh);
      window.clearTimeout(timer);
      window.clearTimeout(scrollTimerRef.current);
      if (depthFrameRef.current) window.cancelAnimationFrame(depthFrameRef.current);
      depthFrameRef.current = 0;
    };
  }, [syncScrollState, scheduleDepth, applyDepth, brands.length]);

  /**
   * The deck leans towards the pointer.
   *
   * The whole rail turns as a single object, so the strip reads as a
   * physical deck of cards on a table rather than a row of flat boxes. GSAP
   * smooths the movement, so the lean trails the pointer instead of
   * snapping to it.
   */
  useEffect(() => {
    const root = rootRef.current;
    const rail = railRef.current;
    if (!root || !rail) return;
    if (prefersReducedMotion()) return;

    const proxy = stageRef.current;

    const apply = () => {
      rail.style.setProperty('--rail-rx', `${(proxy.y * MAX_STAGE_TILT_X).toFixed(2)}deg`);
      rail.style.setProperty('--rail-ry', `${(proxy.x * MAX_STAGE_TILT_Y).toFixed(2)}deg`);
    };

    const lean = (x: number, y: number, duration: number) => {
      gsap.to(proxy, {
        x,
        y,
        duration,
        ease: 'power3.out',
        overwrite: true,
        onUpdate: apply,
      });
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;

      const rect = root.getBoundingClientRect();
      const x = clamp(
        (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2 || 1),
        -1,
        1,
      );
      const y = clamp(
        (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2 || 1),
        -1,
        1,
      );

      lean(x, y, 0.8);
    };

    const onLeave = () => lean(0, 0, 1.1);

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);

    return () => {
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  /** Scroll the rail by roughly one screen. */
  const scrollByPage = useCallback((direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;

    const distance = Math.max(rail.clientWidth * 0.8, 220);
    rail.scrollBy({
      left: direction * distance,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, []);

  /** Land on the tile closest to the left edge — the swiper "snap". */
  const snapToNearest = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const cards = Array.from(rail.querySelectorAll<HTMLElement>('[data-brand-tile]'));
    if (!cards.length) return;

    const railLeft = rail.getBoundingClientRect().left;
    let nearest: HTMLElement | null = null;
    let nearestDistance = Infinity;

    for (const card of cards) {
      const distance = Math.abs(card.getBoundingClientRect().left - railLeft);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = card;
      }
    }

    if (!nearest) return;
    const offset = nearest.getBoundingClientRect().left - railLeft;
    rail.scrollTo({
      left: rail.scrollLeft + offset,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, []);

  /** Let the card settle back to flat. */
  const clearTilt = useCallback(() => {
    const tile = tiltRef.current;
    if (!tile) return;

    tile.style.setProperty('--brand-rx', '0deg');
    tile.style.setProperty('--brand-ry', '0deg');
    tiltRef.current = null;
    // Hand the stacking order back to the depth.
    applyDepth();
  }, [applyDepth]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail) return;
    // Touch already scrolls natively, with momentum — do not fight it.
    if (event.pointerType === 'touch' || event.button !== 0) return;

    dragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startScroll: rail.scrollLeft,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    const drag = dragRef.current;
    if (!rail) return;

    // The card leans away from the cursor. Fine pointers only, and never
    // while a drag is in flight — the rail is moving under the pointer then.
    if (!drag.active && event.pointerType !== 'touch' && !prefersReducedMotion()) {
      const tile = (event.target as HTMLElement).closest<HTMLElement>('[data-brand-tile]');

      if (!tile) {
        clearTilt();
      } else {
        if (tiltRef.current !== tile) {
          clearTilt();
          tiltRef.current = tile;
          // The card under the cursor comes forward in the stack.
          tile.style.zIndex = '100';
        }

        // The tile only ever floats, so its box still describes the card
        // accurately — no feedback loop between the tilt and the measure.
        const rect = tile.getBoundingClientRect();
        const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2 || 1);
        const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2 || 1);

        tile.style.setProperty('--brand-rx', `${(-dy * MAX_TILT_X).toFixed(2)}deg`);
        tile.style.setProperty('--brand-ry', `${(dx * MAX_TILT_Y).toFixed(2)}deg`);
      }
    }

    if (!drag.active) return;

    const delta = event.clientX - drag.startX;

    if (!drag.moved) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      drag.moved = true;
      // Stop the scroll-snap from fighting the pointer mid-drag.
      rail.classList.add('is-dragging');
    }

    rail.scrollLeft = drag.startScroll - delta;
  };

  const endDrag = () => {
    const rail = railRef.current;
    const drag = dragRef.current;

    clearTilt();

    if (!drag.active) return;

    drag.active = false;
    rail?.classList.remove('is-dragging');

    if (drag.moved) snapToNearest();
  };

  /** Swallow the click that ends a drag. */
  const onTileClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (dragRef.current.moved) {
      event.preventDefault();
      dragRef.current.moved = false;
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollByPage(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollByPage(1);
    }
  };

  /* ------------------------------------------------------------------ *
   * Entrance choreography
   * ------------------------------------------------------------------ */

  useGSAP(
    () => {
      const scope = rootRef.current;
      if (!scope) return;

      const heading = scope.querySelector<HTMLElement>('[data-brand-heading]');
      const subheading = scope.querySelector<HTMLElement>('[data-brand-subheading]');
      const inners = Array.from(scope.querySelectorAll<HTMLElement>('[data-brand-inner]'));
      const cta = scope.querySelector<HTMLElement>('[data-brand-cta]');

      if (prefersReducedMotion()) {
        gsap.set([heading, subheading, cta].filter(Boolean) as HTMLElement[], {
          clearProps: 'all',
          opacity: 1,
        });
        gsap.set(inners, { clearProps: 'all', opacity: 1 });
        return;
      }

      const timeline = gsap.timeline({
        scrollTrigger: { trigger: scope, start: 'top 86%', once: true },
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

      if (subheading) {
        timeline.fromTo(
          subheading,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: DURATION.slow },
          0.08,
        );
      }

      // The cards deal in from alternating sides, like a hand being laid
      // out on the table.
      if (inners.length) {
        timeline.fromTo(
          inners,
          {
            opacity: 0,
            rotateY: (index: number) => (index % 2 === 0 ? -44 : 44),
            rotateX: 14,
            z: -160,
            scale: 0.78,
          },
          {
            opacity: 1,
            rotateY: 0,
            rotateX: 0,
            z: 0,
            scale: 1,
            duration: DURATION.cinematic,
            stagger: 0.055,
          },
          0.1,
        );
      }

      if (cta) {
        timeline.fromTo(
          cta,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: DURATION.slow },
          0.38,
        );
      }
    },
    { dependencies: [tiles.length], scope: rootRef },
  );

  if (!tiles.length) return null;

  return (
    <div
      ref={rootRef}
      className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10"
      style={{ '--brand-primary': primary } as React.CSSProperties}
    >
      {/* Header */}
      <div className="text-center mb-4 sm:mb-8" data-brand-heading>
        <h2 className="text-lg sm:text-2xl md:text-3xl font-light text-gray-900 mb-1 sm:mb-2 tracking-tight px-4">
          Shop by <span className="brand-heading-accent font-serif italic">Brand</span>
        </h2>
        <p
          className="text-gray-500 text-[10px] sm:text-sm max-w-xl mx-auto px-4"
          data-brand-subheading
        >
          Discover your favorite designers
        </p>
      </div>

      {/* Brands carousel — same cards, now on a swipeable rail.
          The arrows live in the side gutter (sm:px-9) so they never
          cover a card; phones just swipe. */}
      <div className="relative px-0 sm:px-9 mb-4 sm:mb-8">
        <div className="brand-stage relative">
        {/* Soft edges so the rail reads as "more to the side" */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-14 z-10 bg-gradient-to-r from-gray-50 to-transparent transition-opacity duration-300"
          style={{ opacity: canPrev ? 1 : 0 }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-14 z-10 bg-gradient-to-l from-gray-50 to-transparent transition-opacity duration-300"
          style={{ opacity: canNext ? 1 : 0 }}
          aria-hidden="true"
        />

        <div
          ref={railRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Brands"
          className="brand-rail flex items-stretch gap-2 sm:gap-4 md:gap-6 overflow-x-auto"
        >
          {tiles.map((brand, index) => (
            <a
              key={brand.key}
              href={brandHref(brand.key)}
              onClick={onTileClick}
              data-brand-tile
              style={{ '--brand-i': index } as React.CSSProperties}
              className="group relative block w-[120px] sm:w-[140px] md:w-[160px] shrink-0 focus:outline-none"
              aria-label={`Shop ${brand.name}`}
            >
              {/* Depth layer — how far the card has turned away from the
                  viewer and how far it has receded. */}
              <div className="brand-tile-depth">
                {/* Entrance layer — GSAP owns this transform. */}
                <div className="brand-tile-inner" data-brand-inner>
                  {/* Card layer — cursor tilt and the lift on hover. */}
                  <div className="brand-card bg-white rounded-2xl p-2 sm:p-5 md:p-6 border-2 border-gray-200 flex flex-col items-center justify-center min-h-[72px] sm:min-h-[120px] gap-1.5 sm:gap-2.5">
                    {/* Brand tag icon on a soft theme tint */}
                    <span
                      className="brand-icon flex h-8 w-8 items-center justify-center rounded-full sm:h-11 sm:w-11"
                      style={{ backgroundColor: `${primary}14`, color: primary }}
                    >
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                        <circle cx="7.5" cy="7.5" r="1.25" fill="currentColor" stroke="none" />
                      </svg>
                    </span>

                    {/* Brand name */}
                    <p className="brand-name text-center text-[8px] sm:text-[10px] md:text-sm font-medium tracking-tight text-gray-700 leading-tight uppercase">
                      {brand.name}
                    </p>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
        </div>

        {/* Step buttons — desktop only, phones swipe */}
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          disabled={!canPrev}
          aria-label="Previous brands"
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          disabled={!canNext}
          aria-label="Next brands"
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Bottom CTA */}
      <div className="text-center" data-brand-cta>
        <button
          onClick={() => window.location.href = '/products'}
          className="brand-cta inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-10 py-2 sm:py-3.5 text-white font-semibold text-[10px] sm:text-sm uppercase tracking-wide rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:opacity-90"
          style={{ backgroundColor: primary }}
        >
          <span>View All Products</span>
          <svg className="w-2.5 h-2.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
