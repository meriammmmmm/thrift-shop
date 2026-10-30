const express = require('express');
const axios = require('axios');
const { Blob } = require('buffer'); // works on Node 18+ regardless of global
const router = express.Router();

// ---------------------------------------------------------------------------
// Virtual try-on via free Hugging Face Spaces — no key, no card, no billing.
//
// Why several Spaces: the public ones are flaky. A Space can be asleep, at
// capacity ("Too many users"), downgraded to CPU, or simply broken. So the
// endpoint cycles through a list, introspects whatever API each one actually
// publishes, and retries patiently inside a time budget.
//
// The customer clicks once; the server keeps trying.
//
// IMPORTANT — the garment type has to travel with the request. The models
// decide what to replace on the body from a "mask" (upper / lower / overall).
// Without it they default to a t-shirt mask and a dress comes back looking
// like a top. The frontend sends `garment_type` for exactly this reason.
//
// Optional: set HF_TOKEN (free from https://huggingface.co/settings/tokens)
// for higher priority / fewer "GPU busy" errors. It is NOT required.
// ---------------------------------------------------------------------------

// Free Spaces, best first. Override the primary with HF_TRYON_SPACE and add
// more with HF_TRYON_FALLBACKS (comma-separated).
//
// Order matters: the first entries are the CatVTON Spaces that accept a
// garment type (so a dress stays a dress). The IDM-VTON forks come next —
// they work but hard-code an "upper body" mask, so a dress comes back as a
// top. The Kolors Space is last because it has been downgraded to CPU and
// times out.
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

const PRIMARY_SPACE = process.env.HF_TRYON_SPACE || DEFAULT_SPACES[0];
const EXTRA_SPACES = (process.env.HF_TRYON_FALLBACKS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const SPACES = [PRIMARY_SPACE, ...EXTRA_SPACES, ...DEFAULT_SPACES].filter(
  (s, i, arr) => s && arr.indexOf(s) === i,
);

const HF_TOKEN = process.env.HF_TOKEN || undefined;

// Total time we are willing to spend retrying before returning a clean error.
const TOTAL_BUDGET_MS = Number(process.env.TRYON_BUDGET_MS || 115000);
const CONNECT_TIMEOUT_MS = 30000;
const PREDICT_TIMEOUT_MS = 80000;

function parseImageInput(input) {
  const m = /^data:(.+?);base64,([\s\S]*)$/.exec(String(input));
  if (m) return { mime: m[1], buffer: Buffer.from(m[2], 'base64') };
  return { mime: 'image/jpeg', buffer: Buffer.from(String(input), 'base64') };
}

async function urlToBuffer(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
  const mime = res.headers['content-type'] || 'image/jpeg';
  return { mime, buffer: Buffer.from(res.data) };
}

async function toBlob(input) {
  const { mime, buffer } =
    String(input).startsWith('http') ? await urlToBuffer(input) : parseImageInput(input);
  return new Blob([buffer], { type: mime });
}

// @gradio/client is ESM-only, so we import it dynamically from this CJS file.
async function getClient(space, useToken = true) {
  const { Client } = await import('@gradio/client');
  // @gradio/client v2 takes the option as `token` — `hf_token` is silently
  // ignored, which leaves us anonymous on the tiny shared quota.
  return Client.connect(space, useToken && HF_TOKEN ? { token: HF_TOKEN } : undefined);
}

/**
 * The free Hugging Face plan gives an account a few GPU-minutes per day. When
 * they run out the Space refuses the job with "exceeded your free ZeroGPU
 * quota". The anonymous pool is a SEPARATE allowance, so a Space that refuses
 * us as "merima…" is often still happy to serve us as a guest.
 */
function isQuotaError(message) {
  return /exceeded your free zero ?gpu quota|zero ?gpu quota/i.test(String(message));
}

/** Gradio's generic failure — tells the customer nothing, so we replace it. */
function isUnhelpfulError(message) {
  return /^(an error occurred|error|unknown error|internal error)\.?$/i.test(
    String(message).trim(),
  );
}

function withTimeout(promise, ms, label) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Gradio sometimes throws a plain object rather than an Error.
function errorText(err) {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || String(err);
  if (err.message) return String(err.message);
  if (err.error) return typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

// Errors that mean "shared GPU is busy / asleep / waking up" — worth retrying.
// IMPORTANT: "Space metadata could not be loaded" is the error a SLEEPING Space
// returns while it boots, so it MUST be retryable (the first request wakes it).
// "Too many users, please try again later" is how a saturated Gradio queue
// rejects a job — also retryable, and the most common free-Space failure.
const RETRYABLE = /quota|gpu|exceeded|queue|full|429|timed out|timeout|ETIMEDOUT|ENOTFOUND|fetch|connect|busy|waking|503|502|loading|metadata|could not be loaded|not be loaded|config|starting|building|sleep|unavailable|too many users|try again later/i;

// Pull a usable image URL out of whatever shape the Space returns.
function extractImageUrl(result) {
  const data = result && result.data;
  const candidates = [];
  if (Array.isArray(data)) candidates.push(...data);
  else if (data) candidates.push(data);
  candidates.push(result);

  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === 'string' && /^https?:|^data:/.test(c)) return c;
    if (typeof c === 'object') {
      if (typeof c.url === 'string') return c.url;
      if (typeof c.path === 'string' && /^https?:/.test(c.path)) return c.path;
      // some Spaces nest the file under .image / .value
      if (c.image && (c.image.url || c.image.path)) return c.image.url || c.image.path;
      if (c.value && (c.value.url || c.value.path)) return c.value.url || c.value.path;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Building the request for whatever API a Space happens to publish.
//
// Gradio Spaces expose the person photo either as a plain file or as an
// ImageEditor (which needs an EditorData object), and the garment either as
// a plain file or as a FileData. The names differ per Space, so we read the
// endpoint's parameter list and fill it in by name.
// ---------------------------------------------------------------------------

function fileData(path) {
  return { path, meta: { _type: 'gradio.FileData' } };
}

/**
 * Some Spaces take the person photo as an ImageEditor and read
 * `person_image["layers"][0]` as the mask. Passing no layer makes the
 * Space raise IndexError. A uniform image is read as "no mask painted",
 * which is exactly what we want — the Space then builds the mask itself
 * from the garment type we send.
 */
const BLANK_MASK_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function editorData(personPath, maskPath) {
  return { background: fileData(personPath), layers: [fileData(maskPath)], composite: null };
}

/**
 * The words a Space might use for each kind of garment, most specific first.
 * A Space that only knows "upper" cannot render a dress, so we never send a
 * word it does not publish.
 */
const MASK_WORDS = {
  overall: [/overall/, /one[-_ ]?piece/, /\bdress\b/, /full[-_ ]?body/, /all[-_ ]?body/],
  lower: [/lower/, /bottom/, /skirt/, /pants/, /trouser/],
  upper: [/upper/, /\btop\b/, /shirt/, /blouse/],
};

/**
 * The allowed values of a parameter, taken from the endpoint's own type
 * hint (Literal['upper', 'lower', 'overall']). This is the authoritative
 * vocabulary — the parameter's DEFAULT is not, because it is almost always
 * "upper", and trusting it is what made every dress come back as a top.
 */
function literalChoices(param) {
  const raw = String((param && param.python_type && param.python_type.type) || '');
  const m = /Literal\[([^\]]*)\]/i.exec(raw);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

/** The word-form used by a Space that does not publish its choices. */
function fallbackVocabulary(sample) {
  if (sample.includes('body')) {
    return { upper: 'upper_body', lower: 'lower_body', overall: 'dress' };
  }
  return {
    upper: 'upper',
    lower: 'lower',
    overall: sample.includes('dress') ? 'dress' : 'overall',
  };
}

/**
 * Translate our mask ("upper" | "lower" | "overall") into the word this
 * Space uses for it, so a dress is fitted to the whole body and not to the
 * torso only.
 */
function resolveGarmentValue(param, mask) {
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

  const sample = String((param && param.parameter_default) || '').toLowerCase();
  return fallbackVocabulary(sample)[mask];
}

/** The names a Space might use for the photo of the person. */
const PERSON_PARAMS = [
  'person_image',
  'person_img',
  'person',
  'dict',
  'exemplar',
  'image',
];

/** The names a Space might use for the photo of the garment. */
const GARMENT_PARAMS = [
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
function supportsEndpoint(parameters) {
  const names = parameters.map((p) => p.parameter_name);
  return (
    names.some((n) => PERSON_PARAMS.includes(n)) &&
    names.some((n) => GARMENT_PARAMS.includes(n))
  );
}

/**
 * Find the parameter that carries the garment type, and the value to put
 * in it for this Space. Returns null when the Space has no such parameter.
 */
function resolveGarmentType(parameters, mask) {
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

/** Send a value the Space actually accepts. */
function pickOption(param, preferred, fallback) {
  const choices = literalChoices(param);
  if (!choices.length) return fallback;
  for (const want of preferred) {
    const hit = choices.find((c) => c.toLowerCase() === want.toLowerCase());
    if (hit) return hit;
  }
  return choices[0];
}

/**
 * Build the arguments for one endpoint.
 * `defaults` are the endpoint's own published defaults, so we only override
 * what we actually know better (the images and the garment type).
 */
function buildArgs(parameters, personPath, garmentPath, maskPath, mask, description) {
  const names = new Set(parameters.map((p) => p.parameter_name));
  const args = {};

  for (const p of parameters) {
    const d = p.parameter_default;
    if (d !== undefined && d !== null && d !== '') args[p.parameter_name] = d;
  }

  // Person photo — plain file or ImageEditor.
  if (names.has('person_image')) args.person_image = editorData(personPath, maskPath);
  else if (names.has('dict')) args.dict = editorData(personPath, maskPath);
  else if (names.has('person_img')) args.person_img = personPath;
  else if (names.has('person')) args.person = editorData(personPath, maskPath);
  else if (names.has('exemplar')) args.exemplar = personPath;
  else if (names.has('image')) args.image = personPath;

  // Garment image.
  if (names.has('cloth_image')) args.cloth_image = fileData(garmentPath);
  else if (names.has('garm_img')) args.garm_img = fileData(garmentPath);
  else if (names.has('garment_img')) args.garment_img = garmentPath;
  else if (names.has('garment')) args.garment = fileData(garmentPath);
  else if (names.has('cloth_img')) args.cloth_img = garmentPath;

  // THE garment type — this is what stops a dress being rendered as a top.
  const clothParam = parameters.find((p) => p.parameter_name === 'cloth_type');
  const categoryParam = parameters.find((p) => p.parameter_name === 'category');
  let appliedType = null;
  if (clothParam) {
    appliedType = resolveGarmentValue(clothParam, mask);
    args.cloth_type = appliedType;
  } else if (categoryParam) {
    appliedType = resolveGarmentValue(categoryParam, mask);
    args.category = appliedType;
  }

  // A short description helps the model understand the piece.
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

  return { args, appliedType };
}

/** Find the endpoint that takes a person photo and a garment. */
function pickEndpoint(named) {
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
    const names = (endpoint.parameters || []).map((p) => p.parameter_name);
    const hasPerson = names.some((n) => PERSON_PARAMS.includes(n));
    const hasGarment = names.some((n) => GARMENT_PARAMS.includes(n));
    if (hasPerson && hasGarment) return { name, endpoint };
  }
  return null;
}

/**
 * One predict attempt against an already-connected client.
 * Reads the Space's own API description and fills it in by parameter name.
 */
async function runPredict(client, space, personBlob, garmentBlob, mask, description) {
  const info = await client.view_api();
  const named = (info && info.named_endpoints) || {};
  const picked = pickEndpoint(named);

  if (!picked) {
    const err = new Error(`"${space}" does not publish a usable try-on endpoint.`);
    err.skipSpace = true;
    throw err;
  }

  // Upload both images (plus a blank mask layer) so we hold real Space-side
  // file references.
  const uploaded = await client.upload_files(client.config.root, [
    personBlob,
    garmentBlob,
    new Blob([BLANK_MASK_PNG], { type: 'image/png' }),
  ]);
  const paths = (uploaded && uploaded.files) || [];
  if (paths.length < 2) throw new Error('Could not upload the images to the try-on service.');

  const parameters = picked.endpoint.parameters || [];

  // Some Spaces (the IDM-VTON and Kolors ones) do not publish a
  // garment-type parameter at all — they always paint an upper-body mask.
  // Using one of them for a dress or a skirt would quietly turn it back
  // into a top, so they are skipped for anything but an upper-body piece.
  const canExpressType = resolveGarmentType(parameters, mask) !== null;
  if (!supportsEndpoint(parameters) || (!canExpressType && mask !== 'upper')) {
    const err = new Error(`"${space}" cannot fit this kind of garment.`);
    err.skipSpace = true;
    throw err;
  }

  const { args, appliedType } = buildArgs(
    parameters,
    paths[0],
    paths[1],
    paths[2] || paths[0],
    mask,
    description,
  );
  console.log(`Try-on (${space}): garment type "${mask}" -> "${appliedType || 'n/a'}"`);
  const result = await withTimeout(
    client.predict(picked.name, args),
    PREDICT_TIMEOUT_MS,
    'The try-on',
  );
  result.appliedType = appliedType;
  return result;
}

router.post('/', async (req, res) => {
  const {
    model_image,
    garment_image,
    garment_type = 'overall',
    garment_description = '',
  } = req.body || {};

  if (!model_image || !garment_image) {
    return res.status(400).json({ error: 'A photo and a product are both required.' });
  }

  // The garment type is what tells the model which part of the body to
  // replace. If the client did not say, assume a full outfit.
  const mask = ['upper', 'lower', 'overall'].includes(garment_type) ? garment_type : 'overall';
  const description = String(garment_description || '').slice(0, 300);

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let lastErr = 'Try-on failed.';
  let quotaErr = null;
  let attempt = 0;
  let hardFailure = false;

  try {
    const [personBlob, garmentBlob] = await Promise.all([
      toBlob(model_image),
      toBlob(garment_image),
    ]);

    // Cycle through the Spaces, retrying each within the overall time budget.
    while (Date.now() < deadline && !hardFailure) {
      const space = SPACES[attempt % SPACES.length];
      attempt += 1;

      // Authenticated first (bigger allowance), then the same Space as a guest:
      // the anonymous ZeroGPU pool is separate from the account's daily quota,
      // so a spent account quota does not have to mean a dead try-on.
      const authModes = HF_TOKEN ? [true, false] : [false];
      let failed = false;

      for (const useToken of authModes) {
        if (Date.now() >= deadline) break;

        try {
          const client = await withTimeout(
            getClient(space, useToken),
            CONNECT_TIMEOUT_MS,
            'Connecting to the try-on service',
          );

          const result = await runPredict(
            client,
            space,
            personBlob,
            garmentBlob,
            mask,
            description,
          );
          const imageUrl = extractImageUrl(result);

          if (!imageUrl) {
            // Got a response but no image — treat as non-retryable bad combo.
            return res.status(422).json({
              error:
                'Could not generate a try-on for this combination. Try another photo or item.',
            });
          }

          const img = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
          });
          const mime = img.headers['content-type'] || 'image/png';
          const dataUrl = `data:${mime};base64,${Buffer.from(img.data).toString('base64')}`;
          return res.json({
            image: dataUrl,
            attempts: attempt,
            space,
            garment_type: mask,
            applied_type: result.appliedType || null,
          });
        } catch (err) {
          lastErr = errorText(err);
          if (isQuotaError(lastErr)) quotaErr = lastErr;

          // A Space that cannot fit this garment type is not a failure — just
          // move on to the next one. The space index still advances, so the
          // loop keeps rotating through the list.
          if (err && err.skipSpace) {
            console.log(`Try-on (${space}): skipped — ${lastErr}`);
            break;
          }

          // The account quota is spent — try this Space anonymously before
          // giving up on it.
          if (isQuotaError(lastErr) && useToken) {
            console.log(`Try-on (${space}): token quota used up — retrying anonymously.`);
            continue;
          }

          console.error(`Try-on attempt ${attempt} (${space}) failed:`, lastErr);
          failed = true;

          // Non-retryable error → stop early.
          if (!RETRYABLE.test(lastErr)) hardFailure = true;
          break;
        }
      }

      // Backoff before the next Space, but never blow past the budget.
      const remaining = deadline - Date.now();
      if (failed && remaining > 1500 && !hardFailure) {
        await sleep(Math.min(4000 + attempt * 1000, remaining - 500));
      }
    }

    // Exhausted the budget or hit a hard error.
    // A quota error explains far more than Gradio's bare "An error occurred".
    const finalErr = isUnhelpfulError(lastErr) && quotaErr ? quotaErr : lastErr;
    let msg = finalErr;
    if (isQuotaError(finalErr)) {
      msg =
        "Today's free GPU quota is used up. It resets tomorrow — or add a free Hugging Face token (huggingface.co/settings/tokens) to raise the limit.";
    } else if (/quota|gpu|exceeded|busy|too many users/i.test(finalErr)) {
      msg =
        'The free try-on service is very busy right now (shared GPU). Please try again in a minute.';
    } else if (/queue|full|429|try again later/i.test(finalErr)) {
      msg = 'The free try-on queue is full at the moment. Please try again shortly.';
    } else if (
      /timed out|connect|fetch|ENOTFOUND|timeout|ETIMEDOUT|loading|metadata|could not be loaded|not be loaded|config|starting|building|sleep|unavailable/i.test(
        finalErr,
      )
    ) {
      msg =
        'The free GPU was asleep and is still waking up. Please wait ~30 seconds and tap "Try it on me" once more — the next try usually goes through.';
    } else if (isUnhelpfulError(finalErr)) {
      msg = 'The try-on service could not process this photo. Please try another photo or item.';
    }
    return res.status(503).json({ error: msg });
  } catch (err) {
    const raw = errorText(err);
    console.error('Try-on fatal error:', raw);
    return res.status(503).json({
      error: 'The free try-on service is unavailable right now. Please try again shortly.',
    });
  }
});

module.exports = router;
