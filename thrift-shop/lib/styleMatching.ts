// Styling logic for the "Build the Look" board.
//
// The catalogue is inconsistent: categories arrive as "Corsets & Bustiers",
// "Bustier Tops" and "Tops / Bustiers & Corsets" for the same kind of garment,
// and colours arrive as "Off-white" and "Off-White" in different rows. Matching
// therefore happens against a normalised slot + colour family, not the raw text.

import { Product } from '../app/types';

export type Slot = 'top' | 'bottom' | 'dress' | 'outer' | 'shoes' | 'bag' | 'accessory';

export type ColorFamily =
  | 'black' | 'white' | 'red' | 'pink' | 'blue'
  | 'green' | 'brown' | 'yellow' | 'orange' | 'purple'
  | 'metallic' | 'multicolor' | 'unknown';

/** Slots the board lays out, in the order they get worn. */
export const BOARD_SLOTS: { slot: Slot; label: string }[] = [
  { slot: 'top', label: 'Top' },
  { slot: 'bottom', label: 'Bottom' },
  { slot: 'shoes', label: 'Shoes' },
  { slot: 'bag', label: 'Bag' },
];

const SLOT_LABEL: Record<Slot, string> = {
  top: 'Top',
  bottom: 'Bottom',
  dress: 'Dress',
  outer: 'Outerwear',
  shoes: 'Shoes',
  bag: 'Bag',
  accessory: 'Accessory',
};

export const slotLabel = (slot: Slot) => SLOT_LABEL[slot];

/* ------------------------------------------------------------------ slots */

const SLOT_RULES: { slot: Slot; patterns: RegExp }[] = [
  // A two-piece set dresses the whole body, so it shares the dress slot and
  // covers top + bottom on the board.
  { slot: 'dress', patterns: /\b(dress|gown|cheongsam|playsuit|jumpsuit|costume|cheerleading|one-piece|set)\b/ },
  { slot: 'shoes', patterns: /\b(shoe|boot|heel|pump|sandal|loafer|platform|kitten|mule|block heel)\b/ },
  { slot: 'bag', patterns: /\b(bag|handbag|purse|tote|clutch|backpack|crossbody|shoulder bag)\b/ },
  { slot: 'outer', patterns: /\b(coat|jacket|blazer|cardigan|overshirt|parka|cape|trench|tuxedo)\b/ },
  { slot: 'accessory', patterns: /\b(belt|jewell|necklace|bracelet|ring|scarf|hat|glove|sunglass|goggles|hairband|accessor)/ },
  { slot: 'bottom', patterns: /\b(skirt|short|trouser|pant|jeans|legging|hipster|culotte)\b/ },
  { slot: 'top', patterns: /\b(top|crop|bustier|corset|halter|cami|tank|blouse|shirt|bra|bikini|swimwear top|bust)\b/ },
];

export function toSlot(product: Pick<Product, 'category' | 'name'>): Slot {
  const text = `${product.category || ''} ${product.name || ''}`.toLowerCase();
  for (const rule of SLOT_RULES) {
    if (rule.patterns.test(text)) return rule.slot;
  }
  return 'accessory';
}

/** A "two piece" garment fills both a top and a bottom slot. */
export function isSet(product: Pick<Product, 'category' | 'name'>): boolean {
  return /two-piece|2-piece|set\b|coord/i.test(`${product.category || ''} ${product.name || ''}`);
}

/* ----------------------------------------------------------------- colours */

const COLOR_RULES: { family: ColorFamily; patterns: RegExp }[] = [
  { family: 'metallic', patterns: /\b(silver|gold|metallic|glitter|holographic|chrome|sequin)\b/ },
  { family: 'black', patterns: /\b(black|dark|charcoal|jet|onyx)\b/ },
  { family: 'white', patterns: /\b(white|cream|ivory|off-white|offwhite|ecru|bone|pearl)\b/ },
  { family: 'red', patterns: /\b(red|burgundy|scarlet|crimson|wine|maroon)\b/ },
  { family: 'pink', patterns: /\b(pink|fuchsia|magenta|rose|blush|mauve|lilac)\b/ },
  { family: 'blue', patterns: /\b(blue|navy|denim|cobalt|azure|indigo|sky)\b/ },
  { family: 'green', patterns: /\b(green|olive|sage|emerald|khaki|lime|mint)\b/ },
  { family: 'brown', patterns: /\b(brown|camel|tan|beige|chocolate|taupe|mocha|caramel|coffee)\b/ },
  { family: 'yellow', patterns: /\b(yellow|mustard|gold-ish|lemon)\b/ },
  { family: 'orange', patterns: /\b(orange|terracotta|rust|coral|peach)\b/ },
  { family: 'purple', patterns: /\b(purple|violet|lavender|plum|aubergine)\b/ },
];

const MULTICOLOR = /\b(multi|patchwork|floral|print|patterned|leopard|strip|tie-dye|tie dye|colourblock|colorblock)\b/;

/**
 * A garment can carry more than one colour ("Red and Black"), so matching works
 * against the full set and takes the best pairing.
 */
export function toColorFamilies(product: Pick<Product, 'color' | 'name'>): ColorFamily[] {
  const raw = `${product.color || ''} ${product.name || ''}`.toLowerCase();

  const found = COLOR_RULES
    .filter((rule) => rule.patterns.test(raw))
    .map((rule) => rule.family)
    .filter((family, i, all) => all.indexOf(family) === i);

  if (MULTICOLOR.test(raw) && found.length < 3) return ['multicolor'];
  if (found.length === 0) return ['unknown'];
  return found;
}

export function toColorFamily(product: Pick<Product, 'color' | 'name'>): ColorFamily {
  return toColorFamilies(product)[0];
}

const NEUTRALS: ColorFamily[] = ['black', 'white', 'brown', 'metallic'];

export const isNeutral = (family: ColorFamily) => NEUTRALS.includes(family);

/** Order around the colour wheel, used for "near" vs "far" reasoning. */
const WHEEL: ColorFamily[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];

const COMPLEMENTS: [ColorFamily, ColorFamily][] = [
  ['red', 'green'],
  ['orange', 'blue'],
  ['yellow', 'purple'],
  ['pink', 'green'],
];

const wheelDistance = (a: ColorFamily, b: ColorFamily) => {
  const ai = WHEEL.indexOf(a);
  const bi = WHEEL.indexOf(b);
  if (ai === -1 || bi === -1) return 99;
  const raw = Math.abs(ai - bi);
  return Math.min(raw, WHEEL.length - raw);
};

const label = (family: ColorFamily) =>
  ({
    black: 'black', white: 'creams and whites', red: 'red', pink: 'pink',
    blue: 'blue', green: 'green', brown: 'browns', yellow: 'yellow',
    orange: 'orange', purple: 'purple', metallic: 'metallics',
    multicolor: 'prints', unknown: 'tonal',
  })[family];

/* ---------------------------------------------------------------- scoring */

export interface PairScore {
  score: number;
  reason: string;
}

/** Colour harmony between two garments. */
export function scorePairHarmony(a: ColorFamily, b: ColorFamily): PairScore {
  if (a === b && a !== 'unknown') {
    return { score: 94, reason: `Tonal ${label(a)} — one colour story` };
  }
  if (a === 'unknown' || b === 'unknown') {
    return { score: 58, reason: 'Easy to style either way' };
  }
  if (a === 'multicolor' || b === 'multicolor') {
    const other = a === 'multicolor' ? b : a;
    return isNeutral(other)
      ? { score: 84, reason: `A print over ${label(other)} — the print stays the hero` }
      : { score: 52, reason: 'Two loud pieces — keep everything else quiet' };
  }
  if (isNeutral(a) && isNeutral(b)) {
    return { score: 80, reason: 'Neutrals always play nicely together' };
  }
  if (isNeutral(a) || isNeutral(b)) {
    const accent = isNeutral(a) ? b : a;
    return { score: 86, reason: `Neutral base with a pop of ${label(accent)}` };
  }

  const complementary = COMPLEMENTS.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a)
  );
  if (complementary) {
    return { score: 90, reason: `Classic contrast — ${label(a)} and ${label(b)}` };
  }

  const distance = wheelDistance(a, b);
  if (distance <= 1) {
    return { score: 76, reason: `${label(a)} on ${label(b)} — soft and tonal` };
  }
  return { score: 58, reason: `${label(a)} with ${label(b)} — a bold mix` };
}

const priceOf = (p: Product) => Number(p.price) || 0;

/** Overall 0–100 compatibility for two garments worn together. */
export function scorePair(a: Product, b: Product): PairScore {
  const slotA = toSlot(a);
  const slotB = toSlot(b);

  const harmony = scorePairHarmony(toColorFamily(a), toColorFamily(b));

  let score = harmony.score;
  let reason = harmony.reason;

  if (slotA === slotB) {
    score -= 6;
    reason += ' · same slot, so swap rather than layer';
  }

  if (a.inStock && b.inStock) {
    score += 4;
  }

  const pa = priceOf(a);
  const pb = priceOf(b);
  if (pa > 0 && pb > 0) {
    const ratio = Math.max(pa, pb) / Math.min(pa, pb);
    if (ratio <= 2) {
      score += 5;
    } else if (ratio >= 4) {
      score -= 5;
      reason += ' · saved together, one piece carries the look';
    }
  }

  return { score: Math.max(10, Math.min(99, Math.round(score))), reason };
}

export interface Suggestion {
  product: Product;
  slot: Slot;
  score: number;
  reason: string;
}

const hasImage = (p: Product) => Array.isArray(p.images) && p.images.length > 0;

/**
 * Rank catalogue pieces against what has been picked so far. With nothing
 * picked yet we fall back to a deterministic rotation so the rail still has
 * content on first paint.
 */
export function rankSuggestions(
  pool: Product[],
  picks: Product[],
  limit = 12,
  seed = 0
): Suggestion[] {
  const candidates = pool.filter((p) => hasImage(p) && !picks.some((picked) => picked.id === p.id));

  const scored = candidates.map((product) => {
    const slot = toSlot(product);
    const partner = picks.find((p) => toSlot(p) !== slot);

    if (!partner) {
      // Nothing chosen yet — spread the rail across slots and favour new stock.
      return {
        product,
        slot,
        score: 62 + ((product.id + seed * 7) % 18),
        reason: 'A fresh piece to start your look',
      };
    }

    const best = picks.reduce(
      (acc, picked) => {
        const s = scorePair(picked, product);
        return s.score > acc.score ? s : acc;
      },
      { score: 0, reason: '' }
    );

    return { product, slot, score: best.score, reason: best.reason };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Greedily fill the board with the highest-scoring combination available. */
export function buildFullLook(pool: Product[], seed = 0): Partial<Record<Slot, Product>> {
  const look: Partial<Record<Slot, Product>> = {};
  const usable = pool.filter((p) => hasImage(p) && p.inStock);
  if (usable.length === 0) return look;

  // A dress already covers top and bottom, so anchor on one when we have one.
  const dress = usable
    .filter((p) => toSlot(p) === 'dress')
    .sort((a, b) => Number(b.likes || 0) - Number(a.likes || 0))[seed % Math.max(1, usable.filter((p) => toSlot(p) === 'dress').length)];

  if (dress) look.dress = dress;

  const chosen: Product[] = dress ? [dress] : [];
  const remaining = BOARD_SLOTS.map((s) => s.slot);

  const targets = dress ? remaining.filter((s) => s !== 'top' && s !== 'bottom') : remaining;

  for (const slot of targets) {
    const poolForSlot = usable.filter((p) => toSlot(p) === slot && !chosen.some((c) => c.id === p.id));
    if (poolForSlot.length === 0) continue;

    const best = poolForSlot
      .map((product) => ({
        product,
        score: chosen.length
          ? Math.min(...chosen.map((c) => scorePair(c, product).score))
          : 70 + ((product.id + seed * 5) % 20),
      }))
      .sort((a, b) => b.score - a.score)[0];

    look[slot] = best.product;
    chosen.push(best.product);
  }

  return look;
}