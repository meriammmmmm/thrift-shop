'use client';

import { useState } from 'react';

/**
 * The initials avatar.
 *
 * Reviews used to fall back to a stock photo, so every customer review on
 * the page showed the same stranger's face. A review without a real photo
 * now gets an avatar built from the reviewer's initials instead.
 *
 * The colour is derived from the name, so the same person always gets the
 * same avatar — the page stays stable between renders and between visits.
 */

/**
 * The placeholder photos that used to be the default avatar.
 *
 * Every review used to point at one of these stock photos, so the storefront
 * showed a stranger's face for each customer. A review with one of them is
 * treated as having no photo at all, which makes the initials avatar appear
 * instead.
 *
 * The backend strips these too, but the storefront has to handle them on its
 * own as well: a review stored before the change still carries the old URL
 * until it is edited, and the page must never show that face.
 */
const LEGACY_PLACEHOLDER_AVATARS = [
  'photo-1472099645785-5658abf4ff4e',
  'photo-1438761681033-6461ffad8d80',
  'photo-1494790108755-2616b612b786',
];

/** True when the image is one of the old placeholder stock photos. */
export function isPlaceholderImage(image?: string | null): boolean {
  if (!image) return true;
  return LEGACY_PLACEHOLDER_AVATARS.some((id) => image.includes(id));
}

/** Curated pairs that sit well with the burgundy brand palette. */
const AVATAR_PALETTE = [
  { from: '#8C1F3D', to: '#C4657E' },
  { from: '#5B2333', to: '#A34D64' },
  { from: '#7A3B52', to: '#C98C9C' },
  { from: '#2F4858', to: '#5C7C8A' },
  { from: '#4A3B6B', to: '#8B7BA8' },
  { from: '#3E5C45', to: '#7FA88C' },
  { from: '#6B4E3D', to: '#B08D6B' },
  { from: '#5A2E4A', to: '#A66E93' },
];

/** A stable hash so the same name always maps to the same colour. */
function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * The initials to show.
 *
 * "Meriam Ben Youssef" becomes "MB", "meriam" becomes "M". A name with no
 * usable letters falls back to a neutral mark.
 */
export function getInitials(name: string): string {
  const cleaned = (name || '').trim();
  if (!cleaned) return '?';

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';

  const first = words[0][0] || '';
  const last = words.length > 1 ? words[words.length - 1][0] || '' : '';

  const initials = `${first}${last}`.toUpperCase();
  return initials || '?';
}

interface ReviewAvatarProps {
  name: string;
  /** A real photo, when the review has one. */
  image?: string | null;
  /** Tailwind size classes for the wrapper. */
  className?: string;
  /** Tailwind size classes for the initials text. */
  textClassName?: string;
}

/**
 * A circular avatar: the reviewer's photo when there is one, their initials
 * when there is not.
 */
export default function ReviewAvatar({
  name,
  image,
  className = '',
  textClassName = '',
}: ReviewAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  // A broken photo, or one of the old placeholder stock photos, must not
  // leave an empty circle behind — both fall back to the initials avatar.
  if (!image || imageFailed || isPlaceholderImage(image)) {
    const palette = AVATAR_PALETTE[hashName(name || '?') % AVATAR_PALETTE.length];

    return (
      <div
        role="img"
        aria-label={name ? `${name}'s avatar` : 'Reviewer avatar'}
        className={`flex items-center justify-center rounded-full font-semibold text-white select-none ${className}`}
        style={{
          backgroundImage: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`,
        }}
      >
        <span className={textClassName}>{getInitials(name)}</span>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={name ? `${name}'s avatar` : 'Reviewer avatar'}
      className={`rounded-full object-cover ${className}`}
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  );
}
