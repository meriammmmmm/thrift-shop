/**
 * Category filtering for the storefront.
 *
 * The admin panel writes free-text categories, and its AI image analyser
 * guesses them, so the database holds dozens of near-duplicate strings:
 * "Skirts" and "Mini Skirts", "Tops" and "Crop Tops", "Corsets & Bustiers"
 * and "Bustiers & Corsets". A chip row built from the raw values would be
 * unusable, and matching on the raw values hides most of the shop — a
 * "Skirts" product only showed up under "Dresses", and whole families
 * (swimwear, corsets, costumes) matched no chip at all.
 *
 * So the storefront shows a small set of curated groups and folds every raw
 * category string into exactly one of them. "Other" is the catch-all, which
 * means a piece can never become unreachable through the filters.
 */

/** The category chips shown above the product grid, in display order. */
export const CATEGORY_FILTERS = [
  'All',
  'Dresses',
  'Skirts',
  'Bottoms',
  'Shoes',
  'Accessories',
  'Tops',
  'Corsets',
  'Bags',
  'Jackets',
  'Swimwear',
  'Other',
] as const;

export type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

/**
 * Raw category string -> group. Order matters: the first pattern that matches
 * wins, so the more specific families have to come first.
 *
 * - Swimwear is tested before Tops so "Bikini Tops" and "Swimwear Tops" stay
 *   with the swimwear instead of being filed as ordinary tops.
 * - Corsets is tested before Tops so "Corset Tops" and "Bustier Tops" are
 *   sold with the corsets rather than with the ordinary tops.
 * - Bottoms is tested before Dresses so "Dress Pants" stays with the bottoms.
 *   It only looks for the plural forms, so a "Short Sleeve Top" is not caught
 *   by it and stays with the tops.
 * - Jackets is tested before Tops so "Sweatshirts" and "Hoodies" are not
 *   caught by the "shirt" pattern.
 */
const CATEGORY_RULES: ReadonlyArray<readonly [CategoryFilter, RegExp]> = [
  ['Swimwear', /swim|bikini/],
  ['Corsets', /corset|bustier/],
  ['Bags', /bag|purse|tote|clutch|backpack/],
  ['Bottoms', /shorts|pants|jeans|bottoms|trousers|leggings/],
  ['Shoes', /shoe|sneaker|boot|heel|flat|sandal|loafer|pump/],
  ['Dresses', /dress/],
  ['Skirts', /skirt/],
  ['Jackets', /jacket|coat|blazer|suit|tuxedo|outerwear/],
  [
    'Accessories',
    /jewel|watch|sunglass|belt|scarf|hat|bracelet|necklace|earring|ring|accessor|wallet|glove/,
  ],
  [
    'Tops',
    /top|t-?shirt|blouse|sweater|knit|bodysuit|tank|hoodie|polo|tee|cheer|uniform|two-piece/,
  ],
];

/**
 * Fold a raw category string into one of the storefront groups.
 * Anything we do not recognise lands in "Other" rather than disappearing.
 */
export function resolveCategory(raw: string | null | undefined): CategoryFilter {
  const value = (raw ?? '').trim().toLowerCase();
  if (!value) return 'Other';

  for (const [group, pattern] of CATEGORY_RULES) {
    if (pattern.test(value)) return group;
  }
  return 'Other';
}

/**
 * Does a product with this raw category belong to the selected chip?
 * "All" matches everything.
 */
export function matchesCategoryFilter(
  raw: string | null | undefined,
  selected: string,
): boolean {
  if (!selected || selected === 'All') return true;
  return resolveCategory(raw) === resolveCategory(selected);
}
