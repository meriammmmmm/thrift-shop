'use client';

import { useTheme } from '../../lib/theme';

interface ReviewTriggerProps {
  onOpen: () => void;
  /** Extra spacing for the root wrapper. */
  className?: string;
}

/**
 * The review call-to-action.
 *
 * It is a full-width band, not a card floating in the middle of the page:
 * the badge and copy take the left, the action takes the right, and on
 * mobile the whole thing stacks. The dialog itself lives in
 * `ReviewDialog`, so the header can open the very same form.
 */
export default function ReviewTrigger({ onOpen, className = '' }: ReviewTriggerProps) {
  const { theme } = useTheme();

  return (
    <div
      className={`flex flex-col items-center gap-10 text-center md:flex-row md:items-center md:justify-between md:gap-12 md:text-left ${className}`}
    >
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:gap-7">
        <span
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl shadow-md ring-1 ring-black/5 sm:h-24 sm:w-24"
          style={{ backgroundColor: theme.primaryLight, color: theme.primary }}
        >
          <svg
            className="h-9 w-9 sm:h-10 sm:w-10"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M11.48 3.5a.56.56 0 0 1 1.04 0l2.12 5.11 5.52.44c.5.04.71.68.32 1.03l-4.2 3.6 1.28 5.39c.12.5-.42.88-.87.62L12 16.9l-4.69 2.79c-.45.26-.99-.12-.87-.62l1.28-5.39-4.2-3.6c-.39-.35-.18-.99.32-1.03l5.52-.44 2.12-5.11Z" />
          </svg>
        </span>

        <div>
          <h3 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            Bought a piece you love?
          </h3>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg">
            Tell the community about it — every review is read by our team before it goes live.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 md:shrink-0 md:items-end">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2.5 rounded-full px-10 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          style={{ backgroundColor: theme.primary }}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M11.48 3.5a.56.56 0 0 1 1.04 0l2.12 5.11 5.52.44c.5.04.71.68.32 1.03l-4.2 3.6 1.28 5.39c.12.5-.42.88-.87.62L12 16.9l-4.69 2.79c-.45.26-.99-.12-.87-.62l1.28-5.39-4.2-3.6c-.39-.35-.18-.99.32-1.03l5.52-.44 2.12-5.11Z" />
          </svg>
          Leave a review
        </button>

        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gray-400">
          Your review could be the next one on this page
        </p>
      </div>
    </div>
  );
}
