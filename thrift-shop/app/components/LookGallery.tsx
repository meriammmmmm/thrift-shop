'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Product } from '../types';
import SafeImage from './SafeImage';
import { LookDefinition, LookState, ResolvedLook, resolveLooks, looksToState } from '../../lib/looks';
import { slotLabel, toSlot } from '../../lib/styleMatching';

interface LookGalleryProps {
  looks: LookDefinition[];
  products: Product[];
  currencySymbol: string;
  activeLookId: string | null;
  onPickLook: (lookId: string, state: LookState) => void;
  onSelect: (product: Product) => void;
}

/** Shows the complete outfit being worn, or a flat-lay of its pieces. */
function LookVisual({ look }: { look: ResolvedLook }) {
  const { def, pieces } = look;

  if (def.wornImage) {
    return (
      <div className="relative w-full h-full">
        <SafeImage
          images={def.wornImage}
          alt={`${def.name} — complete outfit`}
          className="w-full h-full object-cover"
          loading="eager"
        />
        <span className="look-card__worn-badge">
          <span aria-hidden="true">👗</span> As worn
        </span>
      </div>
    );
  }

  // No worn photo yet — fan the individual pieces into an editorial flat-lay.
  const panels = pieces.slice(0, 4);
  return (
    <div className="look-collage">
      {panels.map((product) => (
        <div key={product.id} className="look-collage__panel">
          <SafeImage
            images={product.images}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

export default function LookGallery({
  looks,
  products,
  currencySymbol,
  activeLookId,
  onPickLook,
  onSelect,
}: LookGalleryProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reveal = () => setVisible(true);

    // Already in view at mount — show it straight away, no waiting on scroll.
    if (node.getBoundingClientRect().top < window.innerHeight) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(node);

    // Fail-safe: cards must never stay invisible if the observer misses.
    const timer = window.setTimeout(reveal, 3000);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  const resolved = useMemo(() => resolveLooks(looks, products), [looks, products]);
  const usable = resolved.filter((look) => look.pieces.length > 0);

  const states = useMemo(() => {
    const map = new Map<string, LookState>();
    for (const look of usable) {
      map.set(look.def.id, looksToState(look.def, products));
    }
    return map;
  }, [usable, products]);

  if (usable.length === 0) return null;

  return (
    <section
      id="complete-looks"
      ref={ref}
      className={`py-14 sm:py-20 bg-white ${visible ? 'gallery--visible' : ''}`}
      aria-labelledby="looks-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <p
            className="text-xs font-medium uppercase tracking-[0.24em] mb-3"
            style={{ color: 'var(--color-accent, #c98c9c)' }}
          >
            Styled by us
          </p>
          <h2 id="looks-heading" className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-gray-900 mb-4">
            The Complete <span className="italic font-serif" style={{ color: 'var(--color-primary, #731528)' }}>Look</span>
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Every piece together, exactly as we styled it — then the individual items, so you can
            take only what you love.
          </p>
        </div>

        <div className="grid gap-5 sm:gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {usable.map((look, index) => {
            const { def } = look;
            const isActive = activeLookId === def.id;
            const state = states.get(def.id) ?? {};
            const pieceCount = look.pieces.length;

            return (
              <article
                key={def.id}
                className={`look-card look-card__reveal ${isActive ? 'ring-2 ring-offset-2' : ''}`}
                style={{
                  ['--look-delay' as string]: `${index * 120}ms`,
                  ...(isActive ? ({ ['--tw-ring-color' as string]: 'var(--color-primary, #731528)' } as Record<string, string>) : {}),
                }}
              >
                {/* ------------------------------- whole outfit being worn */}
                <div className="relative aspect-[4/5] overflow-hidden">
                  <LookVisual look={look} />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 via-black/25 to-transparent">
                    <h3 className="text-white text-lg sm:text-xl font-light leading-tight">{def.name}</h3>
                    <p className="text-white/80 text-xs mt-0.5">{def.tagline}</p>
                  </div>
                </div>

                {/* -------------------------------------- the individual pieces */}
                <div className="p-4 sm:p-5">
                  <p
                    className="text-[10px] uppercase tracking-[0.18em] mb-3"
                    style={{ color: 'var(--color-accent, #c98c9c)' }}
                  >
                    The {pieceCount} pieces
                  </p>

                  <ul className="space-y-1.5 mb-4">
                    {look.pieces.map((product) => (
                      <li key={product.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(product)}
                          className="look-piece w-full text-left"
                          aria-label={`View ${product.name}`}
                        >
                          <span className="look-piece__thumb">
                            <SafeImage
                              images={product.images}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[9px] uppercase tracking-[0.14em] text-gray-400">
                              {slotLabel(toSlot(product))}
                            </span>
                            <span className="block text-xs text-gray-800 leading-snug line-clamp-2">
                              {product.name}
                            </span>
                          </span>
                          <span
                            className="text-xs font-semibold shrink-0"
                            style={{ color: 'var(--color-primary, #731528)' }}
                          >
                            {currencySymbol}{(Number(product.price) || 0).toFixed(0)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-gray-400">Look total</p>
                      <p className="text-base font-semibold" style={{ color: 'var(--color-primary, #731528)' }}>
                        {currencySymbol}{look.total.toFixed(0)}
                        {look.savings > 0 && (
                          <span className="ml-2 text-[11px] font-normal text-gray-400 line-through">
                            {currencySymbol}{look.fullPrice.toFixed(0)}
                          </span>
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onPickLook(def.id, state)}
                      className={`px-4 py-2 rounded-full text-[11px] uppercase tracking-[0.12em] font-semibold transition-all duration-300 hover:scale-105 ${
                        isActive
                          ? 'bg-white text-[#731528] ring-1 ring-[#731528]'
                          : 'text-white'
                      }`}
                      style={isActive ? undefined : { background: 'var(--color-primary, #731528)' }}
                    >
                      {isActive ? 'Loaded ✓' : 'Build this look'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}