// This route is deprecated and has been replaced by /api/redeem.
import {NextResponse} from 'next/server';

export async function GET() {
  return NextResponse.json({error: 'This endpoint is deprecated.'}, {status: 404});
}

export async function POST() {
  return NextResponse.json({error: 'This endpoint is deprecated.'}, {status: 404});
}
