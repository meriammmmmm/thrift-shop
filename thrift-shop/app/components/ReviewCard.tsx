'use client';

import { useState } from 'react';
import ReviewAvatar from './ReviewAvatar';
import StarRating from './StarRating';
import { useTheme } from '../../lib/theme';
import { getVisitorKey } from '../../lib/visitor';

/**
 * The review card.
 *
 * It shows the reviewer's avatar (their photo when they have one, their
 * initials when they do not), their stars, what they wrote and how many
 * people found it helpful.
 */

export interface ReviewCardData {
  id: number;
  name: string;
  title?: string;
  description: string;
  image?: string | null;
  rating?: number;
  likes?: number;
  liked_by_me?: boolean;
  created_at?: string | null;
}

interface ReviewCardProps {
  testimonial: ReviewCardData;
  /** The reviewer is called out in a slightly larger card. */
  featured?: boolean;
  /** Called when the helpful button is pressed. */
  onToggleLike?: (id: number, nextLiked: boolean) => void;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://backend-wild-skylark-9834.fly.dev/api';

/**
 * The generic title a customer review gets when the reviewer did not write
 * one. Showing it under every name just repeats the same word, so it is
 * treated as "no title".
 */
const GENERIC_TITLES = ['customer review', 'customer', 'review'];

/** The date a review was written, as a short readable line. */
function formatReviewDate(value?: string | null): string {
  if (!value) return '';

  // The API sends an ISO timestamp on Postgres and a SQLite datetime string
  // in the local database, so both are normalised here.
  const normalised = value.includes('T') ? value : value.replace(' ', 'T');
  const parsed = new Date(normalised);
  if (Number.isNaN(parsed.getTime())) return '';

  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
  });
}

export default function ReviewCard({
  testimonial,
  featured = false,
  onToggleLike,
}: ReviewCardProps) {
  const { theme } = useTheme();
  const [likes, setLikes] = useState(testimonial.likes ?? 0);
  const [liked, setLiked] = useState(testimonial.liked_by_me ?? false);
  const [busy, setBusy] = useState(false);

  const toggleLike = async () => {
    if (busy) return;

    const nextLiked = !liked;

    // The count moves straight away — the request only confirms it.
    setLiked(nextLiked);
    setLikes((current) => Math.max(0, current + (nextLiked ? 1 : -1)));
    setBusy(true);

    try {
      const response = await fetch(`${API_URL}/testimonials/${testimonial.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-visitor-key': getVisitorKey(),
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Could not register the vote');
      }

      // The server is the source of truth for the count.
      setLikes(data.likes ?? 0);
      setLiked(Boolean(data.liked));
      onToggleLike?.(testimonial.id, Boolean(data.liked));
    } catch {
      // The vote could not be saved, so the optimistic change is rolled back.
      setLiked(!nextLiked);
      setLikes((current) => Math.max(0, current + (nextLiked ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  };

  const reviewerName = testimonial.name || testimonial.title || 'Customer';

  // A customer review that was not given a real title shows the date
  // instead of the same "Customer Review" label under every name.
  const title = (testimonial.title || '').trim();
  const hasRealTitle =
    title.length > 0 &&
    !GENERIC_TITLES.includes(title.toLowerCase()) &&
    title !== reviewerName;

  const meta = hasRealTitle
    ? title
    : formatReviewDate(testimonial.created_at) || 'Verified customer';

  const rating = testimonial.rating ?? 5;

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_10px_40px_-12px_rgba(17,24,39,0.12)] transition-all duration-500 card-hover-enhanced ${
        featured ? 'p-8' : 'p-7'
      }`}
    >
      {/* A small quote mark in the corner, in the brand colour */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="absolute right-6 top-6 h-5 w-5 opacity-20"
        style={{ color: theme.primary }}
        fill="currentColor"
      >
        <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
      </svg>

      {/* Stars */}
      <div className="relative z-10 mb-4">
        <StarRating
          value={rating}
          size="md"
          label={`${reviewerName} rated this ${rating} out of 5 stars`}
        />
      </div>

      {/* What they wrote. It sits directly under the stars so a short quote
          never floats away from the stars that rate it. */}
      <div className="relative z-10">
        <p className="text-[15px] leading-relaxed text-gray-600">
          &ldquo;{testimonial.description}&rdquo;
        </p>
      </div>

      {/* Reviewer + helpful votes */}
      <div className="relative z-10 mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <ReviewAvatar
            name={reviewerName}
            image={testimonial.image}
            className="h-11 w-11 shrink-0"
            textClassName="text-sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {reviewerName}
            </p>
            <p className="truncate text-[11px] uppercase tracking-wide text-gray-400">
              {meta}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleLike}
          disabled={busy}
          aria-pressed={liked}
          aria-label={
            liked
              ? `Remove helpful vote from ${reviewerName}'s review`
              : `Mark ${reviewerName}'s review as helpful`
          }
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:opacity-60 ${
            liked
              ? 'border-transparent text-white'
              : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
          }`}
          style={liked ? { backgroundColor: theme.primary } : undefined}
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-3.5 w-3.5 transition-transform duration-300 ${
              liked ? 'scale-110' : ''
            }`}
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20.5 4.8 13.4a4.6 4.6 0 0 1 6.5-6.5l.7.7.7-.7a4.6 4.6 0 0 1 6.5 6.5L12 20.5Z" />
          </svg>
          {likes > 0 ? likes : 'Helpful'}
        </button>
      </div>
    </article>
  );
}
