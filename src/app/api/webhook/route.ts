import { stripe } from '@/lib/stripe/stripe';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { updateUserSubscription } from '@/lib/firebase/subscription';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;
    console.log('Webhook received:', { signature });

    if (!webhookSecret) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET');
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Error constructing webhook event:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Log the full event for debugging
    console.log('Full event:', JSON.stringify(event, null, 2));

    if (event.type === 'customer.subscription.created' || 
        event.type === 'customer.subscription.updated') {
      try {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        console.log('Processing subscription:', {
          subscriptionId: subscription.id,
          customerId,
          status: subscription.status,
          priceId: subscription.items.data[0].price.id
        });

        const customer = await stripe.customers.retrieve(customerId);
        console.log('Customer data:', JSON.stringify(customer, null, 2));
        
        if ('deleted' in customer) {
          throw new Error('Customer was deleted');
        }

        const userId = customer.metadata.userId;
        console.log('User ID from metadata:', userId);

        if (!userId) {
          throw new Error('No userId found in customer metadata');
        }

        const subscriptionData = {
          status: subscription.status as 'active' | 'canceled' | 'past_due' | 'unpaid',
          plan: subscription.items.data[0].price.id,
          currentPeriodEnd: subscription.current_period_end,
          customerId: customerId,
          subscriptionId: subscription.id,
          createdAt: subscription.created,
          updatedAt: Date.now()
        };

        console.log('Attempting to update user subscription:', {
          userId,
          subscriptionData
        });

        await updateUserSubscription(userId, subscriptionData);
        console.log('Successfully updated subscription in Firebase');

        // Verify the update
        const userRef = doc(db, 'users', userId);
        const updatedDoc = await getDoc(userRef);
        console.log('Verified Firebase update:', updatedDoc.data());

      } catch (error: any) {
        console.error('Error processing subscription:', error.message, error.stack);
        return NextResponse.json(
          { error: `Subscription processing error: ${error.message}` },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message, error.stack);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 400 }
    );
  }
}