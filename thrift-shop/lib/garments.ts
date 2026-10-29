/**
 * ============================================================
 *  GARMENT TYPES — Mery Rose
 * ============================================================
 *
 *  Virtual try-on models are told which part of the body the
 *  garment covers ("upper", "lower", "overall"). If the model is
 *  not told, it defaults to a t-shirt mask — which is why a dress
 *  used to come back looking like a top.
 *
 *  So both the catalogue category and the product name are read,
 *  and the result is mapped onto the mask the model understands.
 *
 *  Swimwear gets its own type because it does not behave like
 *  clothing: a ONE-PIECE swimsuit is a full-length garment
 *  ("overall"), while a TWO-PIECE swimsuit is a top — fitting it
 *  as "overall" turned it into a dress, which is exactly what
 *  customers complained about.
 *
 *  Bags, shoes and jewellery are not body masks at all: they are
 *  placed on the model by the photo editor ("accessory").
 * ============================================================
 */

import type { Mask } from './tryon-mask';

export type GarmentType =
  | 'dress'
  | 'top'
  | 'bottom'
  | 'outerwear'
  | 'swimwear'
  | 'accessory'
  | 'footwear';

/**
 * What the try-on engines understand:
 *   upper | lower | overall  → the body-mask engines (CatVTON)
 *   accessory                → the photo editor (a bag, a pair of shoes)
 */
export type TryonTarget = Mask;

/** Where an accessory goes on the model. */
export type Placement = 'shoulder' | 'hand' | 'feet' | 'neck' | 'wrist' | 'head';

export interface GarmentClassification {
  type: GarmentType;
  /** What the customer sees. */
  label: string;
  /** What to ask the engine for — null when try-on cannot help. */
  mask: TryonTarget | null;
  /** Where an accessory goes, when the piece is not a body mask. */
  placement?: Placement;
  /** Whether try-on can do anything with this piece. */
  supported: boolean;
}

const LABELS: Record<GarmentType, string> = {
  dress: 'Dress / one-piece',
  top: 'Top',
  bottom: 'Bottom',
  outerwear: 'Outerwear',
  swimwear: 'Swimwear',
  accessory: 'Accessory',
  footwear: 'Footwear',
};

/** Types that can actually be worn on a body. */
const WEARABLE: GarmentType[] = ['dress', 'top', 'bottom', 'outerwear', 'swimwear'];

/**
 * How sure each wearable type is. When the category and the name
 * disagree about a wearable, the more specific one wins — a dress
 * filed under "Tops" is still a dress.
 */
const SPECIFICITY: Record<GarmentType, number> = {
  dress: 4,
  outerwear: 3,
  bottom: 2,
  swimwear: 2,
  top: 1,
  accessory: 0,
  footwear: 0,
};

/**
 * Unambiguous garment words. These are trusted over the catalogue
 * category, because the name is what actually describes the piece.
 *
 * Swimwear is checked BEFORE dresses on purpose: "one-piece swimsuit"
 * contains the word "one-piece", and without this rule a swimsuit was
 * filed as a dress and fitted as a full-length gown.
 */
const STRONG: Array<{ type: GarmentType; re: RegExp }> = [
  {
    type: 'footwear',
    re: /\b(sneaker|sneakers|heel|heels|boot|boots|loafer|loafers|sandal|sandals|slipper|slippers|flats|oxford|pump)\b/i,
  },
  {
    type: 'accessory',
    re: /\b(bag|bags|handbag|purse|tote|backpack|clutch|bracelet|bracelets|necklace|ring|rings|earring|earrings|sunglasses|glasses|belt|belts|scarf|hat|cap|headband|accessor\w*)\b/i,
  },
  {
    type: 'swimwear',
    re: /\b(swimsuit|swimsuits|swimwear|bikini|bikinis|swim\s?set|swimwear\s?set|maillot)\b/i,
  },
  {
    type: 'dress',
    re: /\b(dress|dresses|gown|jumpsuit|jumpsuits|romper|one-piece|one piece|cheongsam|two-piece set|matching set|play suit|playsuit)\b/i,
  },
  { type: 'bottom', re: /\b(skirt|skirts|shorts|pants|trousers|jeans|leggings|capris)\b/i },
  {
    type: 'outerwear',
    re: /\b(coat|jacket|blazer|parka|trench|windbreaker|overcoat)\b/i,
  },
];

/** Softer words, only used when nothing stronger matched. */
const WEAK: Array<{ type: GarmentType; re: RegExp }> = [
  {
    type: 'top',
    re: /\b(top|tops|tshirt|t-shirt|tee|shirt|shirts|blouse|blouses|sweater|sweaters|hoodie|hoodies|tank|tanktop|cami|camisole|crop|bustier|bustiers|corset top|corset tops|bandeau|halter)\b/i,
  },
  { type: 'bottom', re: /\b(skirt|short|pant|jean|legging|trouser)\b/i },
  {
    type: 'dress',
    re: /\b(set|sets|costume|uniform)\b/i,
  },
  { type: 'outerwear', re: /\b(coat|jacket|blazer|cardigan|outerwear)\b/i },
];

/** A two-piece set is a top plus a bottom — never a gown. */
const TWO_PIECE = /\b(two[- ]?piece|2[- ]?piece|bikini|bikini\s?set|swim\s?set|swimwear\s?set)\b/i;

/** A one-piece covers the whole body. */
const ONE_PIECE = /\b(one[- ]?piece|1[- ]?piece|maillot)\b/i;

/** Where an accessory is worn. */
function placementFor(text: string): Placement {
  if (/\b(boot|boots|sneaker|sneakers|heel|heels|sandal|sandals|loafer|flats|slipper|oxford|pump|footwear|shoe|shoes)\b/i.test(text)) {
    return 'feet';
  }
  if (/\b(necklace|pendant|choker)\b/i.test(text)) return 'neck';
  if (/\b(bracelet|bangle|watch|scrunchie)\b/i.test(text)) return 'wrist';
  if (/\b(hat|cap|beanie|headband|scarf)\b/i.test(text)) return 'head';
  if (/\b(bag|bags|handbag|purse|tote|backpack|clutch)\b/i.test(text)) return 'shoulder';
  return 'hand';
}

function matchFirst(text: string, rules: Array<{ type: GarmentType; re: RegExp }>): GarmentType | null {
  for (const rule of rules) {
    if (rule.re.test(text)) return rule.type;
  }
  return null;
}

/**
 * Work out what kind of garment a product is.
 *
 * The catalogue category is usually right, so it is read first. The
 * product name then gets the final say in two cases:
 *   - the name names a garment the category does not (a dress filed
 *     under "Tops"),
 *   - the category says "Bags" but the name says "Ankle Boots".
 */
export function classifyGarment(
  category?: string | null,
  name?: string | null,
): GarmentClassification {
  const cat = (category || '').trim();
  const title = (name || '').trim();

  const categoryType = cat ? matchFirst(cat, STRONG) || matchFirst(cat, WEAK) : null;
  const nameType = title ? matchFirst(title, STRONG) : null;

  let type: GarmentType;

  if (categoryType && nameType) {
    const catWearable = WEARABLE.includes(categoryType);
    const nameWearable = WEARABLE.includes(nameType);

    if (catWearable && nameWearable) {
      // Both describe a wearable — take the more specific one, so a
      // dress never gets downgraded to a top.
      type = SPECIFICITY[nameType] > SPECIFICITY[categoryType] ? nameType : categoryType;
    } else if (catWearable) {
      // The name mentions jewellery ("...gold ring") but the piece
      // itself is clothing — trust the category.
      type = categoryType;
    } else if (nameWearable) {
      // Category said "Bags" but the name says "Ankle Boots" — trust the name.
      type = nameType;
    } else {
      // Neither is wearable. The name is still the better description:
      // category "Bags" but the name says "Ankle Boots".
      type = nameType;
    }
  } else if (categoryType) {
    type = categoryType;
  } else if (nameType) {
    type = nameType;
  } else {
    type = 'top';
  }

  const both = `${cat} ${title}`;

  let mask: TryonTarget | null;
  let label = LABELS[type];
  let placement: Placement | undefined;

  if (type === 'swimwear') {
    // A two-piece is a top (the briefs are a second, separate piece);
    // a one-piece covers the whole body.
    const twoPiece = TWO_PIECE.test(both) && !ONE_PIECE.test(both);
    mask = twoPiece ? 'upper' : 'overall';
    label = twoPiece ? 'Swimwear / two-piece' : 'Swimwear / one-piece';
  } else if (type === 'dress') {
    mask = 'overall';
  } else if (type === 'top' || type === 'outerwear') {
    mask = 'upper';
  } else if (type === 'bottom') {
    mask = 'lower';
  } else if (type === 'accessory' || type === 'footwear') {
    // Not a body mask: the photo editor places it on the model.
    mask = 'accessory';
    placement = placementFor(both);
  } else {
    mask = null;
  }

  return {
    type,
    label,
    mask,
    placement,
    supported: mask !== null,
  };
}

/** A short sentence for the customer describing what will happen. */
export function garmentHint(classification: GarmentClassification): string {
  switch (classification.type) {
    case 'dress':
      return 'Fitted as a full-length garment.';
    case 'swimwear':
      return classification.mask === 'upper'
        ? 'Fitted to the upper body — the top piece of the set.'
        : 'Fitted as a full-length garment.';
    case 'bottom':
      return 'Fitted to the hips and legs.';
    case 'outerwear':
      return 'Fitted over the upper body.';
    case 'top':
      return 'Fitted to the upper body.';
    case 'footwear':
      return 'Placed on the model by the photo editor.';
    case 'accessory':
      return 'Placed on the model by the photo editor.';
    default:
      return '';
  }
}
