/**
 * Cutting the background off the outfit photo — in the merchant's own browser.
 *
 * The model runs locally through transformers.js, so the photo never leaves
 * the machine and the API never has to know anything about it. The first
 * use downloads the model (roughly 45 MB); the browser keeps it afterwards,
 * so the second look takes seconds.
 *
 * The alternative — a server that does the cutting — needs a GPU and a
 * model sitting on a machine that is always switched on. For a shop that
 * publishes a handful of looks, the browser is the honest place for it.
 */

/**
 * The web build of transformers.js, loaded straight from the CDN so it does
 * not weigh the admin panel down. `webpackIgnore` tells the bundler to
 * leave the import alone and let the browser fetch it at run time.
 */
const TRANSFORMERS_URL =
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';

/** The model that finds the edge of the person and everything they wear. */
const MODEL_ID = 'briaai/RMBG-1.4';

/** The longest edge of the cut-out that is kept. */
const MAX_EDGE = 1500;

export interface CutoutProgress {
  /** What the browser is doing right now, in the merchant's words. */
  message: string;
  /** How far along it is, from 0 to 100. */
  percent: number;
}

/** What the machine can actually run the model on. */
interface Machine {
  /** Can the work be handed to the graphics card? */
  webgpu: boolean;
  /** Can the graphics card handle half-precision numbers? */
  fp16: boolean;
}

/**
 * Ask the machine what it can do.
 *
 * A browser may offer WebGPU and still have no usable graphics card, and
 * not every card can handle half-precision numbers — so both are checked
 * before the model is asked to run.
 */
const inspectMachine = async (): Promise<Machine> => {
  const gpu = (
    navigator as unknown as {
      gpu?: {
        requestAdapter: () => Promise<{
          features?: { has: (name: string) => boolean };
        } | null>;
      };
    }
  ).gpu;

  if (!gpu) return { webgpu: false, fp16: false };

  try {
    const adapter = await gpu.requestAdapter();
    if (!adapter) return { webgpu: false, fp16: false };

    return { webgpu: true, fp16: Boolean(adapter.features?.has('shader-f16')) };
  } catch {
    return { webgpu: false, fp16: false };
  }
};

/**
 * Turn the raw pixels the model produced into a PNG.
 *
 * The cut-out is scaled down on the way out: the storefront draws the
 * outfit at a few hundred pixels, and the photo has to travel inside a
 * JSON body to reach the server.
 */
const rawToPng = (raw: {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  channels?: number;
}): string => {
  const { width, height } = raw;
  const channels = raw.channels || 4;

  const source = document.createElement('canvas');
  source.width = width;
  source.height = height;

  const sourceContext = source.getContext('2d');
  if (!sourceContext) throw new Error('This browser cannot draw the photo');

  const imageData = sourceContext.createImageData(width, height);

  if (channels === 4) {
    imageData.data.set(raw.data);
  } else {
    // A cut-out without an alpha channel still has to be made transparent.
    for (let read = 0, write = 0; read < raw.data.length; read += channels, write += 4) {
      imageData.data[write] = raw.data[read];
      imageData.data[write + 1] = raw.data[read + 1] ?? raw.data[read];
      imageData.data[write + 2] = raw.data[read + 2] ?? raw.data[read];
      imageData.data[write + 3] = 255;
    }
  }

  sourceContext.putImageData(imageData, 0, 0);

  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  if (scale === 1) return source.toDataURL('image/png');

  const scaled = document.createElement('canvas');
  scaled.width = Math.max(1, Math.round(width * scale));
  scaled.height = Math.max(1, Math.round(height * scale));

  const scaledContext = scaled.getContext('2d');
  if (!scaledContext) throw new Error('This browser cannot draw the photo');

  scaledContext.imageSmoothingEnabled = true;
  scaledContext.imageSmoothingQuality = 'high';
  scaledContext.drawImage(source, 0, 0, scaled.width, scaled.height);

  return scaled.toDataURL('image/png');
};

/**
 * Take the background away and hand back a PNG of the outfit alone.
 */
export const removeBackground = async (
  source: string,
  onProgress?: (progress: CutoutProgress) => void
): Promise<string> => {
  const report = (message: string, percent: number) => onProgress?.({ message, percent });

  report('Fetching the cutting model…', 0);

  const transformers = await import(/* webpackIgnore: true */ TRANSFORMERS_URL);

  // The model is fetched from the internet, never from this origin.
  transformers.env.allowLocalModels = false;

  const machine = await inspectMachine();

  /**
   * The ways the model can be run, best first.
   *
   * Not every machine can do everything: a browser may offer WebGPU with
   * no usable graphics card behind it, and a card may not handle
   * half-precision numbers. Each way is tried in turn, so a machine that
   * cannot do the fast thing still gets its cut-out.
   */
  const attempts: Array<{ device: 'webgpu' | 'wasm'; dtype: 'fp16' | 'q8' | 'fp32' }> = [];

  if (machine.webgpu) {
    attempts.push({ device: 'webgpu', dtype: machine.fp16 ? 'fp16' : 'q8' });
    attempts.push({ device: 'webgpu', dtype: 'q8' });
  }
  attempts.push({ device: 'wasm', dtype: 'q8' });
  attempts.push({ device: 'wasm', dtype: 'fp32' });

  let failure: unknown = null;

  for (const attempt of attempts) {
    try {
      const segmenter = await transformers.pipeline('background-removal', MODEL_ID, {
        device: attempt.device,
        dtype: attempt.dtype,
        progress_callback: (event: { status?: string; progress?: number }) => {
          if (event.status === 'progress' && typeof event.progress === 'number') {
            report(
              `Downloading the cutting model… ${Math.round(event.progress)}%`,
              event.progress * 0.7
            );
          } else if (event.status === 'ready') {
            report('Cutting the background away…', 75);
          }
        },
      });

      report('Cutting the background away…', 80);

      const result = await segmenter(source);

      /**
       * The model hands back the cut-out as a picture with an alpha
       * channel. Some versions of the library wrap it in an envelope and
       * some hand it over on its own, so both shapes are accepted.
       */
      const first = Array.isArray(result) ? result[0] : result;
      const candidate = first?.output ?? first;
      const cutout =
        candidate && typeof candidate.width === 'number' && typeof candidate.data !== 'undefined'
          ? candidate
          : null;

      if (!cutout) throw new Error('The background could not be cut away');

      report('Finishing the cut-out…', 95);

      return rawToPng(cutout);
    } catch (error) {
      failure = error;
    }
  }

  throw failure instanceof Error ? failure : new Error('The background could not be cut away');
};
