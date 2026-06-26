import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@gradio/client';

// Virtual try-on via Hugging Face "Kolors Virtual Try-On" — 100% FREE.
// No billing, no credit card. Runs on a shared public GPU Space, so it can be
// slow/busy at times. Optional HF_TOKEN (free) reduces "GPU busy" errors.
export const runtime = 'nodejs';
export const maxDuration = 120;

const HF_SPACE = process.env.HF_TRYON_SPACE || 'Kwai-Kolors/Kolors-Virtual-Try-On';
const HF_TOKEN = process.env.HF_TOKEN as `hf_${string}` | undefined;

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
  return new Blob([buffer], { type: mime });
}

export async function POST(req: NextRequest) {
  let body: { model_image?: string; garment_image?: string };
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

  try {
    const [personBlob, garmentBlob] = await Promise.all([
      toBlob(model_image),
      toBlob(garment_image),
    ]);

    const client = await Client.connect(HF_SPACE, HF_TOKEN ? { hf_token: HF_TOKEN } : undefined);

    const result = await client.predict('/tryon', {
      person_img: personBlob,
      garment_img: garmentBlob,
      seed: 0,
      randomize_seed: true,
    });

    const data = result?.data as unknown[];
    const out = Array.isArray(data) ? data[0] : null;
    const imageUrl =
      (out && typeof out === 'object'
        ? (out as { url?: string; path?: string }).url || (out as { path?: string }).path
        : null) || (typeof out === 'string' ? out : null);

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Could not generate a try-on for this combination. Try another photo or item.' },
        { status: 422 },
      );
    }

    const img = await fetch(imageUrl);
    const mime = img.headers.get('content-type') || 'image/png';
    const b64 = Buffer.from(await img.arrayBuffer()).toString('base64');
    return NextResponse.json({ image: `data:${mime};base64,${b64}` });
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Try-on failed.';
    let msg = raw;
    if (/quota|gpu|exceeded/i.test(raw)) {
      msg = 'The free try-on service is busy right now (shared GPU limit). Please try again in a minute.';
    } else if (/queue|full|429/i.test(raw)) {
      msg = 'The free try-on queue is full at the moment. Please try again shortly.';
    } else if (/connect|fetch|ENOTFOUND|timeout|ETIMEDOUT/i.test(raw)) {
      msg = 'Could not reach the try-on service. It may be waking up — please try again in a moment.';
    }
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
