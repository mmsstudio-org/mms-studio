import { NextRequest, NextResponse } from 'next/server';
import { getUserByUid } from '@/lib/firestore-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({ success: false, message: 'UID parameter is required.' }, { status: 400 });
  }

  try {
    const user = await getUserByUid(uid);

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        uid: user.uid,
        email: user.email,
        device: user.device || null,
        fcmToken: user.fcmToken || null,
        // lastLogin: user.lastLogin || null,
      },
    });
  } catch (error) {
    console.error('Error in user API route:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
