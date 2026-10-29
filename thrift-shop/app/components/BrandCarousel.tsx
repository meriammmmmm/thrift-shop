'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrandEntry, brandHref } from '../../lib/brands';
import { prefersReducedMotion } from '../../lib/motion/tokens';

interface BrandCarouselProps {
  brands: BrandEntry[];
  primary: string;
}

/** Pointer travel before a drag counts as a drag rather than a click. */
const DRAG_THRESHOLD = 6;

export default function BrandCarousel({ brands, primary }: BrandCarouselProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });

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

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    syncScrollState();
    rail.addEventListener('scroll', syncScrollState, { passive: true });

    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncScrollState) : null;
    observer?.observe(rail);

    // Products load in the background — the rail grows, so recompute.
    const timer = window.setTimeout(syncScrollState, 400);

    return () => {
      rail.removeEventListener('scroll', syncScrollState);
      observer?.disconnect();
      window.clearTimeout(timer);
    };
  }, [syncScrollState, brands.length]);


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
    if (!rail || !drag.active) return;

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

  if (!tiles.length) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-8 scroll-animate scroll-fadeInDown">
        <h2 className="text-lg sm:text-2xl md:text-3xl font-light text-gray-900 mb-1 sm:mb-2 tracking-tight px-4">
          Shop by <span className="font-serif italic" style={{ color: primary }}>Brand</span>
        </h2>
        <p className="text-gray-500 text-[10px] sm:text-sm max-w-xl mx-auto px-4">
          Discover your favorite designers
        </p>
      </div>

      {/* Brands carousel — same cards, now on a swipeable rail.
          The arrows live in the side gutter (sm:px-9) so they never
          cover a card; phones just swipe. */}
      <div className="relative px-0 sm:px-9 mb-4 sm:mb-8">
        <div className="relative">
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
              className={`group relative cursor-pointer scroll-animate scroll-zoomIn stagger-${Math.min(index + 1, 6)} w-[120px] sm:w-[140px] md:w-[160px] shrink-0 focus:outline-none`}
              aria-label={`Shop ${brand.name}`}
            >
              {/* White card with border and theme colored shadow on hover */}
              <div
                className="relative bg-white rounded-2xl p-2 sm:p-5 md:p-6 border-2 border-gray-200 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center min-h-[72px] sm:min-h-[120px] gap-1.5 sm:gap-2.5 group-hover:shadow-lg group-focus-visible:shadow-lg"
                style={{
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 10px 25px ${primary}40`;
                  e.currentTarget.style.borderColor = primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                {/* Brand tag icon on a soft theme tint */}
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 sm:h-11 sm:w-11"
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
                <p className="text-center text-[8px] sm:text-[10px] md:text-sm font-medium tracking-tight text-gray-700 leading-tight uppercase">
                  {brand.name}
                </p>
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
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:shadow-lg transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none"
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
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:shadow-lg transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Bottom CTA */}
      <div className="text-center scroll-animate scroll-fadeInUp">
        <button
          onClick={() => window.location.href = '/products'}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-10 py-2 sm:py-3.5 text-white font-semibold text-[10px] sm:text-sm uppercase tracking-wide rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:opacity-90"
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
