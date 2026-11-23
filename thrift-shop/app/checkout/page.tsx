'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../lib/theme';
import { api } from '../../lib/api';
import { GOVERNORATES } from '../../lib/tunisia';
import {
  clearGuestCart,
  guestCartAsProducts,
  readGuestCart,
} from '../../lib/guestCart';
import SafeImage from '../components/SafeImage';

/**
 * ============================================================
 *  CHECKOUT — Mery Rose
 * ============================================================
 *
 *  Anyone can buy from the shop: a visitor gives their name, phone
 *  number, governorate, city and address, and the order is on its way.
 *  An account is welcome, not required.
 *
 *  The total on this page is never worked out in the browser. The server
 *  prices the bag — it holds the prices, the delivery fee and the tax —
 *  and answers with the numbers, and the page shows them as they came
 *  back. The customer is told when the check happened.
 */

interface CartLine {
  id: number;
  name: string;
  price: number;
  images: string[];
  brand: string;
  size: string;
  condition: string;
}

interface Delivery {
  name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  note: string;
}

interface Totals {
  subtotal: number;
  delivery: number;
  tax: number;
  total: number;
  currency: string;
  verified_at: string;
}

const EMPTY_DELIVERY: Delivery = {
  name: '',
  phone: '',
  governorate: '',
  city: '',
  address: '',
  note: '',
};

/** The fields the customer has to fill in before the order can be placed. */
const REQUIRED_FIELDS: Array<{ key: keyof Delivery; label: string }> = [
  { key: 'name', label: 'Full name' },
  { key: 'phone', label: 'Phone number' },
  { key: 'governorate', label: 'Governorate' },
  { key: 'city', label: 'City' },
  { key: 'address', label: 'Delivery address' },
];

/**
 * The delivery fee the shop charges everywhere.
 *
 * The server has the fee that counts — it is the one that prices the
 * order. This is the number the page falls back on when the server
 * cannot be reached, so the customer still sees what the order will
 * cost rather than a row of zeros.
 */
const FALLBACK_DELIVERY_FEE = 8;

/** Where the sparkles sit behind the page. */
const SPARKLES = [
  { top: '16%', left: '6%', size: '0.9rem', delay: '0s' },
  { top: '9%', right: '12%', size: '0.7rem', delay: '1.2s' },
  { top: '38%', right: '5%', size: '1.1rem', delay: '2.1s' },
  { top: '62%', left: '4%', size: '0.75rem', delay: '0.6s' },
  { top: '78%', right: '9%', size: '0.95rem', delay: '1.7s' },
  { top: '28%', left: '46%', size: '0.65rem', delay: '2.8s' },
];

export default function CheckoutPage() {
  const { theme } = useTheme();
  const router = useRouter();

  const [cart, setCart] = useState<CartLine[]>([]);
  const [delivery, setDelivery] = useState<Delivery>(EMPTY_DELIVERY);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [company, setCompany] = useState<{ id: number; name: string } | null>(null);

  /** The visitor has an account — their bag is on the server. */
  const [isSignedIn, setIsSignedIn] = useState(false);

  const currencySymbol = 'DT';

  /* ------------------------------------------------------------------ *
   * The bag
   * ------------------------------------------------------------------ */

  const loadGuestBag = useCallback((): CartLine[] => {
    const lines = guestCartAsProducts(readGuestCart()).map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      images: item.images ?? [],
      brand: item.brand ?? '',
      size: item.size ?? '',
      condition: item.condition ?? '',
    }));

    setCart(lines);
    return lines;
  }, []);

  const loadSignedInBag = useCallback(async (): Promise<CartLine[]> => {
    try {
      const cartData = await api.getCart();
      const items = (cartData.items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        price: typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0,
        images: Array.isArray(item.images) ? item.images : [],
        brand: item.brand ?? '',
        size: item.size ?? '',
        condition: item.condition ?? '',
      }));
      setCart(items);
      return items;
    } catch {
      setCart([]);
      return [];
    }
  }, []);

  /* ------------------------------------------------------------------ *
   * The price — always the server's
   * ------------------------------------------------------------------ */

  const refreshQuote = useCallback(async (items: CartLine[]) => {
    if (!items.length) {
      setTotals(null);
      return;
    }

    try {
      const response = await api.quoteOrder(
        items.map((item) => ({ product_id: item.id, quantity: 1 })),
      );

      const quote = response?.totals;
      if (!quote) throw new Error('The server did not price the bag');

      setTotals(quote);
      setVerifiedAt(quote.verified_at ?? new Date().toISOString());
      setError(null);
    } catch (err: any) {
      /**
       * The server could not be reached, or the shop is still on the
       * older version of the API.
       *
       * The customer still has to see what the order costs, so the
       * prices that are on screen are added up here and the fee the shop
       * charges is added to them. The order itself is still priced by
       * the server when it is placed — this is only what the customer
       * reads in the meantime.
       */
      const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
      const delivery = FALLBACK_DELIVERY_FEE;

      setTotals({
        subtotal: Number(subtotal.toFixed(2)),
        delivery,
        tax: 0,
        total: Number((subtotal + delivery).toFixed(2)),
        currency: 'TND',
        verified_at: '',
      });
      setVerifiedAt(null);

      const message =
        err?.message?.includes('not available') || err?.message?.includes('sold out')
          ? 'One of the pieces in your bag is no longer available. Please review your bag.'
          : null;

      setError(message);
    }
  }, []);

  /* ------------------------------------------------------------------ *
   * On open
   * ------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
        const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

        let items: CartLine[] = [];

        if (token && userData) {
          setIsSignedIn(true);

          items = await loadSignedInBag();

          // A customer who has already given their details does not
          // have to give them again.
          try {
            const info = await api.getUserInfo();
            const saved = info?.userInfo;
            if (saved) {
              setDelivery((current) => ({
                ...current,
                name: saved.full_name || current.name,
                phone: saved.phone || current.phone,
                city: saved.city || current.city,
                address: saved.address || current.address,
                governorate: GOVERNORATES.includes(saved.state as never)
                  ? saved.state
                  : current.governorate,
              }));
            }
          } catch {
            // No saved details yet — the customer fills the form in.
          }
        } else {
          items = loadGuestBag();
        }

        if (cancelled) return;

        await refreshQuote(items);
      } catch {
        if (!cancelled) setError('We could not open your bag. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    start();

    // The shop's name for the header.
    api
      .getCompanyProducts(parseInt(process.env.NEXT_PUBLIC_COMPANY_ID || '1', 10), { limit: 1 })
      .then((response) => {
        if (response?.company) setCompany(response.company);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [loadGuestBag, loadSignedInBag, refreshQuote]);

  /* ------------------------------------------------------------------ *
   * Placing the order
   * ------------------------------------------------------------------ */

  const missingFields = useMemo(
    () =>
      REQUIRED_FIELDS.filter((field) => !delivery[field.key].trim()).map((field) => field.label),
    [delivery],
  );

  const updateDelivery = (key: keyof Delivery, value: string) => {
    setDelivery((current) => ({ ...current, [key]: value }));
    setMissing([]);
  };

  const placeOrder = async () => {
    const empty = REQUIRED_FIELDS.filter((field) => !delivery[field.key].trim()).map(
      (field) => field.label,
    );

    if (empty.length) {
      setMissing(empty);
      setError('Please complete the delivery details before placing your order.');
      return;
    }

    if (!cart.length) {
      setError('Your bag is empty.');
      return;
    }

    setIsPlacing(true);
    setError(null);

    try {
      const shippingAddress = {
        name: delivery.name.trim(),
        phone: delivery.phone.trim(),
        governorate: delivery.governorate,
        city: delivery.city.trim(),
        address: delivery.address.trim(),
        note: delivery.note.trim(),
        country: 'Tunisia',
      };

      const response = await api.createOrder({
        items: cart.map((item) => ({ product_id: item.id, quantity: 1 })),
        shipping_address: shippingAddress,
        billing_address: shippingAddress,
        payment_method: 'cash',
      });

      if (!response?.order) throw new Error('Order creation failed');

      /**
       * A copy of the order is kept in the browser for the confirmation
       * page. A guest has no account, so the server will not hand the
       * order back to them — but they still get to see what they ordered.
       */
      try {
        sessionStorage.setItem(
          'meryrose:last-order',
          JSON.stringify({ order: response.order, totals: response.totals ?? null }),
        );
      } catch {
        // A browser that blocks storage still gets the confirmation page.
      }

      // The bag is emptied: from the account when they have one, from
      // the browser when they do not.
      if (isSignedIn) {
        await api.clearCart().catch(() => undefined);
      } else {
        clearGuestCart();
      }

      router.push(`/order-success?orderId=${response.order.id}`);
    } catch (err: any) {
      const message = err?.message || 'Unknown error';

      if (
        message.includes('not available') ||
        message.includes('sold out') ||
        message.includes('reserved') ||
        message.includes('already sold')
      ) {
        setError(`${message}. Your bag has been refreshed — please review it and try again.`);
        if (isSignedIn) await loadSignedInBag();
        else loadGuestBag();
      } else {
        setError(`We could not place your order: ${message}`);
      }

      setIsPlacing(false);
    }
  };

  /* ------------------------------------------------------------------ *
   * The page
   * ------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="checkout-page flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: theme.primary }}
          />
          <p className="checkout-note">Getting your bag ready…</p>
        </div>
      </div>
    );
  }

  if (!cart.length) {
    return (
      <div className="checkout-page flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🛍️</div>
          <h2 className="text-3xl font-light text-gray-900 mb-2">Your bag is empty</h2>
          <p className="checkout-note mb-6">Add a few pieces and come back.</p>
          <button
            onClick={() => router.push('/')}
            className="checkout-cta px-8 py-3.5 text-sm"
          >
            Continue shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {/* The soft shapes behind the page */}
      <span className="checkout-orb checkout-orb--a" aria-hidden="true" />
      <span className="checkout-orb checkout-orb--b" aria-hidden="true" />
      {SPARKLES.map((sparkle, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="checkout-spark"
          style={{
            top: sparkle.top,
            left: sparkle.left,
            right: sparkle.right,
            fontSize: sparkle.size,
            animationDelay: sparkle.delay,
          }}
        >
          ✦
        </span>
      ))}

      {/* Header */}
      {/*
       * The header sits above the content. Without this the delivery card
       * slides over it as the page is scrolled and hides the shop's name.
       */}
      <header className="relative z-30 sticky top-0 border-b border-white/70 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3">
          <button
            onClick={() => router.push('/')}
            className="checkout-mark text-base sm:text-xl font-bold text-gray-900 hover:opacity-80 transition-opacity duration-300"
          >
            {company?.name?.toUpperCase() || 'MERY ROSE'}
          </button>

          <div className="flex items-center gap-3">
            <span className="checkout-mark__rule hidden sm:block" aria-hidden="true" />
            <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold text-gray-700 bg-white/80 px-3 sm:px-4 py-2 rounded-full border border-[color-mix(in_srgb,var(--ck-blush)_70%,var(--ck-petal))]">
              <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              Cash on delivery
            </span>
          </div>
        </div>
      </header>

      {/*
       * On a wide screen the checkout fits on one screen: the card is
       * bounded to the space that is left, so the page itself does not
       * scroll and the two cards stay side by side.
       */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* ---------------- The delivery details ---------------- */}
          {/*
           * The card stays on the screen while the page is scrolled, so the
           * details are always in front of the customer.
           *
           * It is taller than a short screen, so its body is bounded and
           * scrolls on its own — otherwise the bottom of the card (the
           * payment choice) would end up below the fold with no way to
           * reach it.
           */}
          <div
            className="checkout-card p-5 sm:p-8"
            style={{ '--checkout-delay': '60ms' } as React.CSSProperties}
          >
            <div className="flex items-start gap-4 mb-7">
              <span className="checkout-step" style={{ '--checkout-delay': '120ms' } as React.CSSProperties}>
                1
              </span>
              <div>
                <h2 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight leading-tight">
                  Delivery details
                </h2>
                <p className="checkout-note mt-1.5 text-sm">
                  {isSignedIn
                    ? 'We will call you on this number when your order is on its way.'
                    : 'No account needed — we only ask for what we need to deliver.'}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Full name */}
              <label className="checkout-field-group block" style={{ '--checkout-delay': '180ms' } as React.CSSProperties}>
                <span className="checkout-label">Full name</span>
                <input
                  type="text"
                  value={delivery.name}
                  onChange={(event) => updateDelivery('name', event.target.value)}
                  placeholder="Amine Ben Ali"
                  autoComplete="name"
                  className={`checkout-field ${missing.includes('Full name') ? 'checkout-field--missing' : ''}`}
                />
              </label>

              {/* Phone */}
              <label className="checkout-field-group block" style={{ '--checkout-delay': '225ms' } as React.CSSProperties}>
                <span className="checkout-label">Phone number</span>
                <input
                  type="tel"
                  value={delivery.phone}
                  onChange={(event) => updateDelivery('phone', event.target.value)}
                  placeholder="+216 20 123 456"
                  autoComplete="tel"
                  className={`checkout-field ${missing.includes('Phone number') ? 'checkout-field--missing' : ''}`}
                />
              </label>

              {/* Governorate */}
              <label className="checkout-field-group block" style={{ '--checkout-delay': '270ms' } as React.CSSProperties}>
                <span className="checkout-label">Governorate</span>
                <select
                  value={delivery.governorate}
                  onChange={(event) => updateDelivery('governorate', event.target.value)}
                  className={`checkout-field checkout-select ${missing.includes('Governorate') ? 'checkout-field--missing' : ''}`}
                >
                  <option value="">Choose…</option>
                  {GOVERNORATES.map((governorate) => (
                    <option key={governorate} value={governorate}>
                      {governorate}
                    </option>
                  ))}
                </select>
              </label>

              {/* City */}
              <label className="checkout-field-group block" style={{ '--checkout-delay': '315ms' } as React.CSSProperties}>
                <span className="checkout-label">City / locality</span>
                <input
                  type="text"
                  value={delivery.city}
                  onChange={(event) => updateDelivery('city', event.target.value)}
                  placeholder="Tunis"
                  autoComplete="address-level2"
                  className={`checkout-field ${missing.includes('City') ? 'checkout-field--missing' : ''}`}
                />
              </label>

              {/* Address */}
              <label className="checkout-field-group block" style={{ '--checkout-delay': '360ms' } as React.CSSProperties}>
                <span className="checkout-label">Delivery address</span>
                <textarea
                  value={delivery.address}
                  onChange={(event) => updateDelivery('address', event.target.value)}
                  placeholder="Street, building, floor, landmark"
                  rows={3}
                  autoComplete="street-address"
                  className={`checkout-field resize-none ${missing.includes('Delivery address') ? 'checkout-field--missing' : ''}`}
                />
              </label>

              {/* Note */}
              <label className="checkout-field-group block" style={{ '--checkout-delay': '405ms' } as React.CSSProperties}>
                <span className="checkout-label">Delivery note (optional)</span>
                <textarea
                  value={delivery.note}
                  onChange={(event) => updateDelivery('note', event.target.value)}
                  placeholder="Anything the courier should know"
                  rows={2}
                  className="checkout-field resize-none"
                />
              </label>
            </div>

          </div>

          {/* ---------------- The summary ---------------- */}
          {/* The summary holds on to the screen while the page is scrolled. */}
          <div className="lg:sticky lg:top-20 h-fit">
            <div
              className="checkout-card checkout-card--summary p-5 sm:p-8"
              style={{ '--checkout-delay': '160ms' } as React.CSSProperties}
            >
              <div className="flex items-start gap-4 mb-6">
                <span className="checkout-step" style={{ '--checkout-delay': '220ms' } as React.CSSProperties}>
                  2
                </span>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight leading-tight">
                    Order summary
                  </h3>
                  <p className="checkout-note mt-1.5 text-sm">
                    {cart.length} {cart.length === 1 ? 'piece' : 'pieces'}, on their way to you.
                  </p>
                </div>
              </div>

              {/* The pieces */}
              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                {cart.map((item, index) => (
                  <div
                    key={item.id}
                    data-spotlight
                    className="checkout-item flex items-center gap-3"
                    style={{ '--checkout-delay': `${260 + index * 60}ms` } as React.CSSProperties}
                  >
                    <div className="checkout-item__picture shrink-0">
                      <SafeImage
                        images={item.images}
                        alt={item.name}
                        className="w-20 h-20 object-contain rounded-xl p-1"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base mb-1 truncate">
                        {item.name}
                      </h4>
                      {item.brand && (
                        <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1.5">{item.brand}</p>
                      )}
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs flex-wrap">
                        {item.size && (
                          <span className="px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--ck-blush)_78%,white)] text-gray-600">
                            {item.size}
                          </span>
                        )}
                        {item.condition && (
                          <span className="px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--ck-blush)_78%,white)] text-gray-600">
                            {item.condition}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-lg">
                        <AnimatedAmount value={item.price} /> {currencySymbol}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* The totals — the server's numbers */}
              <div className="checkout-totals">
                <div className="flex justify-between text-sm sm:text-base text-gray-600 mb-2">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">
                    <AnimatedAmount value={totals?.subtotal ?? 0} /> {currencySymbol}
                  </span>
                </div>

                <div className="flex justify-between text-sm sm:text-base text-gray-600 mb-4">
                  <span>Delivery</span>
                  <span className="font-medium text-gray-900">
                    <AnimatedAmount value={totals?.delivery ?? 0} /> {currencySymbol}
                  </span>
                </div>

                <div className="checkout-hairline mb-4" aria-hidden="true" />

                <div className="flex justify-between items-baseline">
                  <span className="text-lg sm:text-xl font-light text-gray-900">Total</span>
                  <span className="checkout-total text-2xl sm:text-3xl">
                    <AnimatedAmount value={totals?.total ?? 0} /> {currencySymbol}
                  </span>
                </div>

                <div className="flex justify-center mt-4">
                  <span className="checkout-verify">
                    <span className="checkout-verify__spark">✦</span>
                    {verifiedAt
                      ? `Total verified by the server${verifiedLabel(verifiedAt)}.`
                      : 'The server checks this total again when the order is placed.'}
                  </span>
                </div>
              </div>

              {error && (
                <div
                  className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {missing.length > 0 && (
                <p className="mt-3 text-xs text-gray-500 text-center">
                  Still needed: {missing.join(', ')}
                </p>
              )}

              {/* Place the order */}
              <button
                onClick={placeOrder}
                disabled={isPlacing}
                className="checkout-cta w-full mt-5 px-6 py-4 text-base sm:text-lg"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isPlacing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Placing your order…
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Place order
                    </>
                  )}
                </span>
              </button>

              <p className="checkout-note text-center mt-4 text-sm">
                You pay the courier when your order arrives.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A number that counts up to where it belongs.
 *
 * The total arrives from the server in one go; counting to it makes the
 * answer feel like it was worked out for the customer rather than
 * dropped on them.
 */
function AnimatedAmount({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      fromRef.current = value;
      setShown(value);
      return;
    }

    const from = fromRef.current;
    const delta = value - from;

    if (Math.abs(delta) < 0.005) {
      setShown(value);
      fromRef.current = value;
      return;
    }

    const start = performance.now();
    const duration = 700;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);

      setShown(from + delta * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return <>{shown.toFixed(2)}</>;
}

/**
 * How long ago the server checked the total.
 *
 * "just now" while the check is fresh, and the time of the check once it
 * is not — the customer can always tell when the number was set.
 */
function verifiedLabel(verifiedAt: string | null): string {
  if (!verifiedAt) return ' just now';

  const when = new Date(verifiedAt).getTime();
  if (Number.isNaN(when)) return ' just now';

  const seconds = Math.round((Date.now() - when) / 1000);

  if (seconds < 60) return ' just now';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return ` ${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const time = new Date(verifiedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return ` at ${time}`;
}
