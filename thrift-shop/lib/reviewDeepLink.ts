'use client';

import { useEffect, useRef } from 'react';

/**
 * Opening the review form straight from a link.
 *
 * A link like `meryrose.me/?review` drops the visitor straight into the review
 * form, which is what a shared link should do — no hunting for the button.
 *
 * The parameter stays in the address bar while the form is open, so the link
 * can still be copied and sent to someone else. It is cleaned up once the form
 * is closed, so a refresh does not open it again.
 */

/**
 * The query parameters that open the form.
 *
 * `review` is the one to share. `reviw` is accepted as well, because that is
 * how the link is often typed by hand.
 */
const REVIEW_PARAMS = ['review', 'reviw'];

/** Is the parameter asking for the form to be opened? */
function asksForReview(params: URLSearchParams): boolean {
  return REVIEW_PARAMS.some((key) => {
    const value = params.get(key);
    if (value === null) return false;
    const normalized = value.trim().toLowerCase();
    return normalized !== '0' && normalized !== 'false';
  });
}

/** Remove the review parameter from the address bar. */
function cleanUrl() {
  if (typeof window === 'undefined') return;

  try {
    const url = new URL(window.location.href);
    let changed = false;

    REVIEW_PARAMS.forEach((key) => {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    });

    if (!changed) return;

    // `replaceState` keeps the back button working: the visitor does not have
    // to press it twice to leave a page they never navigated away from.
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  } catch {
    // A browser that refuses to touch the history is not a problem — the form
    // still opened.
  }
}

/**
 * Open the review form when the URL asks for it.
 *
 * @param open    whether the form is currently open
 * @param onOpen  called when the URL asks for the form
 */
export function useReviewDeepLink(open: boolean, onOpen: () => void) {
  // The parent passes a fresh arrow on every render, so the callback is kept
  // in a ref — otherwise the effect below would run on every parent render.
  const onOpenRef = useRef(onOpen);
  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  // Remembers that the form was opened by the link, so the link is only
  // cleaned up after a form the visitor actually saw.
  const openedByLink = useRef(false);

  // Remembers that the form has been open, so the cleanup below knows the
  // difference between "not open yet" and "opened and closed again".
  const hasBeenOpen = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    if (!asksForReview(params)) return;

    openedByLink.current = true;
    onOpenRef.current();
  }, []);

  useEffect(() => {
    // While the form is open the link stays in the address bar, so it can
    // still be copied.
    if (open) {
      hasBeenOpen.current = true;
      return;
    }

    if (!hasBeenOpen.current || !openedByLink.current) return;

    openedByLink.current = false;
    hasBeenOpen.current = false;
    cleanUrl();
  }, [open]);
}
