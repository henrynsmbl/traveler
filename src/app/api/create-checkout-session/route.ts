import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/stripe';
import Stripe from 'stripe';

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-01-27.acacia',
});

export async function POST(request: Request) {
  try {
    const { price_id, userId, email, couponCode } = await request.json();

    if (!price_id || !userId || !email) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create a new customer or retrieve existing one
    let customer;
    const existingCustomers = await stripeInstance.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      // Update metadata if needed
      if (!customer.metadata.userId) {
        await stripeInstance.customers.update(customer.id, {
          metadata: { userId: userId },
        });
      }
    } else {
      // Create a new customer with metadata
      customer = await stripeInstance.customers.create({
        email: email,
        metadata: { userId: userId },
      });
    }

    // Create checkout session options
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      customer: customer.id,
      client_reference_id: userId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
    };

    // If a coupon code was provided, validate and apply it
    if (couponCode) {
      try {
        // Verify the coupon exists and is valid
        const coupons = await stripeInstance.coupons.list({
          limit: 100,
        });
        
        const promotionCodes = await stripeInstance.promotionCodes.list({
          code: couponCode,
          active: true,
          limit: 1,
        });

        // Check if it's a direct coupon ID or a promotion code
        if (coupons.data.some(coupon => coupon.id === couponCode)) {
          // It's a direct coupon ID
          sessionOptions.discounts = [{ coupon: couponCode }];
        } else if (promotionCodes.data.length > 0) {
          // It's a promotion code
          const promoCode = promotionCodes.data[0];
          
          // Check for first-time transaction restriction
          if (promoCode.restrictions && promoCode.restrictions.first_time_transaction) {
            // Check if customer has prior transactions
            const invoices = await stripeInstance.invoices.list({ 
              customer: customer.id, 
              limit: 1 
            });
            
            const charges = await stripeInstance.charges.list({ 
              customer: customer.id, 
              limit: 1 
            });
            
            if (invoices.data.length > 0 || charges.data.length > 0) {
              return NextResponse.json(
                { error: 'This promotion code cannot be redeemed because you have prior transactions' },
                { status: 400 }
              );
            }
          }
          
          sessionOptions.discounts = [{ promotion_code: promoCode.id }];
        } else {
          return NextResponse.json(
            { error: 'Invalid or expired coupon code' },
            { status: 400 }
          );
        }
      } catch (couponError: any) {
        console.error('Error validating coupon:', couponError);
        
        // Check for specific error message about prior transactions
        if (couponError.message && couponError.message.includes('prior transactions')) {
          return NextResponse.json(
            { error: 'This promotion code cannot be redeemed because you have prior transactions' },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { error: 'Error validating coupon code' },
          { status: 400 }
        );
      }
    }

    // Create checkout session
    const session = await stripeInstance.checkout.sessions.create(sessionOptions);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';