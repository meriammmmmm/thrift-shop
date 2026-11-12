'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ReviewCard, { ReviewCardData } from './ReviewCard';
import {
  clampRail,
  flingStop,
  pointerVelocity,
  railStops,
  scrollRailTo,
  stopRail,
  type PointerSample,
} from '../../lib/motion/rail';
import { useRailReveal } from '../../lib/motion/useRailReveal';

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
 *
 * THE MOVE
 * --------
 * The track is moved by the shared rail engine rather than by the browser's
 * own smooth scroll, so the move carries the same easing as the rest of the
 * site, a flick keeps its momentum, and the track always lands with a card
 * in the middle — the same place the CSS snap would have put it, so the two
 * never argue.
 *
 * The cards themselves fade in as they reach the track, one shortly after
 * the other, so the row fills in like a hand of cards being dealt.
 */

interface ReviewCarouselProps {
  reviews: ReviewCardData[];
  /** Called when the helpful button is pressed on a card. */
  onToggleLike?: (id: number, nextLiked: boolean) => void;
}

/** How far the track has to move before a drag counts as a drag. */
const DRAG_THRESHOLD = 5;

/** The gap between two cards — the same gap the track is laid out with. */
const GAP = 24;

/**
 * The scroll position that puts a card in the middle of the track.
 *
 * The card is measured against the track itself, so the answer holds
 * whatever padding the track carries and wherever it sits on the page.
 * The scroll the track is at now is added back: the card is measured
 * where it is on screen, and the answer is a place in the track.
 */
function centreOf(track: HTMLElement, card: HTMLElement): number {
  const trackBox = track.getBoundingClientRect();
  const cardBox = card.getBoundingClientRect();

  // The left edge of the scrollport — the padding box, not the border.
  const scrollportLeft = trackBox.left + track.clientLeft;

  return (
    cardBox.left -
    scrollportLeft -
    (track.clientWidth - card.offsetWidth) / 2 +
    track.scrollLeft
  );
}

/** The stop closest to where the track is now. */
function nearestStop(stops: number[], current: number): number {
  let best = stops[0] ?? current;
  let bestDistance = Math.abs(best - current);

  for (const stop of stops) {
    const distance = Math.abs(stop - current);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = stop;
    }
  }

  return best;
}

export default function ReviewCarousel({ reviews, onToggleLike }: ReviewCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [track, setTrack] = useState<HTMLDivElement | null>(null);
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
  /** The tail of the drag, so the track can tell how fast it was thrown. */
  const samples = useRef<PointerSample[]>([]);

  /** Every card in the track, in order. */
  const cards = useCallback((): HTMLElement[] => {
    const element = trackRef.current;
    if (!element) return [];
    return Array.from(element.children) as HTMLElement[];
  }, []);

  /** The places the track may land on, in scroll coordinates. */
  const stops = useCallback((): number[] => {
    const element = trackRef.current;
    if (!element) return [];

    const list = cards();
    if (!list.length) return [];

    const first = list[0];
    const last = list[list.length - 1];

    // Every card is the same width, so the places the track may land on
    // are one card plus the gap apart. Measuring the first card is
    // enough — the track is measured on every scroll it makes.
    if (last.offsetWidth === first.offsetWidth) {
      const step = first.offsetWidth + GAP;
      const centre = centreOf(element, first);

      return list.map((_, index) => clampRail(element, centre + index * step));
    }

    // Cards of different widths: every one of them is measured.
    return railStops(element, list, centreOf);
  }, [cards]);

  /** Reads the current scroll position and updates the button and dot state. */
  const syncState = useCallback(() => {
    const element = trackRef.current;
    if (!element) return;

    const maxScroll = element.scrollWidth - element.clientWidth;
    const scroll = element.scrollLeft;

    setAtStart(scroll <= 1);
    setAtEnd(maxScroll <= 1 || scroll >= maxScroll - 1);
    setCentred(maxScroll <= 1);

    // The cards are snapped, so the card nearest the middle of the track
    // is the one that is showing.
    const list = cards();
    if (list.length) {
      const landing = stops();
      const closest = nearestStop(landing, scroll);
      const index = landing.indexOf(closest);
      setActiveIndex(index >= 0 ? index : 0);
    }
  }, [cards, stops]);

  useEffect(() => {
    const element = trackRef.current;
    if (!element) return;

    syncState();

    const observer = new ResizeObserver(syncState);
    observer.observe(element);

    return () => observer.disconnect();
  }, [syncState]);

  /** Moves the track one card to the left or right. */
  const scrollByCard = (direction: 1 | -1) => {
    const element = trackRef.current;
    if (!element) return;

    const landing = stops();
    if (!landing.length) return;

    const current = nearestStop(landing, element.scrollLeft);
    const index = landing.indexOf(current);
    const next = Math.min(Math.max(index + direction, 0), landing.length - 1);

    scrollRailTo(element, landing[next]);
  };

  /** Moves the track to a card picked from the dots. */
  const scrollToIndex = (index: number) => {
    const element = trackRef.current;
    if (!element) return;

    const landing = stops();
    if (!landing.length) return;

    scrollRailTo(element, landing[Math.min(Math.max(index, 0), landing.length - 1)]);
  };

  // ── Dragging with a mouse ───────────────────────────────────────────
  // On a phone the track is swiped natively. On a desktop the pointer has to
  // be dragged instead, which is what these handlers do.

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const element = trackRef.current;
    if (!element) return;

    // A track that is still animating stops here: the hand takes over.
    stopRail(element);

    // The snap stands down from the first touch of the hand — waiting
    // for the drag threshold would let it pull the track back once.
    element.classList.add('is-dragging');

    drag.current = {
      active: true,
      startX: event.clientX,
      startScroll: element.scrollLeft,
      moved: false,
    };
    samples.current = [{ t: event.timeStamp, x: event.clientX }];

    element.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const element = trackRef.current;
    if (!element || !drag.current.active) return;

    const distance = event.clientX - drag.current.startX;

    if (Math.abs(distance) > DRAG_THRESHOLD) {
      drag.current.moved = true;
    }

    // The tail of the drag, kept short so the speed is the speed of the
    // hand right now and not of the whole drag.
    const trail = samples.current;
    trail.push({ t: event.timeStamp, x: event.clientX });
    if (trail.length > 6) trail.shift();

    element.scrollLeft = drag.current.startScroll - distance;
  };

  /**
   * The hand let go of the track.
   *
   * A throw carries its speed: the track lands on the card it was heading
   * for, which may be further along than the card under the hand.
   */
  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const element = trackRef.current;

    if (element?.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }

    element?.classList.remove('is-dragging');

    drag.current.active = false;
    setDragging(false);

    if (!drag.current.moved || !element) {
      samples.current = [];
      return;
    }

    const velocity = pointerVelocity(samples.current);
    samples.current = [];

    const landing = stops();
    if (!landing.length) return;

    // The hand moves the track the other way round, so the speed of the
    // hand is the speed of the track with the sign flipped.
    scrollRailTo(element, flingStop(element.scrollLeft, -velocity, landing));
  };

  /**
   * The browser took the gesture back — the page was scrolling under the
   * finger, or the system interrupted the drag.
   *
   * That is not a throw: the track keeps the position the browser gave it,
   * and the hand stays out of the way.
   */
  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    const element = trackRef.current;

    if (element?.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }

    element?.classList.remove('is-dragging');

    drag.current.active = false;
    drag.current.moved = false;
    samples.current = [];
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

  // Every card fades in as it reaches the track, a moment after the card
  // before it.
  useRailReveal({ rail: track, selector: '[data-review-slide]', deps: [reviews.length] });

  if (reviews.length === 0) return null;

  return (
    <div className="relative">
      {/* Track */}
      <div
        ref={(element) => {
          trackRef.current = element;
          setTrack(element);
        }}
        onScroll={syncState}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClickCapture={handleClickCapture}
        className={`flex gap-6 overflow-x-auto scroll-smooth px-4 pb-4 scrollbar-hide ${
          dragging ? 'cursor-grabbing select-none snap-none' : 'cursor-grab snap-x snap-mandatory'
        } ${centred ? 'justify-center' : ''}`}
        role="region"
        aria-roledescription="carousel"
        aria-label="Customer reviews"
      >
        {reviews.map((review, index) => (
          <div
            key={review.id}
            data-review-slide
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
