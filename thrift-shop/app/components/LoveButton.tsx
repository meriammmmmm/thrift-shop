'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '../../lib/theme';
import { getVisitorKey } from '../../lib/visitor';

/**
 * The "love" button on a piece of clothing.
 *
 * It shows how many people loved the piece and lets the visitor add their own
 * love. The count comes from the server, and the vote is per browser (the
 * `x-visitor-key` header), so pressing the heart twice takes the love back
 * and a reload cannot inflate the counter.
 *
 * The heart that sits on the picture of a product is the wishlist — that one
 * needs an account. This is the "I love this piece" counter next to the
 * price, and it works for anyone.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://backend-wild-skylark-9834.fly.dev/api';

interface LoveButtonProps {
  productId: number;
  /** How many people loved this piece. */
  likes?: number;
  /** Whether this visitor already loved it. */
  liked?: boolean;
  /** Called once the server has confirmed the new count. */
  onChange?: (productId: number, liked: boolean, likes: number) => void;
  /** Extra classes for the button. */
  className?: string;
}

export default function LoveButton({
  productId,
  likes = 0,
  liked = false,
  onChange,
  className = '',
}: LoveButtonProps) {
  const { theme } = useTheme();
  const [count, setCount] = useState(likes);
  const [isLiked, setIsLiked] = useState(liked);
  const [busy, setBusy] = useState(false);

  // The list can be replaced by a fresh fetch (a filter change, a re-sort), so
  // the button follows the numbers it is given.
  useEffect(() => {
    setCount(likes);
  }, [likes]);

  useEffect(() => {
    setIsLiked(liked);
  }, [liked]);

  const toggleLove = async () => {
    if (busy) return;

    const nextLiked = !isLiked;

    // The count moves straight away — the request only confirms it.
    setIsLiked(nextLiked);
    setCount((current) => Math.max(0, current + (nextLiked ? 1 : -1)));
    setBusy(true);

    try {
      const response = await fetch(`${API_URL}/products/${productId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-visitor-key': getVisitorKey(),
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Could not register the love');
      }

      // The server is the source of truth for the count.
      setCount(data.likes ?? 0);
      setIsLiked(Boolean(data.liked));
      onChange?.(productId, Boolean(data.liked), data.likes ?? 0);
    } catch {
      // The love could not be saved, so the optimistic change is rolled back.
      setIsLiked(!nextLiked);
      setCount((current) => Math.max(0, current + (nextLiked ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleLove}
      disabled={busy}
      aria-pressed={isLiked}
      aria-label={
        isLiked
          ? 'Remove your love from this piece'
          : 'Love this piece'
      }
      title={isLiked ? 'You loved this piece' : 'Love this piece'}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:opacity-60 ${
        isLiked
          ? 'border-transparent text-white'
          : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
      } ${className}`}
      style={isLiked ? { backgroundColor: theme.primary } : undefined}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-3.5 w-3.5 transition-transform duration-300 ${
          isLiked ? 'scale-110' : ''
        }`}
        fill={isLiked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 20.5 4.8 13.4a4.6 4.6 0 0 1 6.5-6.5l.7.7.7-.7a4.6 4.6 0 0 1 6.5 6.5L12 20.5Z" />
      </svg>
      {count > 0 ? count : 'Love'}
    </button>
  );
}
