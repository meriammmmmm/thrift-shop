import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@gradio/client';
import {
  type EndpointParameter,
  type Mask,
  pickOption,
  resolveGarmentType,
  supportsEndpoint,
} from '../../../../lib/tryon-mask';

// Virtual try-on via free Hugging Face Spaces — no key, no card, no billing.
//
// Why several Spaces: the public ones are flaky. A Space can be asleep, at
// capacity ("Too many users"), out of ZeroGPU quota, or simply broken — so we
// cycle through the list and retry patiently inside a time budget.
//
// The garment TYPE matters: the models decide what to replace on the body
// from a mask (upper / lower / overall). Without it they default to a
// t-shirt mask and a dress comes back looking like a top. The client sends
// `garment_type` for exactly that reason.
//
// Optional: HF_TOKEN (free from https://huggingface.co/settings/tokens) gives
// a much larger ZeroGPU quota. It is NOT required, but without it the free
// anonymous quota is roughly one try-on per day.
export const runtime = 'nodejs';
export const maxDuration = 120;

const DEFAULT_SPACES = [
  'swarnaverma1234/visionmirror-catvton',
  'swarnaverma1234/catvton',
  'multimodalart/CatVTON-zerogpu',
  'melikfiratai/seetudio-catvton',
  'jeff2004/virtualfit-catvton',
  'yisol/IDM-VTON',
  'Nymbo/Virtual-Try-On',
  'Kwai-Kolors/Kolors-Virtual-Try-On',
];

const extra = (process.env.HF_TRYON_FALLBACKS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const SPACES = [
  process.env.HF_TRYON_SPACE || DEFAULT_SPACES[0],
  ...extra,
  ...DEFAULT_SPACES,
].filter((s, i, arr) => s && arr.indexOf(s) === i);

const HF_TOKEN = process.env.HF_TOKEN as `hf_${string}` | undefined;
const TOTAL_BUDGET_MS = Number(process.env.TRYON_BUDGET_MS || 100000);

/**
 * Some Spaces take the person photo as an ImageEditor and read
 * `person_image["layers"][0]` as the mask. Passing no layer makes the Space
 * raise IndexError, so we send one uniform image — the Space reads that as
 * "no mask painted" and builds the mask itself from the garment type.
 */
const BLANK_MASK_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function parseImageInput(input: string): { mime: string; buffer: Buffer } {
  const m = /^data:(.+?);base64,([\s\S]*)$/.exec(input);
  if (m) return { mime: m[1], buffer: Buffer.from(m[2], 'base64') };
  return { mime: 'image/jpeg', buffer: Buffer.from(input, 'base64') };
}

async function urlToBuffer(url: string): Promise<{ mime: string; buffer: Buffer }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load the product image (${res.status}).`);
  const mime = res.headers.get('content-type') || 'image/jpeg';
  return { mime, buffer: Buffer.from(await res.arrayBuffer()) };
}

async function toBlob(input: string): Promise<Blob> {
  const { mime, buffer } = input.startsWith('http')
    ? await urlToBuffer(input)
    : parseImageInput(input);
  return new Blob([new Uint8Array(buffer)], { type: mime });
}

function fileData(path: string) {
  return { path, meta: { _type: 'gradio.FileData' } };
}

function editorData(personPath: string, maskPath: string) {
  return { background: fileData(personPath), layers: [fileData(maskPath)], composite: null };
}

/** Fill the endpoint by parameter name — every Space names things differently. */
function buildArgs(
  parameters: EndpointParameter[],
  personPath: string,
  garmentPath: string,
  maskPath: string,
  mask: Mask,
  description: string,
) {
  const names = new Set(parameters.map((p) => p.parameter_name));
  const args: Record<string, unknown> = {};

  for (const p of parameters) {
    const d = p.parameter_default;
    if (d !== undefined && d !== null && d !== '') args[p.parameter_name] = d;
  }

  if (names.has('person_image')) args.person_image = editorData(personPath, maskPath);
  else if (names.has('dict')) args.dict = editorData(personPath, maskPath);
  else if (names.has('person_img')) args.person_img = personPath;
  else if (names.has('person')) args.person = editorData(personPath, maskPath);
  else if (names.has('exemplar')) args.exemplar = personPath;
  else if (names.has('image')) args.image = personPath;

  if (names.has('cloth_image')) args.cloth_image = fileData(garmentPath);
  else if (names.has('garm_img')) args.garm_img = fileData(garmentPath);
  else if (names.has('garment_img')) args.garment_img = garmentPath;
  else if (names.has('garment')) args.garment = fileData(garmentPath);
  else if (names.has('cloth_img')) args.cloth_img = garmentPath;

  // THE garment type — this is what stops a dress being rendered as a top.
  const garmentType = resolveGarmentType(parameters, mask);
  if (garmentType) args[garmentType.parameter] = garmentType.value;

  if (names.has('garment_des')) args.garment_des = description;
  if (names.has('prompt')) args.prompt = description;
  // num_inference_steps and guidance_scale are deliberately NOT overridden:
  // the Space's published defaults are tuned for its own model, and dropping
  // the step count produces a muddy, half-blended garment.
  if (names.has('randomize_seed')) args.randomize_seed = true;
  if (names.has('show_type')) {
    const showParam = parameters.find((p) => p.parameter_name === 'show_type');
    args.show_type = pickOption(showParam, ['result only', 'result'], 'result only');
  }

  return { args, appliedType: garmentType?.value ?? null };
}

function pickEndpoint(named: Record<string, { parameters?: Array<{ parameter_name: string }> }>) {
  const preferred = [
    '/submit_function',
    '/submit_function_flux',
    '/tryon',
    '/try-on',
    '/try_on',
    '/predict',
  ];
  for (const want of preferred) {
    if (named[want]) return { name: want, endpoint: named[want] };
  }
  for (const [name, endpoint] of Object.entries(named)) {
    const n = (endpoint.parameters || []).map((p) => p.parameter_name);
    const hasPerson = n.some((x) =>
      ['person_image', 'person_img', 'dict', 'exemplar', 'image'].includes(x),
    );
    const hasGarment = n.some((x) =>
      ['cloth_image', 'garm_img', 'garment_img', 'cloth_img'].includes(x),
    );
    if (hasPerson && hasGarment) return { name, endpoint };
  }
  return null;
}

/** Dig the generated image out of whatever shape the Space returns. */
function extractImageUrl(result: unknown): string | null {
  const data = (result as { data?: unknown[] })?.data;
  const candidates = Array.isArray(data) ? data : data ? [data] : [];
  candidates.push(result);

  for (const entry of candidates) {
    if (!entry) continue;
    if (typeof entry === 'string' && /^https?:|^data:/.test(entry)) return entry;
    if (typeof entry === 'object') {
      const obj = entry as { url?: string; path?: string; image?: { url?: string }; value?: { url?: string } };
      if (obj.url) return obj.url;
      if (obj.path && /^https?:/.test(obj.path)) return obj.path;
      if (obj.image?.url) return obj.image.url;
      if (obj.value?.url) return obj.value.url;
    }
  }
  return null;
}


/** Gradio sometimes throws a plain object rather than an Error. */
/** Reject a promise that takes longer than ms. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}

/** Gradio sometimes throws a plain object rather than an Error. */
function errorText(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || String(err);
  const e = err as { message?: unknown; error?: unknown };
  if (e.message) return String(e.message);
  if (e.error) return typeof e.error === 'string' ? e.error : JSON.stringify(e.error);
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function isBusyError(message: string): boolean {
  return /quota|gpu|exceeded|busy|queue|full|429|starting|sleep|wake|cold|timeout|ETIMEDOUT|too many users|try again later|zero ?gpu/i.test(
    message,
  );
}

/**
 * The free Hugging Face plan gives an account a few GPU-minutes per day. When
 * they run out the Space refuses the job with "exceeded your free ZeroGPU
 * quota". The anonymous pool is a SEPARATE allowance, so a Space that refuses
 * us as "merima…" is often still happy to serve us as a guest.
 */
function isQuotaError(message: string): boolean {
  return /exceeded your free zero ?gpu quota|zero ?gpu quota/i.test(message);
}

/** Gradio's generic failure — tells the customer nothing, so we replace it. */
function isUnhelpfulError(message: string): boolean {
  return /^(an error occurred|error|unknown error|internal error)\.?$/i.test(message.trim());
}

/**
 * Some Spaces (the IDM-VTON and Kolors ones) do not publish a garment-type
 * parameter at all — they always paint an upper-body mask. Using one of them
 * for a dress or a skirt would quietly turn it back into a top, so they are
 * skipped for anything but an upper-body garment.
 *
 * The same is true for a Space that cannot be driven at all. Skipping means
 * "try the next one", not "give up".
 */
class SkipSpace extends Error {
  constructor(space: string, reason: string) {
    super(`"${space}" ${reason}`);
    this.name = 'SkipSpace';
  }
}

function friendlyError(raw: string): string {
  if (isQuotaError(raw)) {
    return "Today's free GPU quota is used up. It resets tomorrow — or add a free Hugging Face token (huggingface.co/settings/tokens) to raise the limit.";
  }
  if (/quota|gpu|exceeded|busy|too many users/i.test(raw)) {
    return 'The free try-on service is busy right now (shared GPU limit). Please try again in a minute.';
  }
  if (/queue|full|429|try again later/i.test(raw)) {
    return 'The free try-on queue is full at the moment. Please try again shortly.';
  }
  if (/connect|fetch|ENOTFOUND|timeout|ETIMEDOUT/i.test(raw)) {
    return 'Could not reach the try-on service. It may be waking up — please try again in a moment.';
  }
  if (isUnhelpfulError(raw)) {
    return 'The try-on service could not process this photo. Please try another photo or item.';
  }
  return raw;
}

export async function POST(req: NextRequest) {
  let body: {
    model_image?: string;
    garment_image?: string;
    garment_type?: string;
    garment_description?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { model_image, garment_image } = body;
  if (!model_image || !garment_image) {
    return NextResponse.json(
      { error: 'A photo and a product are both required.' },
      { status: 400 },
    );
  }

  const mask: Mask = ['upper', 'lower', 'overall'].includes(body.garment_type || '')
    ? (body.garment_type as Mask)
    : 'overall';
  const description = String(body.garment_description || '').slice(0, 300);

  try {
    const [personBlob, garmentBlob] = await Promise.all([
      toBlob(model_image),
      toBlob(garment_image),
    ]);

    const deadline = Date.now() + TOTAL_BUDGET_MS;
    let lastError = 'Try-on failed.';
    let quotaError: string | null = null;
    let hardFailure = false;

    for (const space of SPACES) {
      if (Date.now() >= deadline || hardFailure) break;

      // Authenticated first (bigger allowance), then the same Space as a guest:
      // the anonymous ZeroGPU pool is separate from the account's daily quota,
      // so a spent account quota does not have to mean a dead try-on.
      const authModes = HF_TOKEN ? [true, false] : [false];

      for (const useToken of authModes) {
        if (Date.now() >= deadline) break;

        try {
          const client = await withTimeout(
            Client.connect(space, useToken && HF_TOKEN ? { token: HF_TOKEN } : undefined),
            20000,
            'Connecting to the try-on service',
          );
          const info = await client.view_api();
          const picked = pickEndpoint((info?.named_endpoints || {}) as never);
          if (!picked) throw new SkipSpace(space, 'does not publish a usable try-on endpoint.');
          if (!client.config?.root) throw new SkipSpace(space, 'is not reachable right now.');

          const endpointParams = (picked.endpoint.parameters || []) as EndpointParameter[];
          if (!supportsEndpoint(endpointParams)) {
            throw new SkipSpace(space, 'uses parameter names we cannot fill.');
          }
          if (!resolveGarmentType(endpointParams, mask) && mask !== 'upper') {
            throw new SkipSpace(space, 'cannot fit this kind of garment.');
          }

          const uploaded = await client.upload_files(client.config.root, [
            personBlob,
            garmentBlob,
            new Blob([new Uint8Array(BLANK_MASK_PNG)], { type: 'image/png' }),
          ]);
          const paths = uploaded?.files || [];
          if (paths.length < 2) throw new Error('Could not upload the images to the try-on service.');

          const { args, appliedType } = buildArgs(
            (picked.endpoint.parameters || []) as never,
            paths[0],
            paths[1],
            paths[2] || paths[0],
            mask,
            description,
          );

          console.log(
            `Try-on (${space}): garment type "${mask}" -> "${appliedType ?? 'n/a'}"${useToken ? '' : ' (anonymous)'}`,
          );

          const result = await withTimeout(
            client.predict(picked.name, args),
            80000,
            'The try-on',
          );
          const imageUrl = extractImageUrl(result);

          if (!imageUrl) {
            return NextResponse.json(
              { error: 'Could not generate a try-on for this combination. Try another photo or item.' },
              { status: 422 },
            );
          }

          const img = await fetch(imageUrl);
          if (!img.ok) {
            return NextResponse.json(
              { error: 'The try-on finished but the image could not be downloaded. Please try again.' },
              { status: 502 },
            );
          }
          const mime = img.headers.get('content-type') || 'image/png';
          const b64 = Buffer.from(await img.arrayBuffer()).toString('base64');
          return NextResponse.json({
            image: `data:${mime};base64,${b64}`,
            space,
            garment_type: mask,
            applied_type: appliedType,
          });
        } catch (err) {
          const raw = errorText(err);
          // A Space that cannot fit this garment type is not a failure — just
          // move on to the next one.
          if (err instanceof SkipSpace) {
            console.log(`Try-on (${space}): skipped — ${raw}`);
            break;
          }
          lastError = raw;
          if (isQuotaError(raw)) quotaError = raw;

          // The account quota is spent — try this Space anonymously before
          // giving up on it.
          if (isQuotaError(raw) && useToken) {
            console.log(`Try-on (${space}): token quota used up — retrying anonymously.`);
            continue;
          }

          console.error(`Try-on attempt (${space}) failed:`, raw);
          if (!isBusyError(raw)) hardFailure = true;
          break;
        }
      }
    }

    // A quota error explains far more than Gradio's bare "An error occurred".
    const finalError = isUnhelpfulError(lastError) && quotaError ? quotaError : lastError;
    return NextResponse.json({ error: friendlyError(finalError) }, { status: 503 });
  } catch (err) {
    const raw = errorText(err);
    return NextResponse.json({ error: friendlyError(raw) }, { status: 503 });
  }
}
