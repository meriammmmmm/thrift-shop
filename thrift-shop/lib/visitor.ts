/**
 * The per-browser key used to count a helpful vote once per visitor.
 *
 * It identifies the browser for the vote count only — it is never tied to an
 * account and it is not used for anything else.
 */

const STORAGE_KEY = 'meryrose:visitor-key';

/**
 * Read the visitor key, creating and storing one the first time.
 *
 * Returns an empty string when there is no window (server-side rendering) or
 * when localStorage is blocked.
 */
export function getVisitorKey(): string {
  if (typeof window === 'undefined') return '';

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;

    const generated =
      typeof window.crypto?.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

    window.localStorage.setItem(STORAGE_KEY, generated);
    return generated;
  } catch {
    // A browser that blocks localStorage still gets a working vote in this
    // session, it just cannot be remembered across reloads.
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}
