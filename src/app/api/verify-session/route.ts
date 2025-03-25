import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/stripe';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      );
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get the user ID from the session
    const userId = session.client_reference_id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No user ID associated with this session' },
        { status: 400 }
      );
    }

    // Get the subscription details
    const subscription = session.subscription;
    
    if (!subscription || typeof subscription === 'string') {
      return NextResponse.json(
        { error: 'No subscription found for this session' },
        { status: 400 }
      );
    }

    // Update the user's subscription in Firebase
    const userRef = doc(db, 'users', userId);
    
    // First update just the subscription object to comply with your rules
    await setDoc(userRef, {
      subscription: {
        status: subscription.status,
        plan: subscription.items.data[0].price.id,
        currentPeriodEnd: subscription.current_period_end,
        customerId: session.customer,
        subscriptionId: subscription.id,
        createdAt: subscription.created,
        updatedAt: Date.now()
      }
    }, { merge: true });
    
    console.log(`Successfully updated subscription for user ${userId}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify session' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 