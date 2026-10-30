'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ReviewCard, { ReviewCardData } from './ReviewCard';

/**
 * The reviews carousel.
 *
 * The reviews sit in a single track that can be swiped, dragged with a
 * mouse, or moved with the arrow buttons. The cards resize with the screen,
 * so the same carousel works on a phone and on a wide desktop.
 *
 * It is built on a native scroll track with scroll snapping rather than a
 * carousel library: it stays small, it keeps working without JavaScript, and
 * it does not add a dependency to the shop.
 */

interface ReviewCarouselProps {
  reviews: ReviewCardData[];
  /** Called when the helpful button is pressed on a card. */
  onToggleLike?: (id: number, nextLiked: boolean) => void;
}

/** How far the track has to move before a drag counts as a drag. */
const DRAG_THRESHOLD = 5;

export default function ReviewCarousel({ reviews, onToggleLike }: ReviewCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  /** True when every card fits, so the track is centred instead of scrolled. */
  const [centred, setCentred] = useState(false);
  const [dragging, setDragging] = useState(false);

  // The drag is tracked in a ref: a pointer move must not wait for a render.
  const drag = useRef({
    active: false,
    startX: 0,
    startScroll: 0,
    moved: false,
  });

  /** Reads the current scroll position and updates the button and dot state. */
  const syncState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    const scroll = track.scrollLeft;

    setAtStart(scroll <= 1);
    setAtEnd(maxScroll <= 1 || scroll >= maxScroll - 1);

    // The cards are snapped, so the card under the left edge is the one
    // that is showing.
    const card = track.firstElementChild as HTMLElement | null;
    const cardWidth = card ? card.offsetWidth + 24 : 1; // 24 is the gap
    setActiveIndex(Math.max(0, Math.min(reviews.length - 1, Math.round(scroll / cardWidth))));

    setCentred(maxScroll <= 1);
  }, [reviews.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    syncState();

    const observer = new ResizeObserver(syncState);
    observer.observe(track);

    return () => observer.disconnect();
  }, [syncState]);

  /** Moves the track one card to the left or right. */
  const scrollByCard = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;

    const card = track.firstElementChild as HTMLElement | null;
    if (!card) return;

    const step = card.offsetWidth + 24;
    const target = track.scrollLeft + step * direction;
    const maxScroll = track.scrollWidth - track.clientWidth;

    track.scrollTo({
      left: Math.max(0, Math.min(maxScroll, target)),
      behavior: 'smooth',
    });
  };

  /** Moves the track to a card picked from the dots. */
  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    if (!track) return;

    const card = track.firstElementChild as HTMLElement | null;
    if (!card) return;

    const step = card.offsetWidth + 24;
    const maxScroll = track.scrollWidth - track.clientWidth;

    track.scrollTo({
      left: Math.max(0, Math.min(maxScroll, step * index)),
      behavior: 'smooth',
    });
  };

  // ── Dragging with a mouse ───────────────────────────────────────────
  // On a phone the track is swiped natively. On a desktop the pointer has to
  // be dragged instead, which is what these handlers do.

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const track = trackRef.current;
    if (!track) return;

    drag.current = {
      active: true,
      startX: event.clientX,
      startScroll: track.scrollLeft,
      moved: false,
    };

    track.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || !drag.current.active) return;

    const distance = event.clientX - drag.current.startX;

    if (Math.abs(distance) > DRAG_THRESHOLD) {
      drag.current.moved = true;
    }

    track.scrollLeft = drag.current.startScroll - distance;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;

    if (track?.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }

    if (drag.current.moved && track) {
      // Snap to the nearest card once the pointer is released.
      const card = track.firstElementChild as HTMLElement | null;
      if (card) {
        const step = card.offsetWidth + 24;
        const maxScroll = track.scrollWidth - track.clientWidth;
        const target = Math.round(track.scrollLeft / step) * step;

        track.scrollTo({
          left: Math.max(0, Math.min(maxScroll, target)),
          behavior: 'smooth',
        });
      }
    }

    drag.current.active = false;
    setDragging(false);
  };

  /**
   * A click that ends a drag must not reach the card underneath, or the
   * helpful button would be pressed while the user was dragging the track.
   */
  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (drag.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      drag.current.moved = false;
    }
  };

  if (reviews.length === 0) return null;

  return (
    <div className="relative">
      {/* Track */}
      <div
        ref={trackRef}
        onScroll={syncState}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleClickCapture}
        className={`flex gap-6 overflow-x-auto px-4 pb-4 scrollbar-hide ${
          dragging ? 'cursor-grabbing select-none snap-none' : 'cursor-grab snap-x snap-mandatory'
        } ${centred ? 'justify-center' : ''}`}
        style={{ scrollBehavior: 'smooth' }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Customer reviews"
      >
        {reviews.map((review, index) => (
          <div
            key={review.id}
            className="w-[85vw] max-w-[340px] shrink-0 snap-center sm:w-[360px] sm:max-w-none lg:w-[400px]"
            role="group"
            aria-roledescription="slide"
            aria-label={`Review ${index + 1} of ${reviews.length}`}
          >
            <ReviewCard testimonial={review} onToggleLike={onToggleLike} />
          </div>
        ))}
      </div>

      {/* Arrows — hidden while every card fits */}
      {reviews.length > 1 && !centred && (
        <>
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            disabled={atStart}
            aria-label="Previous reviews"
            className="absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-500 shadow-lg backdrop-blur transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:pointer-events-none disabled:opacity-0 sm:flex"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => scrollByCard(1)}
            disabled={atEnd}
            aria-label="Next reviews"
            className="absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-500 shadow-lg backdrop-blur transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:pointer-events-none disabled:opacity-0 sm:flex"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {reviews.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {reviews.map((review, index) => (
            <button
              key={review.id}
              type="button"
              onClick={() => scrollToIndex(index)}
              aria-label={`Go to review ${index + 1}`}
              aria-current={index === activeIndex}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? 'w-6 bg-[var(--color-primary)]'
                  : 'w-1.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
