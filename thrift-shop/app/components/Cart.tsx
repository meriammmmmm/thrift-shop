'use client';

import { Product, User } from '../types';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useTheme } from '../../lib/theme';
import SafeImage from './SafeImage';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Product[];
  onRemove: (productId: number) => void;
  total: number;
  onCheckout: () => void;
  user: User | null;
  currencySymbol?: string;
}

/** Modern shopping-bag glyph (rounded strokes) — the old one read as a padlock. */
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

export default function Cart({
  isOpen,
  onClose,
  cart,
  onRemove,
  total,
  onCheckout,
  user,
  currencySymbol = 'DT',
}: CartProps) {
  const router = useRouter();
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

  // The parent owns checkout: it validates the session, creates the order and
  // closes the drawer itself.
  const handleCheckout = () => {
    if (cart.length === 0) return;
    onCheckout();
  };

  // For thrift shop, each item is unique (no grouping needed)
  const cartItems = cart.map((item) => ({ ...item, quantity: 1 }));
  const itemCount = cartItems.length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Shopping bag">
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
                <BagIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-semibold text-gray-900 sm:text-lg">Shopping Bag</h2>
                  {itemCount > 0 && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                      style={{ backgroundColor: theme.primary }}
                    >
                      {itemCount}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 sm:text-xs">
                  {itemCount === 0
                    ? 'Nothing saved yet'
                    : `${itemCount} ${itemCount === 1 ? 'unique piece' : 'unique pieces'}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close shopping bag"
              className="shrink-0 rounded-full p-2 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
            {itemCount === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <span
                  className="mb-5 flex h-24 w-24 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${theme.primary}0F`, color: theme.primary }}
                >
                  <BagIcon className="h-11 w-11" />
                </span>
                <h3 className="mb-1.5 text-lg font-semibold text-gray-900">Your bag is empty</h3>
                <p className="mb-7 max-w-[16rem] text-sm text-gray-500">
                  Every piece here is one of a kind. Find something you love before it&apos;s gone.
                </p>
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full px-7 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Continue shopping
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push('/products');
                    }}
                    className="text-sm font-medium underline underline-offset-4 transition-colors duration-200 hover:opacity-80"
                    style={{ color: theme.primary }}
                  >
                    Browse new arrivals
                  </button>
                </div>
              </div>
            ) : (
              <ul className="space-y-3">
                {cartItems.map((item) => (
                  <li
                    key={item.id}
                    className="group flex gap-4 rounded-2xl border border-gray-100 bg-white p-3 transition-all duration-300 hover:border-gray-200 hover:shadow-md"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                      <SafeImage
                        images={item.images}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="truncate text-sm font-medium text-gray-900">{item.name}</h4>
                        <button
                          type="button"
                          onClick={() => onRemove(item.id)}
                          aria-label={`Remove ${item.name} from bag`}
                          title="Remove from bag"
                          className="shrink-0 rounded-lg p-1.5 text-gray-300 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {[item.brand, item.size].filter(Boolean).join(' • ')}
                      </p>
                      {item.condition && (
                        <span className="mt-1.5 w-fit rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                          {item.condition}
                        </span>
                      )}

                      <p className="mt-auto pt-2 text-sm font-semibold text-gray-900">
                        {Number(item.price || 0).toFixed(2)}{' '}
                        <span className="font-normal text-gray-500">{currencySymbol}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {itemCount > 0 && (
            <div className="border-t border-gray-100 bg-white px-4 py-4 sm:px-5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-lg font-bold text-gray-900">
                  {Number(total || 0).toFixed(2)}{' '}
                  <span className="text-sm font-medium text-gray-500">{currencySymbol}</span>
                </span>
              </div>
              <p className="mb-3 text-[11px] text-gray-400">
                One-of-a-kind pieces — once it&apos;s yours, it&apos;s gone for good.
              </p>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border-2 border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-300 hover:bg-gray-50"
                >
                  Keep shopping
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                  style={{ backgroundColor: theme.primary }}
                >
                  {user ? 'Checkout' : 'Sign in to checkout'}
                </button>
              </div>

              {!user && (
                <p className="mt-2.5 text-center text-[11px] text-gray-500">
                  You need an account to complete your purchase
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
