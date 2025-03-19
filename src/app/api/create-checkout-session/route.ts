import { NextResponse } from 'next/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia'
});

export async function POST(request: Request) {
  try {
    const { price_id, userId, email } = await request.json();
    
    // Get base URL from the request
    const baseUrl = request.headers.get('origin') || 'http://localhost:3000';

    console.log('Creating checkout session with:', { price_id, userId, email });

    if (!price_id) {
      return NextResponse.json(
        { error: 'Missing price_id' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email' },
        { status: 400 }
      );
    }

    // Create or get customer
    let customer;
    const customers = await stripe.customers.list({ email });
    
    if (customers.data.length > 0) {
      customer = customers.data[0];
      // Update metadata if needed
      if (!customer.metadata.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { userId }
        });
      }
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: { userId }
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe API Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}