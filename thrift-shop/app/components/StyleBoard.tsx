'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Product } from '../types';
import SafeImage from './SafeImage';
import {
  BOARD_SLOTS,
  Slot,
  buildFullLook,
  rankSuggestions,
  slotLabel,
  toSlot,
} from '../../lib/styleMatching';
import { LookDefinition, LookState, looksToState, resolveLooks, stateFullPrice, statePieces, stateTotal } from '../../lib/looks';
import { createOutfit, productToOutfitItem, OCCASION_OPTIONS } from '../../lib/outfitStore';

interface StyleBoardProps {
  products: Product[];
  currencySymbol: string;
  onSelect: (product: Product) => void;
  /** Controlled — the gallery above loads a curated look straight into here. */
  look: LookState;
  onLookChange: (next: LookState) => void;
  /** Looks curated in the admin panel — the board starts from these. */
  looks?: LookDefinition[];
  activeLookId?: string | null;
  onLoadLook?: (lookId: string, state: LookState) => void;
}

const SPARKLE_GLYPHS = ['✦', '✧', '⋆', '✶'];

/**
 * The slots the board shows, in wear order.
 *
 * A dress gets its own slot: the admin can curate a dress-and-corset outfit,
 * and without it the dress had nowhere to go and the look rendered empty.
 */
const BOARD_LAYOUT: { slot: Slot; label: string }[] = [
  { slot: 'dress', label: 'Dress' },
  { slot: 'top', label: 'Top' },
  { slot: 'bottom', label: 'Bottom' },
  { slot: 'shoes', label: 'Shoes' },
  { slot: 'bag', label: 'Bag' },
];

export default function StyleBoard({
  products,
  currencySymbol,
  onSelect,
  look,
  onLookChange,
  looks = [],
  activeLookId = null,
  onLoadLook,
}: StyleBoardProps) {
  const [seed, setSeed] = useState(0);
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);
  const [occasIdx, setOccasIdx] = useState(0);
  const [saved, setSaved] = useState(false);
  const [bursts, setBursts] = useState<{ id: number; slot: Slot }[]>([]);
  const [thread, setThread] = useState<{ id: number; left: number; top: number; width: number } | null>(null);
  const [visible, setVisible] = useState(false);

  const sectionRef = useRef<HTMLElement | null>(null);
  const slotRefs = useRef<Partial<Record<Slot, HTMLDivElement | null>>>({});
  const timers = useRef<number[]>([]);

  // Release the entrance animation only once the board is on screen.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const reveal = () => setVisible(true);

    // Already in view at mount — show it straight away.
    if (node.getBoundingClientRect().top < window.innerHeight) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(node);

    // Fail-safe: the slots must never stay invisible if the observer misses.
    const timer = window.setTimeout(reveal, 3000);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  const pool = useMemo(() => products.filter((p) => Array.isArray(p.images) && p.images.length > 0), [products]);
  const picked = useMemo(() => statePieces(look), [look]);

  /** Looks curated in the admin panel, resolved against the catalogue. */
  const curated = useMemo(
    () => resolveLooks(looks, products).filter((entry) => entry.pieces.length > 0),
    [looks, products]
  );

  const activeLook = useMemo(
    () => curated.find((entry) => entry.def.id === activeLookId) ?? null,
    [curated, activeLookId]
  );

  const loadLook = (definition: LookDefinition) => {
    const state = looksToState(definition, products);
    onLookChange(state);
    onLoadLook?.(definition.id, state);
  };

  const suggestions = useMemo(
    () => rankSuggestions(pool, picked, 14, seed),
    [pool, picked, seed]
  );

  const total = useMemo(() => stateTotal(look), [look]);
  const fullPrice = useMemo(() => stateFullPrice(look), [look]);
  const savedPercent = fullPrice > total ? Math.round(((fullPrice - total) / fullPrice) * 100) : 0;

  const pickProduct = (product: Product, sourceEl?: HTMLElement | null) => {
    const slot = toSlot(product);
    if (slot === 'dress') {
      // A dress replaces the bottom layer it covers. The top stays: a corset
      // or blazer over a dress is a legitimate styling, and the admin panel
      // curates exactly that.
      onLookChange({ ...look, dress: product, bottom: undefined });
    } else {
      onLookChange({ ...look, [slot]: product });
    }
    setActiveSlot(null);

    const target = slotRefs.current[slot];
    if (sourceEl && target) {
      const from = sourceEl.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const x1 = from.left + from.width / 2;
      const x2 = to.left + to.width / 2;
      setThread({ id: Date.now(), left: Math.min(x1, x2), top: from.top + from.height / 2, width: Math.abs(x2 - x1) });
      timers.current.push(window.setTimeout(() => setThread(null), 760));
    }

    const id = Date.now() + Math.random();
    setBursts((prev) => [...prev, { id, slot }]);
    timers.current.push(window.setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 900));
  };

  const removePiece = (slot: Slot) => {
    const next = { ...look };
    delete next[slot];
    onLookChange(next);
  };

  const surpriseMe = () => {
    const built = buildFullLook(pool, seed + 1) as LookState;
    const next: LookState = { ...built };
    if (built.dress) {
      next.bottom = undefined;
    }
    onLookChange(next);
    setSeed((s) => s + 1);
    setActiveSlot(null);

    const id = Date.now();
    setBursts((prev) => [
      ...prev,
      ...BOARD_SLOTS.map((s, i) => ({ id: id + i, slot: s.slot })),
    ]);
    timers.current.push(window.setTimeout(() => setBursts([]), 900));
  };

  const resetLook = () => {
    onLookChange({});
    setActiveSlot(null);
    setSaved(false);
  };

  const saveLook = () => {
    if (picked.length === 0) return;
    createOutfit(
      `${OCCASION_OPTIONS[occasIdx].label} look`,
      picked.map(productToOutfitItem),
      { occasion: OCCASION_OPTIONS[occasIdx].id }
    );
    setSaved(true);
    timers.current.push(window.setTimeout(() => setSaved(false), 2400));
  };

  if (pool.length < 3) return null;

  return (
    <section
      id="style-board"
      ref={sectionRef}
      className={`style-board py-14 sm:py-20 ${visible ? 'style-board--visible' : ''}`}
      style={{ background: 'linear-gradient(180deg, #fdf8f9 0%, #ffffff 45%, #f6e8eb 100%)' }}
    >
      <div
        className="style-board__blob"
        style={{ width: 320, height: 320, top: '-60px', left: '-80px', background: '#e8b4d9', animationDelay: '0s' }}
      />
      <div
        className="style-board__blob"
        style={{ width: 260, height: 260, top: '40%', right: '-70px', background: '#c98c9c', animationDelay: '-7s' }}
      />
      <div
        className="style-board__blob"
        style={{ width: 200, height: 200, bottom: '-50px', left: '30%', background: '#f2d3dc', animationDelay: '-13s' }}
      />

      <div className="style-board__inner max-w-7xl mx-auto px-4 sm:px-6">
        {/* ---------------------------------------------------------- header */}
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-xs font-medium uppercase tracking-[0.24em] mb-3" style={{ color: 'var(--color-accent, #c98c9c)' }}>
            Mix &amp; Match
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-gray-900 mb-4">
            Build the <span className="italic font-serif" style={{ color: 'var(--color-primary, #731528)' }}>Look</span>
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Pick one piece and we will find the rest. Every suggestion is matched on colour harmony,
            complementary cut and price balance — so the outfit actually works together.
          </p>
        </div>

        {/* ----------------------------------------------------------- slots */}
        {activeLook && (
          <p className="flex items-center gap-2 mb-4 text-xs text-gray-500">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--color-primary, #731528)' }}
              aria-hidden="true"
            />
            Building from <span className="font-semibold text-gray-900">{activeLook.def.name}</span>
            <button
              type="button"
              onClick={() => { onLookChange({}); onLoadLook?.('', {}); }}
              className="underline underline-offset-2 hover:text-[#731528] transition-colors"
            >
              clear
            </button>
          </p>
        )}

        {/* The board only earns its space once something is on it — an empty
            grid of dashed placeholders read as a broken section. */}
        <div
          className={
            picked.length > 0
              ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5'
              : 'grid grid-cols-1'
          }
        >
          {picked.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#e8d0d7] bg-white/70 px-6 sm:px-10 py-10 sm:py-14 text-center">
              <span
                className="inline-grid place-items-center w-12 h-12 rounded-full mb-4 text-xl"
                style={{ background: 'var(--color-primary-light, #f6e8eb)', color: 'var(--color-primary, #731528)' }}
                aria-hidden="true"
              >
                ✦
              </span>
              <h3 className="text-lg sm:text-xl font-light text-gray-900 mb-2">
                Nothing on the board yet
              </h3>
              <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed mb-6">
                Start from one of the complete looks we styled above — every piece drops
                straight onto this board — or tap any piece below and build it your way.
              </p>
              <button
                type="button"
                onClick={() => {
                  document.getElementById('complete-looks')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-5 py-2.5 rounded-full text-xs uppercase tracking-[0.12em] font-semibold text-white transition-all duration-300 hover:scale-105"
                style={{ background: 'var(--color-primary, #731528)' }}
              >
                Browse the complete looks
              </button>
            </div>
          ) : (
            BOARD_LAYOUT.map((entry, i) => {
            const { slot, label } = entry;
            const piece = look[slot];
            const covered = Boolean(look.dress) && slot === 'bottom';
            const slotBursts = bursts.filter((b) => b.slot === slot);

            return (
              <div
                key={slot}
                ref={(node) => { slotRefs.current[slot] = node; }}
                className={`style-slot ${activeSlot === slot ? 'style-slot--active' : ''} ${piece ? 'style-slot--filled' : ''} ${
                  slot === 'dress' ? 'sm:col-span-2 lg:col-span-1' : ''
                }`}
                style={{ ['--slot-delay' as string]: `${i * 110}ms` }}
              >
                <div className="style-slot__frame rounded-2xl bg-white shadow-sm">
                  {piece ? (
                    <button
                      type="button"
                      onClick={() => onSelect(piece)}
                      className="block w-full text-left group"
                      aria-label={`View ${piece.name}`}
                    >
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <SafeImage
                          images={piece.images}
                          alt={piece.name}
                          className="w-full h-full object-cover"
                        />
                        {activeSlot === slot && <span className="style-slot__sweep" aria-hidden="true" />}
                        {slotBursts.map((b, k) => (
                          <span
                            key={b.id}
                            className="style-slot__sparkle"
                            style={{ left: `${28 + k * 22}%`, top: `${34 + (k % 2) * 24}%`, animationDelay: `${k * 70}ms`, fontSize: `${16 + k * 5}px` }}
                            aria-hidden="true"
                          >
                            {SPARKLE_GLYPHS[k % SPARKLE_GLYPHS.length]}
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removePiece(slot); }}
                          className="absolute top-2 right-2 z-[3] w-7 h-7 rounded-full bg-white/95 text-gray-700 text-sm leading-none shadow hover:bg-white hover:text-[#731528] transition-colors"
                          aria-label={`Remove ${piece.name} from the look`}
                        >
                          ×
                        </button>
                      </div>
                      <div className="p-2.5 sm:p-3">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400 mb-1">{label}</p>
                        <p className="text-xs sm:text-sm text-gray-800 leading-snug line-clamp-2 mb-1.5">{piece.name}</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-primary, #731528)' }}>
                          {currencySymbol}{(Number(piece.price) || 0).toFixed(0)}
                        </p>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveSlot((prev) => (prev === slot ? null : slot))}
                      className={`style-slot__empty w-full aspect-[3/4] rounded-2xl flex flex-col items-center justify-center gap-2 ${covered ? 'opacity-45 pointer-events-none' : ''}`}
                      aria-label={`Choose a ${label.toLowerCase()}`}
                    >
                      {covered ? (
                        <>
                          <span className="text-2xl" aria-hidden="true">👗</span>
                          <span className="text-[10px] uppercase tracking-[0.14em] text-gray-400 px-2 text-center">
                            Covered by your dress
                          </span>
                        </>
                      ) : (
                        <>
                          <span
                            className="w-10 h-10 rounded-full grid place-items-center text-xl"
                            style={{ background: 'var(--color-primary-light, #f6e8eb)', color: 'var(--color-primary, #731528)' }}
                            aria-hidden="true"
                          >
                            +
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.16em] text-gray-500">{label}</span>
                          <span className="text-[10px] text-gray-400 px-3 text-center">Tap to focus</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
            })
          )}
        </div>

        {/* ---------------------------------------------------------- totals */}
        <div className="mt-6 sm:mt-8 rounded-2xl style-total px-5 sm:px-7 py-5 text-white flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-1">Your look</p>
            <p className="text-2xl sm:text-3xl font-light">
              {picked.length === 0 ? (
                <span className="text-white/75 text-lg sm:text-xl">Pick a piece to begin</span>
              ) : (
                <>
                  {currencySymbol}{total.toFixed(0)}
                  {savedPercent > 0 && (
                    <span className="text-sm font-normal text-white/80 ml-2">
                      · saving {savedPercent}%
                    </span>
                  )}
                </>
              )}
            </p>
            {picked.length > 0 && (
              <p className="text-xs text-white/70 mt-1">
                {picked.length} {picked.length === 1 ? 'piece' : 'pieces'} ·{' '}
                {picked.map((p) => slotLabel(toSlot(p))).join(' + ')}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={surpriseMe}
              className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-xs uppercase tracking-[0.12em] transition-all duration-300 hover:scale-105"
            >
              ✨ Surprise me
            </button>
            <button
              type="button"
              onClick={saveLook}
              disabled={picked.length === 0}
              className="px-4 py-2 rounded-full bg-white text-[#731528] text-xs uppercase tracking-[0.12em] font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saved ? 'Saved ✓' : 'Save look'}
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = '/products'; }}
              className="px-4 py-2 rounded-full border border-white/60 text-xs uppercase tracking-[0.12em] transition-all duration-300 hover:bg-white hover:text-[#731528]"
            >
              Shop the look
            </button>
            {picked.length > 0 && (
              <button
                type="button"
                onClick={resetLook}
                className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-white/70 hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------ suggestions */}
        <div className="mt-10 sm:mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--color-accent, #c98c9c)' }}>
                {picked.length === 0 ? 'Start anywhere' : 'Matched to your picks'}
              </p>
              <h3 className="text-xl sm:text-2xl font-light text-gray-900">
                {activeSlot
                  ? `Choose a ${slotLabel(activeSlot).toLowerCase()}`
                  : picked.length === 0
                    ? 'Pieces to start with'
                    : 'Pieces that go with what you picked'}
              </h3>
              {suggestions[0] && (
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-2">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--color-accent, #c98c9c)' }}
                    aria-hidden="true"
                  />
                  {suggestions[0].reason}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {OCCASION_OPTIONS.slice(0, 4).map((occasion, i) => (
                <button
                  key={occasion.id}
                  type="button"
                  onClick={() => setOccasIdx(i)}
                  className={`px-3 py-1.5 rounded-full text-[11px] transition-all duration-300 border ${
                    occasIdx === i
                      ? 'text-white border-transparent shadow-sm'
                      : 'text-gray-600 border-gray-200 hover:border-[#c98c9c] hover:text-[#731528]'
                  }`}
                  style={occasIdx === i ? { background: 'var(--color-primary, #731528)' } : undefined}
                >
                  {occasion.icon} {occasion.label}
                </button>
              ))}
            </div>
          </div>

          <div className="style-rail">
            {suggestions.map((suggestion) => {
              const already = picked.some((p) => p.id === suggestion.product.id);
              return (
                <button
                  key={suggestion.product.id}
                  type="button"
                  disabled={already}
                  onClick={(e) => pickProduct(suggestion.product, e.currentTarget)}
                  className={`style-card ${already ? 'style-card--picked' : ''}`}
                  aria-label={`Add ${suggestion.product.name} to the look — ${suggestion.score}% match`}
                >
                  <span className="style-card__badge">{suggestion.score}%</span>
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <SafeImage
                      images={suggestion.product.images}
                      alt={suggestion.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2.5">
                    <p className="text-[9px] uppercase tracking-[0.14em] text-gray-400 mb-1">
                      {slotLabel(suggestion.slot)}
                    </p>
                    <p className="text-[11px] leading-snug text-gray-800 line-clamp-2 mb-1.5 min-h-[2.2em]">
                      {suggestion.product.name}
                    </p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-primary, #731528)' }}>
                      {currencySymbol}{(Number(suggestion.product.price) || 0).toFixed(0)}
                    </p>
                  </div>
                </button>
              );
            })}

            {suggestions.length === 0 && (
              <p className="text-sm text-gray-500 py-8 px-2">
                You have picked every matchable piece — hit <span className="font-semibold">Clear</span> to start again.
              </p>
            )}
          </div>
        </div>

        {thread && (
          <span
            key={thread.id}
            className="style-thread"
            style={{ left: thread.left, top: thread.top, width: Math.max(thread.width, 40) }}
            aria-hidden="true"
          />
        )}
      </div>
    </section>
  );
}