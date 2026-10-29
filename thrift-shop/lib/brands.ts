/**
 * ============================================================
 *  BRAND INDEX — Mery Rose
 * ============================================================
 *  Turns the raw `products[].brand` strings into a clean, sorted
 *  index for the storefront's brand carousel.
 *
 *  WHY THIS EXISTS
 *  ---------------
 *  The catalogue stores brand names exactly as whoever uploaded the
 *  piece typed them, so one label arrives in several shapes:
 *  `Bershka` / `bershka`, `SHEIN` / `shein`. Rendering those raw
 *  produced duplicate tiles — the storefront showed "SHEIN" twice,
 *  because those really were two different strings.
 *
 *  So we: fold the variants under one case-insensitive key, keep the
 *  nicest casing for display, count the pieces across every casing,
 *  and drop the placeholder labels ("Generic", "Fashion Brand",
 *  "Unbranded", …) that are catalogue noise rather than brands.
 * ============================================================
 */

export interface BrandEntry {
  /** The name we show the customer. */
  name: string;
  /** Lowercased name — the lookup key and the filter query value. */
  key: string;
  /** How many pieces carry this brand, across every casing. */
  count: number;
  /** True when the brand is on the merchandised list. */
  featured: boolean;
}

/**
 * Well-known labels that lead the carousel.
 *
 * This is a merchandising list, not a filter — a brand that is not on
 * it still shows up, it just sits further down the rail. That way the
 * carousel grows on its own as the catalogue does.
 */
const FEATURED_SOURCE = `
  Zara, H&M, Mango, Nike, Adidas, Gucci, Prada, Chanel, Dior,
  Louis Vuitton, Versace, Armani, Burberry, Fendi, Balenciaga, Givenchy,
  Valentino, Saint Laurent, Hermès, Celine, Loewe, Bottega Veneta,
  Alexander McQueen, Dolce & Gabbana, Ralph Lauren, Tommy Hilfiger,
  Calvin Klein, Michael Kors, Coach, Kate Spade, Tory Burch, Marc Jacobs,
  Levi's, Wrangler, Lee, Diesel, G-Star, True Religion, Massimo Dutti,
  COS, Arket, Uniqlo, Muji, Everlane, Madewell, J.Crew, Banana Republic,
  Gap, Old Navy, American Eagle, Abercrombie & Fitch, Hollister,
  Urban Outfitters, Free People, Anthropologie, Topshop, ASOS,
  Boohoo, PrettyLittleThing, Missguided, Nasty Gal, Revolve, Shein,
  Bershka, Pull&Bear, Stradivarius, Oysho, Lefties, Reserved, Sinsay,
  New Look, River Island, Dorothy Perkins, Karen Millen, Oasis, Reiss,
  Forever 21, Desigual, Miss Sixty, Trussardi Jeans, Camomilla,
  George Gina & Lucy, Ed Hardy, SHEINBAE, Romwe, Garage
`;

export const FEATURED_BRANDS: string[] = FEATURED_SOURCE.split(',')
  .map((name) => name.trim())
  .filter(Boolean);

const FEATURED_KEYS = new Set(FEATURED_BRANDS.map((name) => name.toLowerCase()));

/**
 * Catalogue noise, not brands.
 *
 * Uploaders leave free-text labels behind ("Contemporary",
 * "Fashion Brand", "Unbranded", "No visible brand", …). They are real
 * strings on real products, so they have to be recognised rather than
 * merely hoped away.
 */
const PLACEHOLDER_PATTERN =
  /\b(brand|brands|fashion|contemporary|unbranded|generic|unknown|boutique|collection|gothic|alternative|visible|retailer|teamwear|costume|casual|fast)\b/i;

/** True when the label is a placeholder rather than a brand. */
export function isPlaceholderBrand(name: string): boolean {
  const trimmed = (name || '').trim();
  if (!trimmed) return true;
  return PLACEHOLDER_PATTERN.test(trimmed);
}

/** `bershka` → `Bershka`: prefer a label that is not all lowercase. */
function isAllLowercase(name: string): boolean {
  return name === name.toLowerCase();
}

/**
 * Build the display index from the product list.
 *
 * Ordering: merchandised brands first, then the rest — by how many
 * pieces each one has, with the name as the tie-break so the rail
 * never reshuffles between renders.
 */
export function buildBrandIndex(
  products: Array<{ brand?: string | null }>,
): BrandEntry[] {
  const byKey = new Map<string, BrandEntry>();

  for (const product of products) {
    const raw = (product?.brand ?? '').trim();
    if (!raw || isPlaceholderBrand(raw)) continue;

    const key = raw.toLowerCase();
    const existing = byKey.get(key);

    if (existing) {
      existing.count += 1;
      // Keep the better-looking casing of the two.
      if (isAllLowercase(existing.name) && !isAllLowercase(raw)) {
        existing.name = raw;
      }
    } else {
      byKey.set(key, {
        name: raw,
        key,
        count: 1,
        featured: FEATURED_KEYS.has(key),
      });
    }
  }

  return Array.from(byKey.values()).sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.count !== b.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });
}

/** Link to the catalogue filtered by this brand. */
export function brandHref(key: string): string {
  return `/products?brand=${encodeURIComponent(key)}`;
}
