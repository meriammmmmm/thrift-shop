/**
 * ============================================================
 *  GARMENT TYPE -> SPACE VOCABULARY
 * ============================================================
 *  Every try-on Space has a parameter that says which part of
 *  the body the garment replaces. The name of the parameter and
 *  the words it accepts differ from Space to Space:
 *
 *      CatVTON   cloth_type   upper | lower | overall
 *      IDM-VTON  category     upper_body | lower_body | dress
 *
 *  The important trap: a Space's parameter DEFAULT is almost
 *  always "upper". Reading the vocabulary from the default
 *  therefore silently forces EVERY garment onto the upper body,
 *  which is why a dress used to come back looking like a top.
 *
 *  The authoritative vocabulary is the endpoint's own type hint
 *  (Literal['upper', 'lower', 'overall']), so that is what we read.
 */

export type Mask = 'upper' | 'lower' | 'overall' | 'accessory';

/**
 * The words a Space might use for each kind of garment, most specific
 * first. A Space that only knows "upper" cannot render a dress, so we
 * never send it a word it does not publish.
 */
export const MASK_WORDS: Record<Mask, RegExp[]> = {
  overall: [/overall/, /one[-_ ]?piece/, /\bdress\b/, /full[-_ ]?body/, /all[-_ ]?body/],
  lower: [/lower/, /bottom/, /skirt/, /pants/, /trouser/],
  upper: [/upper/, /\btop\b/, /shirt/, /blouse/],
  accessory: [/accessor/i, /\bbag\b/, /handbag/, /purse/, /tote/, /clutch/, /shoe/, /boot/],
};

export interface EndpointParameter {
  parameter_name: string;
  parameter_default?: unknown;
  python_type?: { type?: string };
}

/**
 * The allowed values of a parameter, taken from the endpoint's own type
 * hint. Returns an empty list when the Space does not publish its choices.
 */
export function literalChoices(param?: EndpointParameter): string[] {
  const raw = String(param?.python_type?.type ?? '');
  const m = /Literal\[([^\]]*)\]/i.exec(raw);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

/** The word-form used by a Space that does not publish its choices. */
export function fallbackVocabulary(sample: string): Record<Mask, string> {
  if (sample.includes('body')) {
    return {
      upper: 'upper_body',
      lower: 'lower_body',
      overall: 'dress',
      accessory: 'accessory',
    };
  }
  return {
    upper: 'upper',
    lower: 'lower',
    overall: sample.includes('dress') ? 'dress' : 'overall',
    accessory: 'accessory',
  };
}

/**
 * Translate our mask ("upper" | "lower" | "overall") into the word this
 * Space uses for it, so a dress is fitted to the whole body and not to the
 * torso only.
 */
export function resolveGarmentValue(
  param: EndpointParameter | undefined,
  mask: Mask,
): string {
  const choices = literalChoices(param);
  if (choices.length) {
    for (const re of MASK_WORDS[mask]) {
      const hit = choices.find((c) => re.test(c.toLowerCase()));
      if (hit) return hit;
    }
    // The Space has a vocabulary but not one we recognise — fall through to
    // the generic word rather than sending something invalid.
    return mask;
  }

  const sample = String(param?.parameter_default ?? '').toLowerCase();
  return fallbackVocabulary(sample)[mask];
}

/** Send a value the Space actually accepts. */
export function pickOption(
  param: EndpointParameter | undefined,
  preferred: string[],
  fallback: string,
): string {
  const choices = literalChoices(param);
  if (!choices.length) return fallback;
  for (const want of preferred) {
    const hit = choices.find((c) => c.toLowerCase() === want.toLowerCase());
    if (hit) return hit;
  }
  return choices[0];
}

/**
 * Find the parameter that carries the garment type, and the value to put
 * in it for this Space.
 */
export function resolveGarmentType(
  parameters: EndpointParameter[],
  mask: Mask,
): { parameter: string; value: string } | null {
  const cloth = parameters.find((p) => p.parameter_name === 'cloth_type');
  if (cloth) {
    return { parameter: 'cloth_type', value: resolveGarmentValue(cloth, mask) };
  }
  const category = parameters.find((p) => p.parameter_name === 'category');
  if (category) {
    return { parameter: 'category', value: resolveGarmentValue(category, mask) };
  }
  return null;
}

/**
 * The names a Space might use for the photo of the person.
 */
export const PERSON_PARAMS = [
  'person_image',
  'person_img',
  'person',
  'dict',
  'exemplar',
  'image',
];

/** The names a Space might use for the photo of the garment. */
export const GARMENT_PARAMS = [
  'cloth_image',
  'garm_img',
  'garment_img',
  'garment',
  'cloth_img',
];

/**
 * Whether this endpoint uses parameter names we know how to fill. A Space
 * that calls them something else cannot be driven, so it is skipped.
 */
export function supportsEndpoint(parameters: EndpointParameter[]): boolean {
  const names = parameters.map((p) => p.parameter_name);
  return (
    names.some((n) => PERSON_PARAMS.includes(n)) &&
    names.some((n) => GARMENT_PARAMS.includes(n))
  );
}

/**
 * Read the garment type back out of whatever word a Space uses
 * ("dress", "overall", "upper_body"…), so a result can be checked against
 * what was actually asked for.
 */
export function maskFromWord(word: unknown): Mask | null {
  const s = String(word ?? '').toLowerCase();
  if (!s) return null;
  for (const mask of ['overall', 'lower', 'upper', 'accessory'] as Mask[]) {
    if (MASK_WORDS[mask].some((re) => re.test(s))) return mask;
  }
  return null;
}

/**
 * Whether a result really was fitted with the garment type that was asked
 * for. A service that answers with "upper" when a dress was requested has
 * painted the torso only — showing that image would be worse than an error,
 * because the customer would see a dress rendered as a top.
 */
export function resultMatchesType(requested: Mask, applied: unknown): boolean {
  const got = maskFromWord(applied);
  return got !== null && got === requested;
}
