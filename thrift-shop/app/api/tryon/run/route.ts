import { NextRequest, NextResponse } from 'next/server';

// Virtual try-on using Google's free Gemini 2.5 Flash Image model.
// Free tier: ~500 images/day, no credit card. Set GEMINI_API_KEY in the
// storefront's environment. The key never reaches the browser.
export const runtime = 'nodejs';

const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

// Pull base64 + mime out of a data URL, or pass through a raw base64 string.
function parseDataUrl(input: string): { data: string; mime: string } {
  const m = /^data:(.+?);base64,([\s\S]*)$/.exec(input);
  if (m) return { mime: m[1], data: m[2] };
  return { mime: 'image/jpeg', data: input };
}

// Fetch a remote image (e.g. the product photo) and return it as base64.
async function urlToBase64(url: string): Promise<{ data: string; mime: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load the product image (${res.status}).`);
  const mime = res.headers.get('content-type') || 'image/jpeg';
  const buf = Buffer.from(await res.arrayBuffer());
  return { data: buf.toString('base64'), mime };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Try-on is not configured yet (missing GEMINI_API_KEY).' },
      { status: 500 },
    );
  }

  let body: { model_image?: string; garment_image?: string; category?: string };
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
    const person = parseDataUrl(model_image);
    const garment = garment_image.startsWith('data:')
      ? parseDataUrl(garment_image)
      : await urlToBase64(garment_image);

    const prompt =
      'You are a virtual clothing try-on tool. The FIRST image is a person. ' +
      'The SECOND image is a clothing item. Generate a single photorealistic image ' +
      'of the same person wearing the clothing item from the second image. Keep the ' +
      "person's face, hair, body shape, pose, skin tone and the background unchanged. " +
      'Replace only the relevant clothing so it fits naturally with realistic folds, ' +
      'lighting and shadows. Return only the resulting image.';

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: person.mime, data: person.data } },
                { inline_data: { mime_type: garment.mime, data: garment.data } },
              ],
            },
          ],
        }),
      },
    );

    const data = await geminiRes.json().catch(() => null);
    if (!geminiRes.ok) {
      const msg = data?.error?.message || 'The try-on service returned an error.';
      return NextResponse.json({ error: msg }, { status: geminiRes.status });
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(
      (p: { inlineData?: { data: string; mimeType?: string }; inline_data?: { data: string; mime_type?: string } }) =>
        p.inlineData?.data || p.inline_data?.data,
    );
    const inline = imgPart?.inlineData || imgPart?.inline_data;

    if (!inline?.data) {
      const textPart = parts.find((p: { text?: string }) => p.text)?.text;
      return NextResponse.json(
        { error: textPart || 'The model could not generate a try-on for this combination. Try another photo or item.' },
        { status: 422 },
      );
    }

    const mime = inline.mimeType || inline.mime_type || 'image/png';
    return NextResponse.json({ image: `data:${mime};base64,${inline.data}` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Something went wrong generating the try-on.' },
      { status: 500 },
    );
  }
}
