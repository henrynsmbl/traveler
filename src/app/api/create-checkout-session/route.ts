import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/stripe';

export async function POST(request: Request) {
  try {
    const { price_id, userId, email } = await request.json();

    if (!price_id || !userId || !email) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create a new customer or retrieve existing one
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      // Update metadata if needed
      if (!customer.metadata.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { userId: userId },
        });
      }
    } else {
      // Create a new customer with metadata
      customer = await stripe.customers.create({
        email: email,
        metadata: { userId: userId },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
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
    });

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