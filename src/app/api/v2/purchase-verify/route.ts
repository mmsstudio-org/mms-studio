import { NextRequest, NextResponse } from 'next/server';
import { 
  getPurchaseByTxnId, 
  getCoupon, 
  addCoupon, 
  updateCoupon,
  updatePurchaseRedeemedStatus
} from '@/lib/firestore-service';

/**
 * POST /api/v2/purchase-verify
 * Example Body:
  {
    "txnId": "DGM9LRKWL3",
    "amount": 10,
    // below fields are optional...
    "note": "hi this is the note",
    "credits": 1000,
    "show_ads": false,
    "validity_days": 30, // as day count
    "pkg": "com.mms.app"
  }
 */

/**
 * @api {post} /api/v2/purchase-verify Verify Purchase & Issue/Redeem Coupon (v2)
 * @apiDescription Verifies a payment transaction from database by unique Txn ID (O(1) direct lookup), checks redemption status first, matches paid amount, and issues/redeems coupons.
 * 
 * @apiBody {String} txnId The unique transaction ID (e.g., "DGM9LRKWL3") [Required]
 * @apiBody {Number} amount The requested item price/amount to match [Required]
 * @apiBody {String} [note] Optional note or redeemer identifier
 * @apiBody {Number} [credit] Optional credit/coin amount to issue (Default: 0)
 * @apiBody {Boolean} [show_ads] Optional ad visibility override (Default: true)
 * @apiBody {Number} [validity_days] Optional validity in days (e.g. 30) 
 * @apiBody {String} [pkg] Optional app package identifier restriction
 * 
 * @apiSuccess (200 OK) {Boolean} success Indicates request success
 * @apiSuccess (200 OK) {String} message Status message
 * @apiSuccess (200 OK) {Object} data Coupon metadata details
 * 
 * @apiError (400 Bad Request) MissingParameters Required parameters are missing
 * @apiError (400 Bad Request) AlreadyRedeemed The transaction / coupon has already been redeemed or expired
 * @apiError (400 Bad Request) AmountMismatch Paid amount is less than requested amount
 * @apiError (400 Bad Request) PkgMismatch Coupon was purchased for a different package
 * @apiError (404 Not Found) InvalidTransaction The transaction ID does not exist in payment_sms
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { txnId, amount, note, credit, show_ads, showAds, validity_days, pkg } = body;

    // 1. Validate Required Inputs
    if (!txnId) {
      return NextResponse.json({ success: false, message: 'Transaction ID (txnId) is required.' }, { status: 400 });
    }
    if (amount === undefined || amount === null) {
      return NextResponse.json({ success: false, message: 'Amount is required.' }, { status: 400 });
    }

    const requestedAmount = Number(amount);
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Amount must be a positive number.' }, { status: 400 });
    }

    const normalizedTxnId = String(txnId).trim().toUpperCase();

    // 2. Direct O(1) Lookup for Purchase Record by Txn ID
    const purchaseRecord = await getPurchaseByTxnId(normalizedTxnId);
    if (!purchaseRecord) {
      return NextResponse.json({ success: false, message: 'Invalid Transaction ID or Try Again After Sometimes! 🙁' }, { status: 404 });
    }

    const paidAmount = Number(purchaseRecord.amount);

    // 3. Check Transaction Redeemed Status & Coupon Usage FIRST
    let existingCouponToRedeem: any = null;

    if (purchaseRecord.is_redeemed) {
      const existingCoupon = await getCoupon(normalizedTxnId);
      
      if (!existingCoupon) {
        return NextResponse.json({ 
          success: false, 
          message: 'This transaction has already been redeemed.' 
        }, { status: 400 });
      }

      // Check if coupon is expired
      if (existingCoupon.validity && existingCoupon.validity < Date.now()) {
        return NextResponse.json({ 
          success: false, 
          message: 'This transaction coupon has expired.' 
        }, { status: 400 });
      }

      // Check if coupon has already been used
      const isAlreadyUsed = existingCoupon.redeem_count >= (existingCoupon.redeem_limit ?? 1);
      if (isAlreadyUsed) {
        return NextResponse.json({ 
          success: false, 
          message: 'This transaction ID has already been redeemed.' 
        }, { status: 400 });
      }

      // Hold unused existing coupon for redemption after amount verification
      existingCouponToRedeem = existingCoupon;
    }

    // 4. Amount Verification (Paid amount must be >= requested amount)
    if (paidAmount < requestedAmount) {
      return NextResponse.json({
        success: false,
        message: `Amount mismatch: The paid amount (৳${paidAmount}) is less than the requested amount (৳${requestedAmount}).`,
        paidAmount: paidAmount
      }, { status: 400 });
    }

    // 5. Case A: Purchase was marked redeemed, but has an unused valid coupon -> Redeem it now
    if (existingCouponToRedeem) {
      // Validate pkg match if the coupon was purchased for a specific package
      const couponPkg = existingCouponToRedeem.pkg ? String(existingCouponToRedeem.pkg).trim() : null;
      const requestPkg = pkg ? String(pkg).trim() : null;
      if (couponPkg && couponPkg !== requestPkg) {
        return NextResponse.json({
          success: false,
          message: 'This coupon is not valid for this service, it\'s purchased for another one. Please use it where you purchased it.'
        }, { status: 400 });
      }

      const updatedNote = note 
        ? `${existingCouponToRedeem.note || ''} | Redeemed By ⇒ ${note}`.trim()
        : existingCouponToRedeem.note;

      await updateCoupon(existingCouponToRedeem.id, {
        redeem_count: existingCouponToRedeem.redeem_count + 1,
        ...(updatedNote ? { note: updatedNote } : {})
      });

      const validityMs = existingCouponToRedeem.validity;
      const remainingDays = Math.max(1, Math.round((validityMs - Date.now()) / (24 * 60 * 60 * 1000)));

      return NextResponse.json({
        success: true,
        message: 'Transaction verified and existing coupon marked as redeemed.',
        data: {
          txn: existingCouponToRedeem.code,
          credit: existingCouponToRedeem.coins,
          show_ads: existingCouponToRedeem.show_ads,
          validity_millis: validityMs,
          valid_days: remainingDays,
          validity_date: formatValidityDate(validityMs),
        }
      });
    }

    // 6. Case B: Unredeemed Purchase -> Create new coupon & mark purchase as redeemed
    const finalCredit = credit !== undefined && credit !== null && !isNaN(Number(credit)) ? Number(credit) : 0;
    const parsedShowAds = show_ads !== undefined && show_ads !== null ? Boolean(show_ads) : (showAds !== undefined && showAds !== null ? Boolean(showAds) : true);

    // validity_days is provided as a day count
    let finalValidityDays: number;
    if (validity_days !== undefined && validity_days !== null && !isNaN(Number(validity_days))) {
      finalValidityDays = Math.floor(Number(validity_days));
    } else {
      finalValidityDays = 30; // 30 days default
    }

    const finalValidityMs = Date.now() + finalValidityDays * 24 * 60 * 60 * 1000;

    const finalPkg = pkg ? String(pkg).trim() : null;
    const couponNote = note 
      ? `Purchased via API (৳${requestedAmount}) | Redeemed By ⇒ ${note}`
      : `Purchased via API (৳${requestedAmount})`;

    const newCoupon = {
      code: normalizedTxnId,
      validity: finalValidityMs,
      coins: finalCredit,
      type: 'single' as const,
      show_ads: parsedShowAds,
      note: couponNote,
      created: Date.now(),
      redeem_count: 1, // Created pre-marked as used
      redeem_limit: 1,
      pkg: finalPkg,
    };

    await addCoupon(newCoupon);
    await updatePurchaseRedeemedStatus(purchaseRecord.id, true);

    return NextResponse.json({
      success: true,
      message: 'Transaction verified and redeemed successfully.',
      data: {
        txn: newCoupon.code,
        credit: newCoupon.coins,
        show_ads: newCoupon.show_ads,
        validity_millis: finalValidityMs,
        valid_days: finalValidityDays,
        validity_date: formatValidityDate(finalValidityMs),
      }
    });

  } catch (error) {
    console.error('Error in v2 purchase verify route:', error);
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}

function formatValidityDate(validityMs: number): string {
  const date = new Date(validityMs);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = String(date.getDate()).padStart(2, '0');
  return `${months[date.getMonth()]} ${day} ${date.getFullYear()}`;
}

// Block non-POST HTTP methods
const methodNotAllowed = () => 
  NextResponse.json({ success: false, message: 'Method Not Allowed' }, { status: 405 });

export async function GET() { return methodNotAllowed(); }
export async function PUT() { return methodNotAllowed(); }
export async function DELETE() { return methodNotAllowed(); }
export async function PATCH() { return methodNotAllowed(); }