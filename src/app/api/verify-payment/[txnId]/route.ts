// This route is deprecated and has been replaced by the purchase modal logic.
import {NextResponse} from 'next/server';

export async function GET() {
  return NextResponse.json({error: 'This endpoint is deprecated.'}, {status: 404});
}

export async function PUT() {
  return NextResponse.json({error: 'This endpoint is deprecated.'}, {status: 404});
}
