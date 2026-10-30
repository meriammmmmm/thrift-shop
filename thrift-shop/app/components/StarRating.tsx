'use client';

import { useState } from 'react';

/**
 * Star ratings.
 *
 * The same component draws the stars on a review card (read-only) and the
 * picker in the review form (interactive), so the two never drift apart.
 */

const STAR_PATH =
  'M12 2.6l2.9 5.88 6.49.95-4.7 4.58 1.11 6.46L12 17.42l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.95L12 2.6z';

interface StarRatingProps {
  /** The score to show, 1-5. */
  value: number;
  size?: 'sm' | 'md' | 'lg';
  /** Shows the numeric score next to the stars. */
  showValue?: boolean;
  /** Accessible label for the group of stars. */
  label?: string;
}

const SIZES = {
  sm: { box: 'h-3.5 w-3.5', gap: 'gap-0.5', text: 'text-[11px]' },
  md: { box: 'h-4 w-4', gap: 'gap-1', text: 'text-xs' },
  lg: { box: 'h-6 w-6', gap: 'gap-1', text: 'text-sm' },
} as const;

/** Read-only stars, used on the review cards. */
export default function StarRating({
  value,
  size = 'sm',
  showValue = false,
  label,
}: StarRatingProps) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  const dims = SIZES[size];

  return (
    <span
      className={`inline-flex items-center ${dims.gap}`}
      role="img"
      aria-label={label || `Rated ${rounded} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 24 24"
          className={`${dims.box} ${
            star <= rounded ? 'text-amber-400' : 'text-gray-200'
          }`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
      {showValue && (
        <span className={`${dims.text} font-medium text-gray-600 ml-1.5`}>
          {rounded}.0
        </span>
      )}
    </span>
  );
}

interface StarPickerProps {
  value: number;
  onChange: (value: number) => void;
  /** Label shown above the stars. */
  label: string;
  /** Small helper text under the stars. */
  hint?: string;
}

/**
 * The interactive star picker used in the review form.
 *
 * Hovering previews the score that would be picked, and the stars can be
 * reached with the keyboard: each star is a button, and the arrow keys move
 * between them.
 */
export function StarPicker({ value, onChange, label, hint }: StarPickerProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered ?? value;

  const labels = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="block text-xs font-medium text-gray-700">{label}</span>
        {active > 0 && (
          <span className="text-[11px] font-semibold text-gray-500">
            {labels[active - 1]}
          </span>
        )}
      </div>

      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label={label}
        onMouseLeave={() => setHovered(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''} — ${labels[star - 1]}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onFocus={() => setHovered(star)}
            onBlur={() => setHovered(null)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                event.preventDefault();
                const next = Math.min(5, value + 1);
                onChange(next);
                setHovered(next);
              } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                event.preventDefault();
                const next = Math.max(1, value - 1);
                onChange(next);
                setHovered(next);
              }
            }}
            className="rounded p-0.5 transition-transform duration-150 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-7 w-7 transition-colors duration-150 ${
                star <= active ? 'text-amber-400' : 'text-gray-200'
              }`}
              fill="currentColor"
              aria-hidden="true"
            >
              <path d={STAR_PATH} />
            </svg>
          </button>
        ))}
      </div>

      {hint && <p className="mt-1.5 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}
