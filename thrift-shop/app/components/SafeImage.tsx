'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Local, always-available fallback. Never point the last resort at a remote
 * host: if the CDN is what failed, a remote fallback fails too.
 */
export const PRODUCT_PLACEHOLDER_SRC = '/images/product-placeholder.svg';

type ImageInput = string[] | string | null | undefined;

interface SafeImageProps {
  /** One or more candidate images, tried in order. */
  images?: ImageInput;
  alt: string;
  className?: string;
  /** Tried after every entry in `images`. Defaults to a remote fashion photo. */
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Product images arrive in four different shapes: a real array, a JSON-encoded
 * array (this is how the database stores them), a JSON-encoded array that was
 * JSON-encoded *again* (a batch of imported rows), or a bare URL string.
 * Normalise all of them so callers never have to.
 */
export function normalizeImageList(images: ImageInput): string[] {
  if (!images) return [];

  let value: unknown = images;

  // Unwrap nested JSON encodings (a couple of levels is plenty).
  for (let depth = 0; depth < 3; depth++) {
    if (Array.isArray(value)) {
      return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
    }

    if (typeof value !== 'string') return [];

    const raw = value.trim();
    if (!raw) return [];

    if (raw.startsWith('[') || raw.startsWith('"')) {
      try {
        value = JSON.parse(raw);
        continue;
      } catch {
        return [raw];
      }
    }

    return [raw];
  }

  return [];
}

/**
 * An <img> that degrades instead of breaking.
 *
 * Browsers draw the `alt` text of a failed image inside the image box, which in
 * a row of tightly-packed circles reads as illegible overlapping text. This
 * component walks the whole candidate list on error and, once every candidate
 * is exhausted, removes the <img> from the DOM entirely in favour of a neutral
 * block — so a broken image can never paint text over the layout.
 */
export default function SafeImage({
  images,
  alt,
  className = '',
  fallbackSrc = 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=300&h=300&fit=crop',
  loading = 'lazy',
}: SafeImageProps) {
  const sources = normalizeImageList(images);
  for (const extra of [fallbackSrc, PRODUCT_PLACEHOLDER_SRC]) {
    if (extra && !sources.includes(extra)) sources.push(extra);
  }

  // A string key, so a new array identity with the same contents does not
  // restart the chain.
  const sourceKey = sources.join('\u0001');

  const [renderedKey, setRenderedKey] = useState(sourceKey);
  const [index, setIndex] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset after render when this component starts showing a different set of
  // images. Updating state during render can cause React to restart a render
  // while the product grid is changing, which is especially fragile when
  // several SafeImage instances mount at once.
  useEffect(() => {
    if (renderedKey !== sourceKey) {
      setRenderedKey(sourceKey);
      setIndex(0);
    }
  }, [renderedKey, sourceKey]);

  const src = sources[index];

  // These images are server-rendered, so a URL that is already dead (or a
  // request that fails while offline) fires `error` *before* React attaches its
  // handler. That event is lost, the broken image paints forever, and the
  // browser draws its alt text over the layout. Re-checking on mount recovers
  // those.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) {
      setIndex((current) => current + 1);
    }
  }, [src]);

  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${className} flex items-center justify-center bg-[#f7eef0]`}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-1/3 h-1/3 max-w-10 max-h-10 opacity-40"
          fill="none"
          stroke="#8c1f3d"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6l2-1.5L7 6l4-3 4 3 2-1.5L21 6l-2 14H5L3 6Z" />
          <path d="M5 10h14" />
        </svg>
      </div>
    );
  }

  return (
    <img
      // Remount per source so a cached failure cannot stick to the new node.
      key={src}
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setIndex((current) => current + 1)}
    />
  );
}
