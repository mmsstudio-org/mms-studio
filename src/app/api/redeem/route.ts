
import {NextRequest, NextResponse} from 'next/server';
import {getCoupon, updateCoupon} from '@/lib/firestore-service';

export async function GET(request: NextRequest) {
  const {searchParams} = new URL(request.url);
  const code = searchParams.get('code');
  const note = searchParams.get('note');
  const pkg = searchParams.get('pkg');

  if (!code) {
    return NextResponse.json({success: false, message: 'Coupon code is required.'}, {status: 400});
  }

  const couponCode = code.toUpperCase();

  try {
    const coupon = await getCoupon(couponCode);

    if (!coupon) {
      return NextResponse.json({success: false, message: 'Invalid coupon code.'}, {status: 404});
    }

    // Check package name if required
    if (coupon.pkg && coupon.pkg !== pkg) {
        return NextResponse.json({success: false, message: 'This coupon is not valid for this application.'}, {status: 403});
    }
    
    // Check validity
    if (coupon.validity < Date.now()) {
      return NextResponse.json({success: false, message: 'This coupon has expired.'}, {status: 400});
    }

    // Check usage limit
    switch (coupon.type) {
      case 'single':
        if (coupon.redeem_count >= 1) {
          return NextResponse.json({success: false, message: 'This coupon has already been redeemed.'}, {status: 400});
        }
        break;
      case 'certain amount':
        if (coupon.redeem_limit !== null && coupon.redeem_count >= coupon.redeem_limit) {
          return NextResponse.json({success: false, message: 'This coupon has reached its redemption limit.'}, {status: 400});
        }
        break;
      case 'multiple':
        // No usage limit check, just time validity
        break;
      default:
        return NextResponse.json({success: false, message: 'Invalid coupon type.'}, {status: 500});
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

    const validityDate = new Date(coupon.validity);
    
    // Adjust for BDT (UTC+6)
    const bdtOffset = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
    const bdtDate = new Date(validityDate.getTime() + bdtOffset);
    
    const validityISOString = bdtDate.toISOString().slice(0, 19);


    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        coin_amount: coupon.coins,
        show_ad: coupon.show_ads,
        validity: validityISOString,
        validity_millis: coupon.validity,
      },
    });
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    return NextResponse.json({success: false, message: 'An internal server error occurred.'}, {status: 500});
  }
}
