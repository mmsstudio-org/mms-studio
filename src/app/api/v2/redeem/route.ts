import { NextRequest, NextResponse } from 'next/server';
import { getCoupon, updateCoupon } from '@/lib/firestore-service';

/**
 * GET /api/v2/redeem?code=COUPON123&note=user&pkg=com.mms.app
 */

/**
 * @api {get} /api/v2/redeem Redeem a Coupon (v2)
 * @apiDescription Redeems a coupon code and returns credit details.
 * 
 * @apiQuery {String} code The coupon code to redeem [Required]
 * @apiQuery {String} [note] Optional redeemer identifier
 * @apiQuery {String} [pkg] Optional app package restriction
 * 
 * @apiSuccess (200 OK) {Boolean} success Indicates request success
 * @apiSuccess (200 OK) {Object} data Coupon details
 * 
 * @apiError (400 Bad Request) InvalidParams Missing or invalid parameters
 * @apiError (403 Forbidden) PkgMismatch Coupon not valid for this package
 * @apiError (404 Not Found) InvalidCoupon Coupon code does not exist
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const note = searchParams.get('note');
  const pkg = searchParams.get('pkg');

  if (!code) {
    return NextResponse.json({ success: false, message: 'Coupon code is required.' }, { status: 400 });
  }

  const couponCode = code.toUpperCase();

  try {
    const coupon = await getCoupon(couponCode);

    if (!coupon) {
      return NextResponse.json({ success: false, message: 'Invalid coupon code.' }, { status: 404 });
    }

    // Check package name if required
    if (coupon.pkg && coupon.pkg !== pkg) {
      return NextResponse.json({ success: false, message: 'This coupon is not valid for this application.' }, { status: 403 });
    }

    // Check validity
    if (coupon.validity < Date.now()) {
      return NextResponse.json({ success: false, message: 'This coupon has expired.' }, { status: 400 });
    }

    // Check usage limit
    switch (coupon.type) {
      case 'single':
        if (coupon.redeem_count >= 1) {
          return NextResponse.json({ success: false, message: 'This coupon has already been redeemed.' }, { status: 400 });
        }
        break;
      case 'certain amount':
        if (coupon.redeem_limit !== null && coupon.redeem_count >= coupon.redeem_limit) {
          return NextResponse.json({ success: false, message: 'This coupon has reached its redemption limit.' }, { status: 400 });
        }
        break;
      case 'multiple':
        // No usage limit check, just time validity
        break;
      default:
        return NextResponse.json({ success: false, message: 'Invalid coupon type.' }, { status: 500 });
    }

    // Prepare data for update
    const updateData: { redeem_count: number; note?: string } = {
      redeem_count: coupon.redeem_count + 1,
    };

    // Append note if provided for single-use coupons
    if (note && coupon.type === 'single') {
      const prevNote = coupon.note || '';
      const newNote = `${prevNote}, | Redeemed By ⇒ ${note}`;
      updateData.note = newNote.trim();
    }

    // Increment redeem_count and potentially update note
    await updateCoupon(coupon.id, updateData);

    const validityMs = coupon.validity;
    const remainingDays = Math.max(1, Math.round((validityMs - Date.now()) / (24 * 60 * 60 * 1000)));

    return NextResponse.json({
      success: true,
      data: {
        txn: coupon.code,
        credits: coupon.coins,
        show_ads: coupon.show_ads,
        validity_millis: validityMs,
        valid_days: remainingDays,
        validity_date: formatValidityDate(validityMs),
      },
    });
  } catch (error) {
    console.error('Error redeeming coupon (v2):', error);
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}

function formatValidityDate(validityMs: number): string {
  const date = new Date(validityMs);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = String(date.getDate()).padStart(2, '0');
  return `${months[date.getMonth()]} ${day} ${date.getFullYear()}`;
}

// Block non-GET HTTP methods
const methodNotAllowed = () =>
  NextResponse.json({ success: false, message: 'Method Not Allowed' }, { status: 405 });

export async function POST() { return methodNotAllowed(); }
export async function PUT() { return methodNotAllowed(); }
export async function DELETE() { return methodNotAllowed(); }
export async function PATCH() { return methodNotAllowed(); }