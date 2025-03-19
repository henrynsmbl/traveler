import { stripe } from './stripe';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { UserProfile, StripeSubscription } from '@/types/user';

export const createCheckoutSession = async (
  userId: string,
  priceId: string,
  returnUrl: string
) => {
  try {
    // Get user profile
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() as UserProfile;

    let customerId = userData.stripeCustomerId;

    // If user doesn't have a Stripe customer ID, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email || undefined,
        metadata: {
          firebaseUID: userId
        }
      });
      customerId = customer.id;
      await updateDoc(userRef, { stripeCustomerId: customerId });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${returnUrl}?success=true`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: {
        firebaseUID: userId
      }
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export const getSubscription = async (userId: string): Promise<StripeSubscription | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() as UserProfile;

    if (!userData.stripeCustomerId) return null;

    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (!subscriptions.data.length) return null;

    const subscription = subscriptions.data[0];
    return {
      id: subscription.id,
      status: subscription.status,
      priceId: subscription.items.data[0].price.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  } catch (error) {
    console.error('Error getting subscription:', error);
    throw error;
  }
};

export const cancelSubscription = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() as UserProfile;

    if (!userData.subscription?.id) {
      throw new Error('No active subscription found');
    }

    await stripe.subscriptions.update(userData.subscription.id, {
      cancel_at_period_end: true
    });

    await updateDoc(userRef, {
      'subscription.cancelAtPeriodEnd': true
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};