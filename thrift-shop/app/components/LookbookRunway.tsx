'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from 'framer-motion';
import { Product } from '../types';
import SafeImage from './SafeImage';
import { LookDefinition, resolveLooks } from '../../lib/looks';
import { SPRING, prefersReducedMotion } from '../../lib/motion/tokens';

/**
 * ============================================================
 *  THE LOOKBOOK RUNWAY — "Wear the whole look"
 * ============================================================
 *
 *  A cinematic rail of complete outfits.
 *
 *  Every look is owned by the merchant: in the admin panel they upload a
 *  photo of the whole outfit being worn and attach the pieces that make
 *  it up. This section only puts that on the stage — the focused look
 *  stands upright and sharp, the neighbours turn away, recede and fall
 *  out of focus, and the panel lists the pieces of the focused look.
 *
 *  Motion rules (the house rules, one owner per layer):
 *    - Framer Motion owns the slide transform (position, turn, depth).
 *    - CSS owns the orbital placement of the companion pieces.
 *    - CSS owns the idle float of the companion pieces.
 *    - Nothing else touches a transform on those layers.
 */

interface LookbookRunwayProps {
  /** The looks the merchant published in the admin panel. */
  looks: LookDefinition[];
  /** The catalogue — used to resolve each look's pieces into full products. */
  products: Product[];
  /** The live theme colour — the CTA and the accents follow the merchant. */
  primary: string;
  currencySymbol: string;
  onViewDetails: (product: Product) => void;
  onAddLookToBag: (pieces: Product[]) => void | Promise<void>;
  /** Adds one single piece to the bag — the "+" beside each product. */
  onAddPieceToBag?: (product: Product) => void | Promise<void>;
}

/** How long a look holds the stage before the runway moves on. */
const AUTOPLAY_MS = 6200;

/**
 * How far a neighbour sits from the focused look, as a share of the stage.
 *
 * The phone wears the same runway as the wide screen: the focused outfit
 * stands in the middle with its neighbours turned away right beside it, so
 * four neighbours are in sight the way they are on a wide screen.
 *
 * The step follows the size of the outfit on the stage — on the wide
 * screen the outfit is about a fifth of the stage and the neighbours stand
 * that far apart; on a phone the outfit takes up more of the narrow stage,
 * so the neighbours stand closer in absolute terms and stay beside it.
 */
function stepFor(width: number): number {
  if (width < 520) return 24;
  return 22;
}

/**
 * The smallest drag that counts as a swipe, in pixels.
 *
 * It is a share of the distance one look covers, so a swipe feels the same
 * on a phone and on a wide screen.
 */
function swipeThreshold(pixelsPerLook: number): number {
  if (!pixelsPerLook) return 32;
  return Math.min(48, Math.max(24, pixelsPerLook * 0.18));
}

/** The saving the visitor gets for taking the whole look. */
const BUNDLE_DISCOUNT = 0.1;

interface SlideProps {
  look: {
    id: string;
    name: string;
    label: string;
    wornImage: string;
    pieces: Product[];
  };
  index: number;
  total: number;
  position: MotionValue<number>;
  /** The share of the stage one look covers. */
  step: number;
  reduce: boolean;
  onViewDetails: (product: Product) => void;
}

/**
 * One look on the stage.
 *
 * The distance from the focus is measured on a circle, so the rail can
 * run past the last look and wrap round to the first without a slide
 * ever jumping across the stage.
 */
function RunwaySlide({
  look,
  index,
  total,
  position,
  step,
  reduce,
  onViewDetails,
}: SlideProps) {
  const distance = useTransform(position, (value) => {
    if (!total) return 0;
    let d = ((index - value) % total + total) % total;
    if (d > total / 2) d -= total;
    if (d < -total / 2) d += total;
    return d;
  });

  const x = useTransform(distance, (d) => `${d * step}%`);
  const rotateY = useTransform(distance, (d) => d * 11);
  const z = useTransform(distance, (d) => 40 - Math.min(Math.abs(d), 2.4) * 150);
  const scale = useTransform(distance, (d) => 1 - Math.min(Math.abs(d), 2.4) * 0.1);
  const opacity = useTransform(distance, (d) => 1 - Math.min(Math.abs(d), 2.2) * 0.32);

  /**
   * The blur lives on the individual pieces rather than on the slide
   * itself: a `filter` on the slide would flatten its 3D children and
   * the depth between the pieces would collapse.
   */
  const blur = useTransform(
    distance,
    (d) => `blur(${reduce ? 0 : Math.min(Math.abs(d), 2.2) * 4.5}px)`
  );

  return (
    <motion.div className="runway-slide" style={{ x, rotateY, z, scale }}>
      <div className="runway-slide__stage">
        {/* the whole outfit, worn — the photograph the merchant uploaded */}
        <motion.div className="runway-hero" style={{ filter: blur, opacity }}>
          <button
            type="button"
            className="runway-hero__surface"
            onClick={() => onViewDetails(look.pieces[0])}
            aria-label={`View ${look.label}`}
          >
            <SafeImage
              images={look.wornImage}
              alt={`${look.label} — the complete outfit`}
              className="runway-hero__img"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          </button>
          <span className="runway-hero__tag">{look.label}</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function LookbookRunway({
  looks,
  products,
  primary,
  currencySymbol,
  onViewDetails,
  onAddLookToBag,
  onAddPieceToBag,
}: LookbookRunwayProps) {
  /**
   * Only a look with a photo of the outfit being worn belongs on this
   * stage — the point of the section is the whole look, not a garment.
   */
  const runwayLooks = useMemo(() => {
    const resolved = resolveLooks(looks, products);
    return resolved
      .filter((look) => Boolean(look.def.wornImage) && look.pieces.length > 0)
      .map((look, position) => ({
        id: look.def.id,
        name: look.def.name,
        /**
         * The name is optional in the admin panel, so an unnamed look is
         * labelled by its number instead — "LOOK 01".
         */
        label: look.def.name || `Look ${String(position + 1).padStart(2, '0')}`,
        tagline: look.def.tagline,
        wornImage: look.def.wornImage as string,
        pieces: look.pieces,
        total: look.total,
        bundlePrice: look.total * (1 - BUNDLE_DISCOUNT),
      }));
  }, [looks, products]);

  const [active, setActive] = useState(0);  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [adding, setAdding] = useState(false);
  /**
   * Bumped by every manual action. The autoplay timer is built on it, so the
   * runway waits a full beat after the visitor has touched it instead of
   * yanking the rail out from under their hand.
   */
  const [interactionTick, setInteractionTick] = useState(0);

  /**
   * The absolute position of the rail, in look units.
   *
   * The counter is deliberately never wrapped back to zero: the runway is
   * an endless rail, so the position keeps travelling in one direction for
   * as long as the visitor wants. The looks repeat around the circle,
   * which is what stops the rail from ever running out.
   */
  const position = useMotionValue(0);
  const currentRef = useRef(0);
  /** The spring that is currently carrying the rail to its next stop. */
  const animationRef = useRef<AnimationPlaybackControls | null>(null);
  /** The stage, so a click can bring the focused look back into view. */
  const stageRef = useRef<HTMLDivElement>(null);
  /**
   * How much of the stage one look covers. A phone gets a wide step, so a
   * swipe moves exactly one look and the outfit fills the stage.
   */
  const [stageStep, setStageStep] = useState(22);
  /** The drag in progress: where the finger went down and where the rail was. */
  const dragRef = useRef<{
    x: number;
    y: number;
    position: number;
    moved: boolean;
    axis: 'x' | 'y' | null;
    velocity: number;
    lastX: number;
    lastY: number;
    lastTime: number;
  } | null>(null);
  /** Set after a drag, so the click that follows it does not open a product. */
  const suppressClickRef = useRef(false);

  useEffect(() => {
    setReduce(prefersReducedMotion());
  }, []);

  /**
   * How wide the stage is decides how far apart the looks stand.
   *
   * A phone gets a wide step: one look fills the stage and a swipe moves
   * exactly one look. A wide screen gets a narrow step, so several looks
   * are in sight at once.
   */
  useEffect(() => {
    const measure = () => {
      const width = stageRef.current?.offsetWidth ?? window.innerWidth;
      setStageStep(stepFor(width));
    };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);

    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, [runwayLooks.length]);

  /**
   * Deep link: /#complete-look brings the runway into view.
   *
   * The section only exists once the merchant's looks have arrived, so the
   * browser's own fragment handling fires too early — the scroll is done
   * here instead, once there is something to scroll to.
   */
  useEffect(() => {
    if (!runwayLooks.length) return;
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#complete-look') return;

    const node = document.getElementById('complete-look');
    if (!node) return;

    const timer = window.setTimeout(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [runwayLooks.length]);

  const total = runwayLooks.length;

  /**
   * Carry the rail to an absolute position.
   *
   * The target is a position on the endless rail, never a look number, so
   * the rail always travels the way it was told to. Turning the position
   * back into a look number is what used to send the runway leaping back
   * to the first look once it reached the end of the catalogue.
   */
  const goToPosition = useCallback(
    (target: number, scroll = false, velocity = 0) => {
      if (!total) return;

      currentRef.current = target;
      setActive(((Math.round(target) % total) + total) % total);

      // A spring still in flight would fight the new move.
      animationRef.current?.stop();

      if (reduce) {
        position.set(target);
      } else {
        /**
         * The spring is handed the speed the hand was moving at. A flick
         * that is let go of keeps travelling the way it was going instead
         * of stopping dead and starting again — which is what made the
         * swipe feel like it was fighting the visitor's hand.
         */
        animationRef.current = animate(position, target, {
          type: 'spring',
          ...SPRING.runway,
          velocity: Math.max(-14, Math.min(14, velocity)),
        });
      }

      /**
       * A click on "next" brings the look that just took focus back into
       * view. The stage is taller than the space the visitor gave it, so
       * without this the new outfit can arrive somewhere they are not
       * looking.
       *
       * The page only moves when the focused look is not properly on screen,
       * and it moves to the centre of the window — a long jump would read as
       * the page lurching rather than the runway moving. Autoplay never
       * scrolls: that would drag the page away from whatever the visitor is
       * reading.
       */
      if (scroll) {
        const stage = stageRef.current;
        if (stage) {
          const rect = stage.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const visible = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));

          if (visible < rect.height * 0.7) {
            const scrollTarget = window.scrollY + rect.top - (viewportHeight - rect.height) / 2;
            window.scrollTo({ top: Math.max(0, scrollTarget), behavior: reduce ? 'auto' : 'smooth' });
          }
        }
      }
    },
    [total, position, reduce]
  );

  /**
   * One look along the rail.
   *
   * The rail keeps its direction: it never rewinds to the look the
   * visitor started from, and it never runs out of looks to travel to.
   */
  const step = useCallback(
    (direction: 1 | -1, scroll = false) => {
      if (!total) return;
      goToPosition(currentRef.current + direction, scroll);
    },
    [total, goToPosition]
  );

  // The runway moves on by itself until the visitor pauses it.
  useEffect(() => {
    if (reduce || paused || total < 2) return;

    const timer = window.setInterval(() => {
      if (document.hidden) return;
      if (dragRef.current) return; // never fight the visitor's hand
      step(1);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [reduce, paused, total, step, interactionTick]);

  /** Stepping on behalf of the visitor — this also restarts the autoplay. */
  const userStep = useCallback(
    (direction: 1 | -1) => {
      setInteractionTick((tick) => tick + 1);
      step(direction, true);
    },
    [step]
  );

  /** Jumping to a chapter on behalf of the visitor. */
  const userGoTo = useCallback(
    (index: number) => {
      if (!total) return;

      const base = Math.round(currentRef.current);
      const baseIndex = ((base % total) + total) % total;

      // The chapter the visitor picked, as the nearest stop on the rail.
      let delta = index - baseIndex;
      if (delta > total / 2) delta -= total;
      if (delta < -total / 2) delta += total;

      setInteractionTick((tick) => tick + 1);
      goToPosition(base + delta, true);
    },
    [total, goToPosition]
  );

  // The merchant may publish or withdraw a look while the rail is running.
  useEffect(() => {
    if (!total) return;
    if (active >= total) setActive(0);
  }, [total, active]);

  /**
   * How many pixels one look is worth on the stage.
   *
   * The slides are one step apart, so a drag of that distance moves the
   * runway by exactly one look.
   */
  const pixelsPerLook = () => {
    const width = stageRef.current?.offsetWidth ?? window.innerWidth;
    return (stageStep / 100) * width;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // A secondary mouse button is not a drag.
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    /**
     * The rail stops exactly where the hand grabs it. A spring still in
     * flight would otherwise carry the runway out from under the visitor's
     * fingers, which is what made the swipe feel like it did nothing.
     */
    animationRef.current?.stop();

    // A fresh press always clears the drag guard.
    suppressClickRef.current = false;

    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      position: position.get(),
      moved: false,
      axis: null,
      velocity: 0,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: event.timeStamp,
    };

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* Pointer capture is a nicety — the drag works without it. */
    }
  };

  /**
   * The rail follows the finger.
   *
   * This is what makes the swipe feel like a real rail rather than a button:
   * the outfit slides under the hand while it is being dragged, and only
   * settles when the hand lets go.
   */
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !total) return;

    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;

    /**
     * Which way the finger is travelling decides what the gesture means.
     * A finger that travels sideways walks the runway; a finger that
     * travels up or down is reading the page and has to be left alone.
     *
     * Without this the runway was thrown to a random look every time the
     * page was scrolled past it — the stage sits right where people are
     * scrolling, so a page scroll and a swipe are the same movement.
     */
    if (!drag.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;

      // A clearly sideways gesture is a swipe; anything else is a scroll.
      drag.axis = Math.abs(dx) > Math.abs(dy) * 1.1 ? 'x' : 'y';

      if (drag.axis === 'y') {
        dragRef.current = null;
        suppressClickRef.current = true;
        return;
      }
    }
    if (drag.axis !== 'x') return;

    drag.moved = true;

    const perLook = pixelsPerLook();
    if (!perLook) return;

    // Dragging to the left brings the next look in.
    const next = drag.position - dx / perLook;
    position.set(next);

    // How fast the hand is moving, in pixels per millisecond.
    const elapsed = event.timeStamp - drag.lastTime;
    if (elapsed > 0) {
      const instant = (event.clientX - drag.lastX) / elapsed;
      drag.velocity = drag.velocity * 0.6 + instant * 0.4;
    }
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastTime = event.timeStamp;

    // The panel follows the outfit that is taking focus.
    const focus = Math.round(next);
    setActive(((focus % total) + total) % total);
  };

  /**
   * The browser took the gesture away.
   *
   * This is what happens when the finger decides to scroll the page
   * instead: the browser cancels the pointer and the runway has to put
   * itself back where it was. Letting the release run as if it were a
   * swipe is what threw the runway to a random look mid-scroll.
   */
  const cancelDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* Nothing to release. */
    }

    suppressClickRef.current = true;
    goToPosition(Math.round(drag.position), false);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* Nothing to release. */
    }

    if (!drag.moved) return; // it was a tap — the buttons handle it

    // A drag that ended on a product must not open it.
    suppressClickRef.current = true;

    const distance = event.clientX - drag.x;
    const perLook = pixelsPerLook();

    // Where the rail came to rest, in look units.
    const settled = perLook ? drag.position - distance / perLook : drag.position;
    const start = Math.round(drag.position);
    let target = Math.round(settled);

    /**
     * A flick carries the rail on by one look even when the finger barely
     * travelled — a quick, short swipe is a swipe all the same.
     */
    const flicked = Math.abs(drag.velocity) > 0.45;
    if (flicked && target === start) {
      target = start + (drag.velocity < 0 ? 1 : -1);
    } else if (
      !flicked &&
      Math.abs(distance) >= swipeThreshold(perLook) &&
      target === start
    ) {
      target = start + (distance < 0 ? 1 : -1);
    }

    /**
     * The rail settles on an absolute position. It is never turned back
     * into a look number, so it can never be sent back to where it began.
     *
     * The page is left where the visitor left it: they were already
     * looking at the stage, and a page that moves under a swipe feels
     * like the page took the gesture away from them.
     */
    const carry = perLook ? -(drag.velocity * 1000) / perLook : 0;
    goToPosition(target, false, carry);
    setInteractionTick((tick) => tick + 1);
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      userStep(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      userStep(-1);
    }
  };

  const handleAddLook = async () => {
    const look = runwayLooks[active];
    if (!look || adding) return;
    setAdding(true);
    try {
      await onAddLookToBag(look.pieces);
    } finally {
      setAdding(false);
    }
  };

  if (!total) return null;

  // The merchant may withdraw a look while the rail is running.
  const look = runwayLooks[active] ?? runwayLooks[0];
  if (!look) return null;
  const money = (value: number) => `${currencySymbol}${(Number(value) || 0).toFixed(2)}`;

  return (
    <section
      id="complete-look"
      className="runway"
      aria-labelledby="runway-heading"
      style={{ ['--runway-primary' as string]: primary }}
    >
      <div className="runway__inner">
        {/* ------------------------------------------------------- heading */}
        <div className="runway__head">
          <p className="runway__eyebrow">Styled head to toe</p>
          <h2 id="runway-heading" className="runway__title">
            Wear the whole look.
          </h2>
          <p className="runway__sub">
            {total} {total === 1 ? 'look' : 'looks'}, styled from head to toe. Tap one to see every
            piece.
          </p>
        </div>

        <div className="runway__layout">
          {/* ------------------------------------------------------ stage */}
          <div className="runway__stage">
            <div
              ref={stageRef}
              className="runway__viewport"
              tabIndex={0}
              role="group"
              aria-label="Complete looks — use the arrow keys to browse"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              onPointerCancel={cancelDrag}
              onClickCapture={handleClickCapture}
              onKeyDown={handleKeyDown}
            >
              <div className="runway__backdrop" aria-hidden="true" />
              <div className="runway__track">
                {runwayLooks.map((item, index) => (
                  <RunwaySlide
                    key={item.id}
                    look={item}
                    index={index}
                    total={total}
                    position={position}
                    step={stageStep}
                    reduce={reduce}
                    onViewDetails={onViewDetails}
                  />
                ))}
              </div>
            </div>

            {/* -------------------------------------------------- scrubber */}
            {total > 1 && (
              <div className="runway__scrubber">
                <button
                  type="button"
                  className="runway__arrow"
                  onClick={() => userStep(-1)}
                  aria-label="Previous look"
                >
                  ←
                </button>

                <div className="runway__chapters">
                  <span className="runway__rule" aria-hidden="true">
                    <span
                      className="runway__rule-fill"
                      style={{ width: `${((active + 1) / total) * 100}%` }}
                    />
                  </span>

                  <ol className="runway__chapter-list">
                    {runwayLooks.map((item, index) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`runway__chapter${index === active ? ' is-active' : ''}`}
                          onClick={() => userGoTo(index)}
                          aria-current={index === active}
                        >
                          <span className="runway__chapter-num">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          {index === active && (
                            <span className="runway__chapter-label">{item.label}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>

                <button
                  type="button"
                  className="runway__arrow runway__arrow--play"
                  onClick={() => setPaused((value) => !value)}
                  aria-label={paused ? 'Resume the runway' : 'Pause the runway'}
                  aria-pressed={paused}
                >
                  {paused ? '▶' : '❙❙'}
                </button>

                <button
                  type="button"
                  className="runway__arrow"
                  onClick={() => userStep(1)}
                  aria-label="Next look"
                >
                  →
                </button>
              </div>
            )}
          </div>

          {/* ------------------------------------------------------ panel */}
          <aside className="runway__panel" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={look.id}
                className="runway__panel-body"
                initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduce ? 0 : -8, transition: { duration: 0.16 } }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="runway__panel-head">
                  <h3 className="runway__panel-title">In this look</h3>
                  <span className="runway__panel-count">{look.pieces.length} pieces</span>
                </div>

                <p className="runway__panel-meta">
                  Look {String(active + 1).padStart(2, '0')}
                  {look.name ? ` · ${look.name}` : ''}
                </p>

                {look.tagline && <p className="runway__panel-tagline">{look.tagline}</p>}

                <ul className="runway__piece-list">
                  {look.pieces.map((piece, pieceIndex) => (
                    <li key={piece.id}>
                      <div className="runway__piece-row">
                        <span className="runway__piece-thumb">
                          <SafeImage
                            images={piece.images}
                            alt={piece.name}
                            className="runway__piece-img"
                            loading="lazy"
                          />
                          <span className="runway__piece-badge">{pieceIndex + 1}</span>
                        </span>
                        <button
                          type="button"
                          className="runway__piece-info"
                          onClick={() => onViewDetails(piece)}
                        >
                          <span className="runway__piece-brand">
                            {piece.brand || 'Mery Rose'}
                          </span>
                          <span className="runway__piece-name">{piece.name}</span>
                          <span className="runway__piece-cost">{money(piece.price)}</span>
                        </button>
                        <button
                          type="button"
                          className="runway__piece-add"
                          onClick={() => onAddPieceToBag?.(piece)}
                          aria-label={`Add ${piece.name} to bag`}
                        >
                          +
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="runway__bundle">
                  <div className="runway__bundle-text">
                    <p className="runway__bundle-title">Complete the look</p>
                    <p className="runway__bundle-sub">
                      Bundle all {look.pieces.length} and save 10%
                    </p>
                  </div>
                  <p className="runway__bundle-price">
                    {money(look.bundlePrice)}
                    <span className="runway__bundle-was">{money(look.total)}</span>
                  </p>
                </div>

                <button
                  type="button"
                  className="runway__cta"
                  onClick={handleAddLook}
                  disabled={adding}
                >
                  {adding ? 'Adding…' : 'Add full look to bag'}
                  <span aria-hidden="true"> →</span>
                </button>
              </motion.div>
            </AnimatePresence>
          </aside>
        </div>
      </div>
    </section>
  );
}
