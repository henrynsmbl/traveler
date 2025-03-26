import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/stripe';

export async function POST(request: Request) {
  try {
    const { couponCode, email } = await request.json();

    if (!couponCode) {
      return NextResponse.json(
        { error: 'Missing coupon code' },
        { status: 400 }
      );
    }

    // Validate origin - more permissive for development
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_BASE_URL,
      'https://www.aitinerary.world',
      'http://localhost:3000',
      'http://localhost:3001'
    ];

    if (!origin || !allowedOrigins.includes(origin)) {
      return NextResponse.json(
        { error: 'Invalid origin' },
        { status: 403 }
      );
    }

    // Try to find the coupon in Stripe
    try {
      // Check if it's a direct coupon ID
      try {
        const coupon = await stripe.coupons.retrieve(couponCode);
        if (coupon && coupon.valid) {
          return NextResponse.json({
            valid: true,
            discount: coupon.percent_off 
              ? `${coupon.percent_off}% off` 
              : coupon.amount_off 
                ? `$${(coupon.amount_off / 100).toFixed(2)} off` 
                : 'Discount applied'
          });
        }
      } catch (error) {
        // Not a direct coupon ID, try promotion code
      }

      // Check if it's a promotion code
      const promotionCodes = await stripe.promotionCodes.list({
        code: couponCode,
        active: true,
        limit: 1,
      });

      if (promotionCodes.data.length > 0) {
        const promoCode = promotionCodes.data[0];
        if (promoCode.active && promoCode.coupon.valid) {
          const coupon = promoCode.coupon;
          
          // Check for first-time transaction restriction
          if (promoCode.restrictions && promoCode.restrictions.first_time_transaction && email) {
            // Check if customer exists with transactions
            const customers = await stripe.customers.list({ email, limit: 1 });
            if (customers.data.length > 0) {
              const customer = customers.data[0];
              
              // Check if customer has any invoices/charges
              const invoices = await stripe.invoices.list({ customer: customer.id, limit: 1 });
              const charges = await stripe.charges.list({ customer: customer.id, limit: 1 });
              
              if (invoices.data.length > 0 || charges.data.length > 0) {
                return NextResponse.json({
                  valid: false,
                  error: 'This promotion code cannot be redeemed because you have prior transactions'
                });
              }
            }
          }
          
          return NextResponse.json({
            valid: true,
            discount: coupon.percent_off 
              ? `${coupon.percent_off}% off` 
              : coupon.amount_off 
                ? `$${(coupon.amount_off / 100).toFixed(2)} off` 
                : 'Discount applied'
          });
        }
      }

      // If we get here, the coupon is not valid
      return NextResponse.json({
        valid: false,
        error: 'Invalid or expired coupon code'
      });
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      return NextResponse.json({
        valid: false,
        error: 'Error validating coupon'
      });
    }
  } catch (error: any) {
    console.error('Error in validate-coupon API:', error);
    return NextResponse.json(
      { error: error.message || 'Error validating coupon' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 