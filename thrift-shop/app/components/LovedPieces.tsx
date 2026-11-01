'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import LoveButton from './LoveButton';
import { gsap } from '../../lib/motion/gsap';
import { DURATION, EASE, prefersReducedMotion } from '../../lib/motion/tokens';
import { Product } from '../types';

/**
 * ============================================================
 *  MOST LOVED PIECES — the showcase of the community's favourites
 * ============================================================
 *
 *  The three pieces the customers love most, standing on a stage.
 *
 *  THE 3D STAGE
 *  ------------
 *  The deck lives in real space and every layer owns exactly one transform,
 *  so the pointer, the scroll and the hover states can never fight over the
 *  same property:
 *
 *    .loved-stage         the vanishing point and the light that follows
 *                         the cursor across the deck
 *    .loved-grid          the deck itself — it leans towards the pointer
 *    .loved-card          the tile — the slow float that keeps the showcase
 *                         from ever looking frozen
 *    .loved-card-depth    how far the piece has turned away from the viewer
 *                         and how far it has receded
 *    .loved-card-inner    the entrance — GSAP owns this transform
 *    .loved-card-surface  the card — cursor tilt, hover lift, hover pop
 *
 *  The depth and the tilt arrive as custom properties, exactly like the
 *  spotlight in `useCinematicMotion`, so the pointer handler writes numbers
 *  instead of grabbing the transform away from GSAP and the hover states.
 *
 *  Colour comes from the merchant's runtime theme, so a rebrand does not
 *  require touching this file.
 * ============================================================
 */

interface LovedPiecesProps {
  /** The pieces the community loves most — already ranked by love count. */
  products: Product[];
  /** The merchant's brand colour. */
  primary: string;
  /** The currency symbol the shop trades in. */
  currencySymbol: string;
  /** The pieces this visitor saved. */
  wishlist: number[];
  /** Opens the detail view for a piece. */
  onViewDetails: (product: Product) => void;
  /** Saves or unsaves a piece. */
  onToggleWishlist: (productId: number) => void;
}

/** How many pieces the showcase shows. */
const SHOWCASE_SIZE = 3;

/** How far the deck leans towards the pointer, in degrees, at its very edge. */
const MAX_STAGE_TILT_X = 3.2;
const MAX_STAGE_TILT_Y = 5;

/** How far a card leans away from the cursor, in degrees, at its very edge. */
const MAX_TILT_X = 7;
const MAX_TILT_Y = 10;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/* ------------------------------------------------------------------ *
 * One piece
 * ------------------------------------------------------------------ */

interface LovedCardProps {
  product: Product;
  index: number;
  currencySymbol: string;
  saved: boolean;
  onViewDetails: (product: Product) => void;
  onToggleWishlist: (productId: number) => void;
}

function LovedCard({
  product,
  index,
  currencySymbol,
  saved,
  onViewDetails,
  onToggleWishlist,
}: LovedCardProps) {
  const sold = product.reservation_status === 'sold' || !product.inStock;
  const reserved = !sold && product.reservation_status === 'reserved';
  const original = product.originalPrice;
  const hasDiscount = typeof original === 'number' && original > product.price;
  const discount = hasDiscount ? Math.round((1 - product.price / original) * 100) : 0;
  /** The middle piece is photographed flat, so it is shown as a cut-out. */
  const cutout = index === 1;

  const image =
    product.images && product.images.length > 0
      ? product.images[0]
      : 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=500&fit=crop';

  return (
    <article className="loved-card" data-loved-tile>
      <div className="loved-card-depth">
        {/* The entrance layer — GSAP owns this transform. */}
        <div className="loved-card-inner" data-loved-inner>
          <div
            className="loved-card-surface"
            role="button"
            tabIndex={0}
            aria-label={`View ${product.name}`}
            onClick={() => onViewDetails(product)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onViewDetails(product);
              }
            }}
          >
            <div
              className={`loved-media ${cutout ? 'loved-media-cutout' : ''}`}
              data-spotlight
            >
              <img className="loved-media-img" src={image} alt={product.name} loading="lazy" />

              {sold && (
                <span className="loved-chip loved-chip-sold">
                  <span className="loved-chip-dot" aria-hidden="true" />
                  Sold out
                </span>
              )}

              {reserved && (
                <span className="loved-chip loved-chip-reserved">
                  <span className="loved-chip-dot" aria-hidden="true" />
                  Reserved
                </span>
              )}

              <button
                type="button"
                className={`loved-heart ${saved ? 'is-saved' : ''}`}
                aria-pressed={saved}
                aria-label={
                  saved
                    ? `Remove ${product.name} from your wishlist`
                    : `Save ${product.name} to your wishlist`
                }
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleWishlist(product.id);
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill={saved ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>

              <span className="loved-quick">
                Quick view
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>

            <div className="loved-info">
              <div className="loved-meta">
                <span className="loved-rank">{String(index + 1).padStart(2, '0')}</span>
                <span className="loved-brand">{product.brand}</span>
              </div>

              <h3 className="loved-name">{product.name}</h3>

              <div className="loved-buy">
                <span className="loved-price">
                  {currencySymbol}
                  {product.price}
                </span>

                {hasDiscount && (
                  <span className="loved-was">
                    {currencySymbol}
                    {original}
                  </span>
                )}

                {hasDiscount && discount > 0 && (
                  <span className="loved-save">-{discount}%</span>
                )}

                <div className="loved-love" onClick={(event) => event.stopPropagation()}>
                  <LoveButton
                    productId={product.id}
                    likes={product.likes ?? 0}
                    liked={product.liked_by_me ?? false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * The showcase
 * ------------------------------------------------------------------ */

export default function LovedPieces({
  products,
  primary,
  currencySymbol,
  wishlist,
  onViewDetails,
  onToggleWishlist,
}: LovedPiecesProps) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  /** The card that is currently leaning towards the cursor. */
  const tiltRef = useRef<HTMLElement | null>(null);

  const [mobileIndex, setMobileIndex] = useState(0);

  const showcase = useMemo(() => products.slice(0, SHOWCASE_SIZE), [products]);
  const savedIds = useMemo(() => new Set(wishlist), [wishlist]);

  /**
   * The deck leans towards the pointer and the light follows it.
   *
   * The whole stage turns as a single object, so the showcase reads as three
   * pieces resting on a table rather than three flat pictures. GSAP smooths
   * the movement, so the lean trails the pointer instead of snapping to it.
   */
  useEffect(() => {
    const stage = stageRef.current;
    const grid = gridRef.current;
    if (!stage || !grid) return;
    if (prefersReducedMotion()) return;

    const proxy = { x: 0, y: 0 };
    const light = { x: 0, y: 0 };

    const apply = () => {
      grid.style.setProperty('--loved-stage-rx', `${(proxy.y * MAX_STAGE_TILT_X).toFixed(2)}deg`);
      grid.style.setProperty('--loved-stage-ry', `${(proxy.x * MAX_STAGE_TILT_Y).toFixed(2)}deg`);
    };

    const writeLight = () => {
      stage.style.setProperty('--loved-light-x', `${light.x.toFixed(0)}px`);
      stage.style.setProperty('--loved-light-y', `${light.y.toFixed(0)}px`);
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

      const rect = stage.getBoundingClientRect();
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

      light.x = event.clientX - rect.left;
      light.y = event.clientY - rect.top;
      writeLight();

      lean(x, y, 0.85);
    };

    const onLeave = () => {
      lean(0, 0, 1.2);

      // The light drifts back to the middle of the stage.
      const rect = stage.getBoundingClientRect();
      gsap.to(light, {
        x: rect.width / 2,
        y: rect.height / 2,
        duration: 1.2,
        ease: 'power3.out',
        overwrite: true,
        onUpdate: writeLight,
      });
    };

    const rect = stage.getBoundingClientRect();
    light.x = rect.width / 2;
    light.y = rect.height / 2;
    writeLight();

    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);

    return () => {
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  /** Let the piece settle back to flat. */
  const clearTilt = useCallback(() => {
    const tile = tiltRef.current;
    if (!tile) return;

    tile.style.setProperty('--loved-rx', '0deg');
    tile.style.setProperty('--loved-ry', '0deg');
    tiltRef.current = null;
  }, []);

  /**
   * The card under the cursor leans towards it. Fine pointers only — a
   * finger has no hover, and a dragged finger must not tilt the deck.
   */
  const onGridPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'touch' || prefersReducedMotion()) return;

      const tile = (event.target as HTMLElement).closest<HTMLElement>('[data-loved-tile]');
      if (!tile) {
        clearTilt();
        return;
      }

      if (tiltRef.current !== tile) {
        clearTilt();
        tiltRef.current = tile;
      }

      const rect = tile.getBoundingClientRect();
      const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2 || 1);
      const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2 || 1);

      tile.style.setProperty('--loved-rx', `${(-dy * MAX_TILT_X).toFixed(2)}deg`);
      tile.style.setProperty('--loved-ry', `${(dx * MAX_TILT_Y).toFixed(2)}deg`);
    },
    [clearTilt],
  );

  /* ------------------------------------------------------------------ *
   * Entrance choreography
   * ------------------------------------------------------------------ */

  useGSAP(
    () => {
      const scope = rootRef.current;
      if (!scope) return;

      const eyebrow = scope.querySelector<HTMLElement>('[data-loved-eyebrow]');
      const heading = scope.querySelector<HTMLElement>('[data-loved-heading]');
      const subheading = scope.querySelector<HTMLElement>('[data-loved-subheading]');
      const cta = scope.querySelector<HTMLElement>('[data-loved-cta]');
      const desktop = Array.from(
        scope.querySelectorAll<HTMLElement>('.loved-grid [data-loved-inner]'),
      );
      const mobile = Array.from(
        scope.querySelectorAll<HTMLElement>('.loved-track [data-loved-inner]'),
      );

      if (prefersReducedMotion()) {
        gsap.set(
          [eyebrow, heading, subheading, cta, ...desktop, ...mobile].filter(
            Boolean,
          ) as HTMLElement[],
          { clearProps: 'all', opacity: 1 },
        );
        return;
      }

      const timeline = gsap.timeline({
        scrollTrigger: { trigger: scope, start: 'top 78%', once: true },
        defaults: { ease: EASE.expo },
      });

      if (eyebrow) {
        timeline.fromTo(
          eyebrow,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.4 },
          0,
        );
      }

      if (heading) {
        timeline.fromTo(
          heading,
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: DURATION.slow },
          0.06,
        );
      }

      if (subheading) {
        timeline.fromTo(
          subheading,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: DURATION.slow },
          0.14,
        );
      }

      // The pieces deal in from alternating sides, like a hand being laid
      // out on the table.
      [desktop, mobile].forEach((group) => {
        if (!group.length) return;

        timeline.fromTo(
          group,
          {
            opacity: 0,
            rotateY: (index: number) => (index % 2 === 0 ? -40 : 40),
            rotateX: 12,
            z: -220,
            scale: 0.8,
            y: 30,
          },
          {
            opacity: 1,
            rotateY: 0,
            rotateX: 0,
            z: 0,
            scale: 1,
            y: 0,
            duration: DURATION.cinematic,
            stagger: 0.085,
          },
          0.16,
        );
      });

      if (cta) {
        timeline.fromTo(
          cta,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: DURATION.slow },
          0.42,
        );
      }
    },
    { dependencies: [showcase.length], scope: rootRef },
  );

  if (!showcase.length) return null;

  const lastIndex = showcase.length - 1;

  return (
    <section
      ref={rootRef}
      id="products-section"
      className="loved-section relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-10 sm:py-14 md:py-20"
      style={{ '--loved-primary': primary } as React.CSSProperties}
    >
      <div className="loved-dots" aria-hidden="true" />
      <div className="loved-pool" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center sm:mb-14">
          <span
            className="loved-eyebrow mb-3 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] sm:text-[10px]"
            data-loved-eyebrow
            style={{ backgroundColor: `${primary}15`, color: primary }}
          >
            <span className="loved-eyebrow-dot" aria-hidden="true" />
            Trending Now
          </span>

          <h2
            className="mb-2 text-2xl font-light tracking-tight text-gray-900 sm:mb-3 sm:text-3xl md:text-4xl"
            data-loved-heading
          >
            Most <span className="loved-heading-accent">Loved</span> Pieces
          </h2>

          <p
            className="text-xs tracking-wide text-gray-500 sm:text-sm"
            data-loved-subheading
          >
            Curated favorites from our community
          </p>
        </div>

        {/* The stage — three pieces standing in a row */}
        <div className="loved-stage hidden md:block" ref={stageRef}>
          <div className="loved-light" aria-hidden="true" />

          <div
            className="loved-grid"
            ref={gridRef}
            onPointerMove={onGridPointerMove}
            onPointerLeave={clearTilt}
          >
            {showcase.map((product, index) => (
              <LovedCard
                key={product.id}
                product={product}
                index={index}
                currencySymbol={currencySymbol}
                saved={savedIds.has(product.id)}
                onViewDetails={onViewDetails}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </div>

        {/* Phones — the same pieces, one at a time, turning as they go */}
        <div className="loved-mobile md:hidden">
          <div className="loved-mobile-viewport">
            <div
              className="loved-track"
              style={{ transform: `translate3d(-${mobileIndex * 100}%, 0, 0)` }}
            >
              {showcase.map((product, index) => {
                const offset = index - mobileIndex;
                const distance = Math.min(Math.abs(offset), 1);

                return (
                  <div
                    key={product.id}
                    className="loved-slide"
                    style={
                      {
                        '--loved-m-ry': `${(offset * -22).toFixed(1)}deg`,
                        '--loved-m-scale': (1 - distance * 0.06).toFixed(3),
                        '--loved-m-opacity': (1 - distance * 0.4).toFixed(3),
                      } as React.CSSProperties
                    }
                  >
                    <LovedCard
                      product={product}
                      index={index}
                      currencySymbol={currencySymbol}
                      saved={savedIds.has(product.id)}
                      onViewDetails={onViewDetails}
                      onToggleWishlist={onToggleWishlist}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileIndex((current) => Math.max(current - 1, 0))}
            disabled={mobileIndex === 0}
            className="loved-nav loved-nav-prev"
            aria-label="Previous piece"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() =>
              setMobileIndex((current) => Math.min(current + 1, lastIndex))
            }
            disabled={mobileIndex === lastIndex}
            className="loved-nav loved-nav-next"
            aria-label="Next piece"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Call to action */}
        <div className="mt-8 text-center sm:mt-14">
          <button
            type="button"
            onClick={() => {
              window.location.href = '/products';
            }}
            className="loved-cta"
            data-loved-cta
          >
            View All Products
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
