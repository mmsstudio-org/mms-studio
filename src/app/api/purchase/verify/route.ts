import { NextRequest, NextResponse } from 'next/server';
import { 
  getPurchaseByTxnId, 
  getCoupon, 
  addCoupon, 
  updateCoupon,
  updatePurchaseRedeemedStatus
} from '@/lib/firestore-service';

/**
 * POST /api/purchase/verify
 * Example Body:
  {
    "txnId": "TXN123456789",
    "amount": 250,
    "note": "User 123",
    "coins": 1000,
    "show_ads": false,
    "validity": 30,
    "pkg": "com.mms.app"
  }
 */


/**
 * @api {post} /api/purchase/verify Verify Purchase & Issue/Redeem Coupon
 * @apiDescription Verifies a payment transaction from database by unique Txn ID (O(1) direct lookup), matches paid amount, and issues or redeems single-use coupons.
 * 
 * @apiBody {String} txnId The unique transaction ID (e.g., "TXN123456789") [Required]
 * @apiBody {Number} amount The requested item price/amount to match [Required]
 * @apiBody {String} [note] Optional note or redeemer identifier
 * @apiBody {Number} [coins] Optional coin amount to issue (Default: 0)
 * @apiBody {Boolean} [show_ads] Optional ad visibility override (Default: true)
 * @apiBody {Number} [validity] Optional validity in days (e.g. 30) or timestamp in ms
 * @apiBody {String} [pkg] Optional app package identifier restriction
 * 
 * @apiSuccess (200 OK) {Boolean} success Indicates request success
 * @apiSuccess (200 OK) {String} message Status message
 * @apiSuccess (200 OK) {Object} data Coupon metadata details
 * 
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Verification and redemption successful.",
 *       "data": {
 *         "code": "TXN123456789",
 *         "coins": 500,
 *         "show_ads": false,
 *         "validity": 1786968000000
 *       }
 *     }
 * 
 * @apiError (400 Bad Request) MissingParameters Required parameters are missing
 * @apiError (400 Bad Request) AlreadyRedeemed The transaction / coupon has already been redeemed
 * @apiError (400 Bad Request) AmountMismatch Paid amount is less than requested amount
 * @apiError (404 Not Found) InvalidTransaction The transaction ID does not exist in payment_sms
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { txnId, amount, note, coins, show_ads, showAds, validity, pkg } = body;

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
      return NextResponse.json({ success: false, message: 'Invalid Transaction ID.' }, { status: 404 });
    }

    // 3. Amount Verification (Paid amount must be >= requested amount)
    const paidAmount = Number(purchaseRecord.amount);
    if (paidAmount < requestedAmount) {
      return NextResponse.json({
        success: false,
        message: `Amount mismatch: The paid amount (৳${paidAmount}) is less than the requested amount (৳${requestedAmount}).`,
        paidAmount: paidAmount
      }, { status: 400 });
    }

    // 4. Determine Optional Field Overrides & Fallbacks
    const finalCoins = coins !== undefined && coins !== null && !isNaN(Number(coins)) ? Number(coins) : 0;
    
    const parsedShowAds = show_ads !== undefined && show_ads !== null ? Boolean(show_ads) : (showAds !== undefined && showAds !== null ? Boolean(showAds) : true);

    let finalValidityMs: number;
    if (validity !== undefined && validity !== null && !isNaN(Number(validity))) {
      const numVal = Number(validity);
      // If greater than 10 billion, treat as ms timestamp; otherwise treat as duration in days
      finalValidityMs = numVal > 10000000000 ? numVal : Date.now() + numVal * 24 * 60 * 60 * 1000;
    } else {
      finalValidityMs = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days default
    }

    const finalPkg = pkg ? String(pkg).trim() : undefined;

    // 5. Check Transaction Redeemed Status
    if (purchaseRecord.is_redeemed) {
      // Check if existing coupon exists for this transaction ID
      const existingCoupon = await getCoupon(normalizedTxnId);
      
      // if no coupon exists for this transaction ID, return error
      // this situation may happen when the payment gateway doesn't create coupon
      // for this transaction or the coupon was deleted manually
      if (!existingCoupon) {
        return NextResponse.json({ 
          success: false, 
          message: 'This transaction has already been redeemed but the coupon does not exist.' 
        }, { status: 400 });
      }

      // If coupon exists, verify if it has already been used
      const isAlreadyUsed = existingCoupon.redeem_count >= (existingCoupon.redeem_limit ?? 1);
      if (isAlreadyUsed) {
        return NextResponse.json({ 
          success: false, 
          message: 'This transaction and coupon have already been redeemed.' 
        }, { status: 400 });
      }

      // Mark the unused existing coupon as used now
      const updatedNote = note 
        ? `${existingCoupon.note || ''} | Redeemed By ⇒ ${note}`.trim()
        : existingCoupon.note;

      await updateCoupon(existingCoupon.id, {
        redeem_count: existingCoupon.redeem_count + 1,
        ...(updatedNote ? { note: updatedNote } : {})
      });

      return NextResponse.json({
        success: true,
        message: 'Transaction verified and existing coupon marked as redeemed.',
        data: {
          code: existingCoupon.code,
          coins: existingCoupon.coins,
          show_ads: existingCoupon.show_ads,
          validity: existingCoupon.validity,
        }
      });
    }

    // 6. Branch: Purchase is NOT redeemed yet
    const couponNote = note 
      ? `Purchased via API (৳${requestedAmount}) | Redeemed By ⇒ ${note}`
      : `Purchased via API (৳${requestedAmount})`;

    const newCoupon = {
      code: normalizedTxnId,
      validity: finalValidityMs,
      coins: finalCoins,
      type: 'single' as const,
      show_ads: parsedShowAds,
      note: couponNote,
      created: Date.now(),
      redeem_count: 1, // Created pre-marked as used 1 time
      redeem_limit: 1,
      pkg: finalPkg,
    };

    // Save coupon & mark purchase as redeemed
    await addCoupon(newCoupon);
    await updatePurchaseRedeemedStatus(purchaseRecord.id, true);

    return NextResponse.json({
      success: true,
      message: 'Transaction verified and redeemed.',
      data: {
        code: newCoupon.code,
        coins: newCoupon.coins,
        show_ads: newCoupon.show_ads,
        validity: newCoupon.validity,
      }
    });

  } catch (error) {
    console.error('Error in purchase verify route:', error);
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}

// Block non-POST HTTP methods
const methodNotAllowed = () => 
  NextResponse.json({ success: false, message: 'Method Not Allowed' }, { status: 405 });

export async function GET() { return methodNotAllowed(); }
export async function PUT() { return methodNotAllowed(); }
export async function DELETE() { return methodNotAllowed(); }
export async function PATCH() { return methodNotAllowed(); }
