import { NextRequest, NextResponse } from 'next/server';

// Polls FASHN for the status/result of a try-on prediction.
export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const apiKey = process.env.FASHN_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Try-on is not configured yet (missing FASHN_API_KEY).' },
      { status: 500 },
    );
  }

  const { id } = await params;
  const fashnRes = await fetch(`https://api.fashn.ai/v1/status/${id}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const data = await fashnRes.json().catch(() => ({ error: 'Unexpected response from FASHN.' }));
  return NextResponse.json(data, { status: fashnRes.status });
}
