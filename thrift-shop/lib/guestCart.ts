/**
 * ============================================================
 *  THE BAG OF A VISITOR WHO HAS NOT SIGNED UP
 * ============================================================
 *
 *  The shop lets a visitor fill their bag and order without an account.
 *  Their bag cannot live on the server — there is no account to hang it
 *  on — so it is kept in the browser until they sign in.
 *
 *  When they do sign in, the bag is handed over to their account, so the
 *  pieces they had chosen are still there.
 *
 *  The prices kept here are only what the browser showed. The server
 *  prices the bag again before the order is placed, and that is the
 *  number the customer is charged.
 * ============================================================
 */

import type { Product } from '../app/types';

const STORAGE_KEY = 'meryrose:guest-cart';

export interface GuestCartItem {
  id: number;
  name: string;
  price: number;
  images: string[];
  brand: string;
  size: string;
  condition: string;
  quantity: number;
}

/** The shape the storefront's product card has. */
export interface GuestCartProduct {
  id: number;
  name: string;
  price: number | string;
  images?: string | string[] | null;
  brand?: string;
  size?: string;
  condition?: string;
}

/**
 * Read the bag.
 *
 * A bag that cannot be read (a browser with storage turned off, or one
 * holding something that is not a bag) is treated as an empty bag
 * rather than an error.
 */
export function readGuestCart(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item.id === 'number' && typeof item.price === 'number')
      .map((item) => ({
        id: item.id,
        name: String(item.name ?? ''),
        price: item.price,
        images: Array.isArray(item.images) ? item.images : [],
        brand: String(item.brand ?? ''),
        size: String(item.size ?? ''),
        condition: String(item.condition ?? ''),
        quantity: Math.max(1, Number(item.quantity) || 1),
      }));
  } catch {
    return [];
  }
}

function writeGuestCart(items: GuestCartItem[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // A browser that blocks storage still gets a working bag for this
    // visit — it just cannot be remembered.
  }
}

/** The first picture of a piece, whatever shape the pictures came in. */
function picturesOf(product: GuestCartProduct): string[] {
  if (Array.isArray(product.images)) return product.images.filter(Boolean);
  if (typeof product.images === 'string') return product.images ? [product.images] : [];
  return [];
}

/**
 * Put a piece in the bag.
 *
 * A piece that is already there is not added twice — the shop sells one
 * of each piece, so a second copy is not something that can be sent.
 */
export function addToGuestCart(product: GuestCartProduct, quantity = 1): GuestCartItem[] {
  const items = readGuestCart();

  if (items.some((item) => item.id === product.id)) return items;

  const price = typeof product.price === 'string' ? parseFloat(product.price) || 0 : product.price || 0;

  items.push({
    id: product.id,
    name: product.name,
    price,
    images: picturesOf(product),
    brand: product.brand ?? '',
    size: product.size ?? '',
    condition: product.condition ?? '',
    quantity: Math.max(1, quantity),
  });

  writeGuestCart(items);
  return items;
}

/** Take a piece out of the bag. */
export function removeFromGuestCart(productId: number): GuestCartItem[] {
  const items = readGuestCart().filter((item) => item.id !== productId);
  writeGuestCart(items);
  return items;
}

/** Empty the bag. */
export function clearGuestCart() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do — the bag was never written.
  }
}

/** What the pieces in the bag add up to. */
export function guestCartTotal(items: GuestCartItem[] = readGuestCart()): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Hand the bag over to an account.
 *
 * The bag is emptied only once the pieces are safely in the account's
 * own bag, so a failure half way through leaves the visitor's bag
 * exactly as it was.
 */
export async function mergeGuestCartIntoAccount(
  addToAccount: (productId: number, quantity: number) => Promise<unknown>,
): Promise<{ merged: number; failed: number }> {
  const items = readGuestCart();
  if (!items.length) return { merged: 0, failed: 0 };

  const mergedIds = new Set<number>();
  let failed = 0;

  for (const item of items) {
    try {
      await addToAccount(item.id, item.quantity);
      mergedIds.add(item.id);
    } catch {
      failed += 1;
    }
  }

  // The pieces that made it into the account are dropped from the
  // visitor's bag; the ones that did not stay, so nothing is lost.
  writeGuestCart(items.filter((item) => !mergedIds.has(item.id)));

  return { merged: mergedIds.size, failed };
}

/**
 * The guest bag as the storefront's product list.
 *
 * The bag panel takes products; a guest bag holds a snapshot of the
 * pieces, which is enough to show what was chosen.
 */
export function guestCartAsProducts(items: GuestCartItem[] = readGuestCart()): Product[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: '',
    price: item.price,
    images: item.images,
    brand: item.brand,
    size: item.size,
    category: '',
    condition: (item.condition || 'Excellent') as Product['condition'],
    color: '',
    inStock: true,
    dateAdded: '',
    views: 0,
    likes: 0,
  }));
}
