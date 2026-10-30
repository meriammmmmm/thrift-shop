'use client';

import { useState } from 'react';
import { useTheme } from '../../lib/theme';

/**
 * The initials avatar.
 *
 * Reviews used to fall back to a stock photo, so every customer review on
 * the page showed the same stranger's face. A review without a real photo
 * now gets an avatar built from the reviewer's initials instead.
 *
 * The colour is derived from the name, so the same person always gets the
 * same avatar — the page stays stable between renders and between visits.
 *
 * The colours come from the brand theme itself, so an avatar always sits in
 * the palette the shop is using. Change the brand colour in the admin panel
 * and the avatars follow.
 */

/**
 * How far each avatar is rotated away from the brand colour.
 *
 * The offsets are small on purpose: the avatars stay recognisably on-brand
 * while two people with similar names do not end up with the same circle.
 */
const HUE_OFFSETS = [-16, -10, -4, 0, 5, 11, 16, -22];

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;

  const value = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(value)) return { r: 115, g: 21, b: 40 };

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[r, g, b]
    .map((n) => clamp(n).toString(16).padStart(2, '0'))
    .join('')}`;
}

/** Mix towards white (positive) or black (negative). */
function shade(color: Rgb, amount: number): Rgb {
  const target = amount >= 0 ? 255 : 0;
  const ratio = Math.abs(amount);

  return {
    r: color.r + (target - color.r) * ratio,
    g: color.g + (target - color.g) * ratio,
    b: color.b + (target - color.b) * ratio,
  };
}

/** Rotate the colour around the colour wheel. */
function shiftHue(color: Rgb, degrees: number): Rgb {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) return color; // grey, nothing to rotate

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue: number;
  if (max === r) hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
  else if (max === g) hue = ((b - r) / delta + 2) / 6;
  else hue = ((r - g) / delta + 4) / 6;

  hue = (hue + degrees / 360 + 1) % 1;

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  const hueToChannel = (t: number) => {
    let value = t;
    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
    return p;
  };

  return {
    r: hueToChannel(hue + 1 / 3) * 255,
    g: hueToChannel(hue) * 255,
    b: hueToChannel(hue - 1 / 3) * 255,
  };
}

/**
 * A stable hash so the same name always maps to the same colour.
 */
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
  const { theme } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);

  // A broken photo, or one of the old placeholder stock photos, must not
  // leave an empty circle behind — both fall back to the initials avatar.
  if (!image || imageFailed || isPlaceholderImage(image)) {
    const index = hashName(name || '?') % HUE_OFFSETS.length;
    const offset = HUE_OFFSETS[index];

    // Both ends of the gradient come from the brand colour itself: a deep
    // shade of the primary and a lighter tint of the primary light. The
    // accent colour is deliberately left out — it is often a bright amber,
    // which pulls the avatar away from the brand.
    const from = shiftHue(shade(hexToRgb(theme.primary), -0.2), offset);
    const to = shiftHue(shade(hexToRgb(theme.primaryLight), 0.1), offset);

    return (
      <div
        role="img"
        aria-label={name ? `${name}'s avatar` : 'Reviewer avatar'}
        className={`flex items-center justify-center rounded-full font-semibold text-white select-none ${className}`}
        style={{
          backgroundImage: `linear-gradient(135deg, ${rgbToHex(from)} 0%, ${rgbToHex(to)} 100%)`,
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
