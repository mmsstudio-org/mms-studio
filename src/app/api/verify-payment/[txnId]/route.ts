
import { NextRequest, NextResponse } from 'next/server';

// This route acts as a proxy to the external payment verification API
// to bypass browser CORS restrictions.

export async function GET(
  request: NextRequest,
  { params }: { params: { txnId: string } }
) {
  const { txnId } = params;
  const apiKey = request.nextUrl.searchParams.get('apiKey');
  const baseUrl = request.nextUrl.searchParams.get('baseUrl');

  if (!apiKey || !baseUrl) {
    return NextResponse.json({ error: 'Missing API key or base URL' }, { status: 400 });
  }

  const externalUrl = `${baseUrl}/api/payment/${txnId}?apiKey=${apiKey}`;

  try {
    const apiResponse = await fetch(externalUrl);
    const data = await apiResponse.json();
    return NextResponse.json(data, { status: apiResponse.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch from external API' }, { status: 500 });
  }
}


export async function PUT(
  request: NextRequest,
  { params }: { params: { txnId: string } }
) {
    const { txnId } = params;
    const apiKey = request.nextUrl.searchParams.get('apiKey');
    const baseUrl = request.nextUrl.searchParams.get('baseUrl');

    if (!apiKey || !baseUrl) {
        return NextResponse.json({ error: 'Missing API key or base URL' }, { status: 400 });
    }

    const externalUrl = `${baseUrl}/api/payment/${txnId}?apiKey=${apiKey}`;

    try {
        const apiResponse = await fetch(externalUrl, { method: 'PUT' });
        const data = await apiResponse.json();
        return NextResponse.json(data, { status: apiResponse.status });
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json({ error: 'Failed to fetch from external API' }, { status: 500 });
    }
}
