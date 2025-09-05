
import { NextRequest, NextResponse } from 'next/server';

// This route acts as a proxy to the external coupon creation API
// to bypass browser CORS restrictions.

export async function POST(request: NextRequest) {
  const apiKey = request.nextUrl.searchParams.get('apiKey');
  const baseUrl = request.nextUrl.searchParams.get('baseUrl');
  const body = await request.json();

  if (!apiKey || !baseUrl) {
    return NextResponse.json({ error: 'Missing API key or base URL' }, { status: 400 });
  }

  const externalUrl = `${baseUrl}/api/bsc?apiKey=${apiKey}`;

  try {
    const apiResponse = await fetch(externalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await apiResponse.json();
    return NextResponse.json(data, { status: apiResponse.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch from external API' }, { status: 500 });
  }
}
