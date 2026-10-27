import { Product } from '../app/types';
import { Slot, toSlot } from './styleMatching';

/** The four (plus dress) slots the board can hold. */
export type LookState = Partial<Record<Slot, Product>>;

export interface LookDefinition {
  id: string;
  name: string;
  /** Free-text vibe, matched against OCCASION_OPTIONS ids where possible. */
  occasion: string;
  tagline: string;

  /**
   * Photo of the complete outfit being worn by a model.
   *
   * Drop the file in `public/images/looks/` and point at it here, e.g.
   *   wornImage: '/images/looks/after-dark-black-worn.jpg'
   *
   * Until this is set, the UI composes a flat-lay collage from the individual
   * piece photos instead — so a look is never shown as a broken box.
   */
  wornImage?: string;

  /** Catalogue product ids making up this look, in wear order (top → bag). */
  productIds: number[];

  /**
   * The pieces as the API knows them.
   *
   * The storefront only loads a page of products, so a look may reference a
   * piece that is not in that page. The API sends the piece data along with
   * the look precisely so the look can still be shown in full.
   */
  items?: LookItem[];
}

/** A single piece of a look, as returned by `/api/looks/active`. */
export interface LookItem {
  product_id: number;
  name: string;
  price: number;
  original_price?: number;
  category: string;
  color: string;
  brand: string;
  size: string;
  in_stock: boolean;
  image: string | null;
}

export interface ResolvedLook {
  def: LookDefinition;
  pieces: Product[];
  slots: Slot[];
  total: number;
  fullPrice: number;
  savings: number;
}

const price = (p: Product) => Number(p.price) || 0;
const fullPriceOf = (p: Product) => Number(p.originalPrice) || price(p);

/**
 * Build the board state for a look.
 *
 * A curated look is shown exactly as the admin styled it, so nothing is
 * dropped here — a corset over a dress stays on the board. The board
 * handles the layering (a dress covers the bottom slot) at render time.
 */
export function looksToState(def: LookDefinition, products: Product[]): LookState {
  const byId = new Map(products.map((p) => [p.id, p]));
  const state: LookState = {};

  for (const id of def.productIds) {
    const product = byId.get(id);
    if (!product) continue;
    const slot = toSlot(product);
    state[slot] = product;
  }

  // Anything the storefront has not loaded still has to be on the board.
  for (const item of def.items ?? []) {
    const id = Number(item?.product_id);
    if (!Number.isInteger(id) || state[toSlot(itemToProduct(item))]) continue;
    if (byId.has(id)) continue;
    state[toSlot(itemToProduct(item))] = itemToProduct(item);
  }

  return state;
}

/** Turn an API look item into the product shape the board expects. */
function itemToProduct(item: LookItem): Product {
  return {
    id: Number(item.product_id),
    name: item.name || 'Piece',
    description: '',
    price: Number(item.price) || 0,
    originalPrice: Number(item.original_price) || undefined,
    images: item.image ? [item.image] : [],
    brand: item.brand || '',
    size: item.size || '',
    category: item.category || '',
    condition: 'Excellent',
    color: item.color || '',
    inStock: item.in_stock !== false,
    dateAdded: '',
    views: 0,
    likes: 0,
  };
}

export function resolveLooks(defs: LookDefinition[], products: Product[]): ResolvedLook[] {
  return defs.map((def) => {
    const byId = new Map(products.map((p) => [p.id, p]));

    // Prefer the catalogue copy; fall back to the piece data the API sent
    // with the look, so a look is never half-rendered.
    const pieces = def.productIds
      .map((id) => byId.get(id))
      .filter((p): p is Product => Boolean(p));

    const missing = (def.items ?? []).filter(
      (item) => !byId.has(Number(item?.product_id))
    );
    const fallback = missing.map(itemToProduct);

    const all = [...pieces, ...fallback];
    const total = all.reduce((sum, p) => sum + price(p), 0);
    const fullPrice = all.reduce((sum, p) => sum + fullPriceOf(p), 0);

    return {
      def,
      pieces: all,
      slots: all.map((p) => toSlot(p)),
      total,
      fullPrice,
      savings: Math.max(0, fullPrice - total),
    };
  });
}

export const statePieces = (state: LookState): Product[] =>
  (Object.keys(state) as Slot[])
    .map((slot) => state[slot])
    .filter((p): p is Product => Boolean(p));

export const stateTotal = (state: LookState): number =>
  statePieces(state).reduce((sum, p) => sum + price(p), 0);

export const stateFullPrice = (state: LookState): number =>
  statePieces(state).reduce((sum, p) => sum + fullPriceOf(p), 0);

/* ------------------------------------------------------------------ fetch */

interface ApiLookItem {
  product_id: number;
  name?: string;
  price?: number | string;
  original_price?: number | string;
  category?: string;
  color?: string;
  brand?: string;
  size?: string;
  in_stock?: boolean;
  image?: string | null;
}

/**
 * Pull the first usable image URL out of whatever shape the column holds.
 *
 * Product images have been stored three different ways over the years: a real
 * array, a JSON-encoded array, and — for a batch of imported rows — a
 * JSON-encoded array that was then JSON-encoded *again*. The nested forms
 * arrive as a single string, and handing that string straight to an `<img>`
 * renders a broken image, so they are unwrapped here.
 */
function firstImageUrl(value: unknown): string | null {
  let current: unknown = value;

  for (let depth = 0; depth < 3; depth++) {
    if (Array.isArray(current)) {
      const first = current.find((entry) => typeof entry === 'string' && entry.trim());
      return typeof first === 'string' ? first.trim() : null;
    }

    if (typeof current !== 'string') return null;

    const raw = current.trim();
    if (!raw) return null;

    if (raw.startsWith('[') || raw.startsWith('"')) {
      try {
        current = JSON.parse(raw);
        continue;
      } catch {
        return null;
      }
    }

    return raw;
  }

  return null;
}

/** Map an `/api/looks/active` row onto the shape the gallery renders. */
function apiLookToDefinition(raw: any, apiBaseUrl: string): LookDefinition {
  const items: ApiLookItem[] = Array.isArray(raw.items) ? raw.items : [];

  // The API returns a path for photos it stores itself; make it absolute.
  const worn = raw.worn_image as string | undefined;
  const wornImage = worn
    ? worn.startsWith('/')
      ? `${apiBaseUrl.replace(/\/$/, '')}${worn}`
      : worn
    : undefined;

  return {
    id: String(raw.id),
    name: raw.name || 'Look',
    occasion: raw.occasion || 'party',
    tagline: raw.tagline || '',
    wornImage,
    productIds: items
      .map((item) => Number(item?.product_id))
      .filter((id) => Number.isInteger(id) && id > 0),
    items: items.map((item) => ({
      product_id: Number(item?.product_id),
      name: item?.name || 'Piece',
      price: Number(item?.price) || 0,
      original_price: Number(item?.original_price) || undefined,
      category: item?.category || '',
      color: item?.color || '',
      brand: item?.brand || '',
      size: item?.size || '',
      in_stock: item?.in_stock !== false,
      image: firstImageUrl(item?.image),
    })),
  };
}

/**
 * Looks are owned by the admin panel. If the endpoint is unavailable the
 * storefront simply hides the section rather than showing stale content.
 */
export async function fetchLooks(apiBaseUrl: string, companyId: number): Promise<LookDefinition[]> {
  try {
    const res = await fetch(`${apiBaseUrl}/looks/active?companyId=${companyId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data.looks) ? data.looks : [];
    return list.map((raw: any) => apiLookToDefinition(raw, apiBaseUrl));
  } catch {
    return [];
  }
}