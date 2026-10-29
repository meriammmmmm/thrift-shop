'use client';

import { Product } from '../types';
import { useTheme } from '../../lib/theme';
import { useEffect, useRef } from 'react';
import SafeImage from './SafeImage';

interface WishlistProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Product[];
  onRemove: (productId: number) => void;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  currencySymbol?: string;
}

/** Modern heart glyph with rounded strokes — matches the bag icon. */
function HeartIcon({ className = '', filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

function CloseIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function TrashIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
    </svg>
  );
}

function BagIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
    </svg>
  );
}

export default function Wishlist({
  isOpen,
  onClose,
  wishlist,
  onRemove,
  onAddToCart,
  onViewDetails,
  currencySymbol = '$',
}: WishlistProps) {
  const { theme } = useTheme();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Escape closes the drawer, and the page behind it must not scroll.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const savedCount = wishlist.length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Wishlist">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm backdrop-fade"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl modal-fade-slide">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${theme.primary}14`, color: theme.primary }}
              >
                <HeartIcon className="h-5 w-5" filled />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-semibold text-gray-900 sm:text-lg">My Wishlist</h2>
                  {savedCount > 0 && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                      style={{ backgroundColor: theme.primary }}
                    >
                      {savedCount}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 sm:text-xs">
                  {savedCount === 0 ? 'Nothing saved yet' : `${savedCount} ${savedCount === 1 ? 'piece' : 'pieces'} saved`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close wishlist"
              className="shrink-0 rounded-full p-2 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
            {savedCount === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <span
                  className="mb-5 flex h-24 w-24 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${theme.primary}0F`, color: theme.primary }}
                >
                  <HeartIcon className="h-11 w-11" />
                </span>
                <h3 className="mb-1.5 text-lg font-semibold text-gray-900">Your wishlist is empty</h3>
                <p className="mb-7 max-w-[16rem] text-sm text-gray-500">
                  Tap the heart on any piece to save it here for later.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-7 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ backgroundColor: theme.primary }}
                >
                  Continue shopping
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {wishlist.map((product) => (
                  <li
                    key={product.id}
                    className="group flex gap-4 rounded-2xl border border-gray-100 bg-white p-3 transition-all duration-300 hover:border-gray-200 hover:shadow-md"
                  >
                    <button
                      type="button"
                      onClick={() => onViewDetails(product)}
                      aria-label={`View ${product.name}`}
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
                    >
                      <SafeImage
                        images={product.images}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </button>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onViewDetails(product)}
                          className="truncate text-left text-sm font-medium text-gray-900 transition-colors hover:opacity-80"
                        >
                          {product.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(product.id)}
                          aria-label={`Remove ${product.name} from wishlist`}
                          title="Remove from wishlist"
                          className="shrink-0 rounded-lg p-1.5 text-gray-300 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>

                      {product.brand && <p className="mt-0.5 truncate text-xs text-gray-500">{product.brand}</p>}

                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {currencySymbol}
                          {Number(product.price || 0).toFixed(2)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            {currencySymbol}
                            {Number(product.originalPrice).toFixed(2)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onAddToCart(product)}
                        className="mt-auto flex w-fit items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-white transition-all duration-300 hover:scale-[1.03] hover:opacity-90"
                        style={{ backgroundColor: theme.primary }}
                      >
                        <BagIcon className="h-3.5 w-3.5" />
                        Add to Bag
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {savedCount > 0 && (
            <div className="border-t border-gray-100 bg-white px-4 py-4 sm:px-5">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-full border-2 border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-300 hover:bg-gray-50"
              >
                Continue shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
