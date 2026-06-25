import { NextRequest, NextResponse } from 'next/server';

// Proxies a try-on request to FASHN so the API key never reaches the browser.
// Set FASHN_API_KEY in the storefront's environment (Railway/Vercel).
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const apiKey = process.env.FASHN_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Try-on is not configured yet (missing FASHN_API_KEY).' },
      { status: 500 },
    );
  }

  let body: { model_image?: string; garment_image?: string; category?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { model_image, garment_image, category } = body;
  if (!model_image || !garment_image || !category) {
    return NextResponse.json(
      { error: 'model_image, garment_image and category are required.' },
      { status: 400 },
    );
  }

  const fashnRes = await fetch('https://api.fashn.ai/v1/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model_image,
      garment_image,
      category,
      garment_photo_type: 'auto',
    }),
  });

  const data = await fashnRes.json().catch(() => ({ error: 'Unexpected response from FASHN.' }));
  return NextResponse.json(data, { status: fashnRes.status });
}
