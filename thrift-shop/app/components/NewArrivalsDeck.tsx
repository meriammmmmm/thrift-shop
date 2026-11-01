'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import SafeImage from './SafeImage';
import { Product } from '../types';

/**
 * ============================================================
 *  NEW ARRIVALS — the turntable of fresh pieces
 * ============================================================
 *
 *  Five pieces stand on a turntable. The one in the middle is the hero: it
 *  is a little larger than the others and it stands in front of them, but
 *  the difference is a gentle one — the row has to read as five pieces on a
 *  rail, not as one hero with four footnotes.
 *
 *  WHY THE MOVEMENT IS SMOOTH
 *  --------------------------
 *  Every piece stays mounted for the whole life of the carousel. Its place
 *  on the turntable is a signed distance from the piece in the middle, and
 *  that distance is written into a custom property, so the CSS transition
 *  carries the piece from one place to the next.
 *
 *  The earlier version keyed the pieces by their slot, so every move tore
 *  the whole row down and rebuilt it — which is why it felt like a jump.
 *  Here the pieces slide, the outer two fade as they leave, and the one
 *  that arrives is already invisible until it has slid into place.
 * ============================================================
 */

interface NewArrivalsDeckProps {
  /** The freshest pieces, newest first. */
  products: Product[];
  currencySymbol: string;
  onViewDetails: (product: Product) => void;
}

/** The piece in the middle stands this much further forward. */
const HERO_SCALE = 1;
const NEIGHBOUR_SCALE = 0.87;
const OUTER_SCALE = 0.77;

/** How the pieces fade as they move away from the middle. */
const HERO_OPACITY = 1;
const NEIGHBOUR_OPACITY = 0.9;
const OUTER_OPACITY = 0.72;

/** How far the pieces turn away from the viewer, in degrees per step. */
const MAX_TILT = 9;

/** How far they recede into the stage, in pixels per step. */
const MAX_RECESS = 30;

/** Where a piece waits off-stage, in slots. */
const PARKED_SLOT = 2.9;

/** Pointer travel before a drag counts as a drag rather than a click. */
const DRAG_THRESHOLD = 8;

/** Pointer travel that turns a drag into a step. */
const SWIPE_THRESHOLD = 40;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function NewArrivalsDeck({
  products,
  currencySymbol,
  onViewDetails,
}: NewArrivalsDeckProps) {
  const [index, setIndex] = useState(0);
  const dragRef = useRef({ startX: 0, moved: false });

  const count = products.length;

  const step = useCallback(
    (direction: -1 | 1) => {
      setIndex((current) => {
        if (!count) return current;
        return (current + direction + count) % count;
      });
    },
    [count],
  );

  /**
   * Every piece, with its signed distance from the middle of the turntable.
   *
   * The distance is circular, so the collection never runs out — the piece
   * after the last one is the first one again.
   */
  const pieces = useMemo(() => {
    return products.map((product, position) => {
      let distance = (position - index + count) % count;
      // Keep the distance balanced around the middle of the ring.
      if (distance > count / 2) distance -= count;

      const away = Math.abs(distance);

      return {
        product,
        distance,
        away,
        slot: clamp(distance, -PARKED_SLOT, PARKED_SLOT),
        scale:
          away === 0 ? HERO_SCALE : away === 1 ? NEIGHBOUR_SCALE : OUTER_SCALE,
        opacity:
          away === 0
            ? HERO_OPACITY
            : away === 1
              ? NEIGHBOUR_OPACITY
              : away === 2
                ? OUTER_OPACITY
                : 0,
        tilt: -distance * MAX_TILT,
        recess: -away * MAX_RECESS,
      };
    });
  }, [products, index, count]);

  const centre = count ? products[index % count] : null;

  /* ------------------------------------------------------------------ *
   * Dragging
   * ------------------------------------------------------------------ */

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragRef.current = { startX: event.clientX, moved: false };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag.moved) return;
    if (Math.abs(event.clientX - drag.startX) > DRAG_THRESHOLD) {
      drag.moved = true;
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const delta = event.clientX - drag.startX;

    dragRef.current = { startX: 0, moved: false };

    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    // Dragging the pieces to the left brings the next ones forward.
    step(delta < 0 ? 1 : -1);
  };

  if (!count || !centre) return null;

  return (
    <div className="new-arrivals-stage">
      <button
        type="button"
        onClick={() => step(-1)}
        className="new-arrivals-arrow new-arrivals-arrow-prev"
        aria-label="Previous products"
      >
        <svg
          className="h-4 w-4 sm:h-5 sm:w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="new-arrivals-deck-wrap">
        <div
          className="new-arrivals-deck"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {pieces.map(({ product, distance, away, slot, scale, opacity, tilt, recess }) => (
            <button
              key={product.id}
              type="button"
              className="new-arrivals-circle"
              data-hero={distance === 0 ? 'true' : undefined}
              data-far={away > 1 ? 'true' : undefined}
              style={
                {
                  '--slot-x': slot,
                  '--slot-ry': `${tilt}deg`,
                  '--slot-z': `${recess}px`,
                  '--slot-scale': scale,
                  '--slot-opacity': opacity,
                  '--slot-opacity-mobile': away <= 1 ? opacity : 0,
                  zIndex: 20 - away,
                } as React.CSSProperties
              }
              aria-label={product.name}
              onClick={() => {
                // A drag that ends on a piece is not a click.
                if (dragRef.current.moved) {
                  dragRef.current.moved = false;
                  return;
                }
                onViewDetails(product);
              }}
            >
              <SafeImage
                images={product.images}
                alt={product.name}
                className="new-arrivals-image"
                loading="eager"
              />

              {!product.inStock && <span className="new-arrivals-sold">Sold</span>}
            </button>
          ))}
        </div>

        <div className="new-arrivals-caption" key={centre.id}>
          <span className="new-arrivals-caption-brand">{centre.brand}</span>
          <span className="new-arrivals-caption-name">{centre.name}</span>
          <span className="new-arrivals-caption-price">
            {currencySymbol}
            {centre.price}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => step(1)}
        className="new-arrivals-arrow new-arrivals-arrow-next"
        aria-label="Next products"
      >
        <svg
          className="h-4 w-4 sm:h-5 sm:w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
