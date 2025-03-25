import { stripe } from '@/lib/stripe/stripe';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
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

    // Handle different event types
    try {
      switch (event.type) {
        // Checkout session completed
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          // Make sure we have the necessary data
          if (session.client_reference_id && session.customer && session.subscription) {
            const userId = session.client_reference_id;
            const customerId = session.customer as string;
            const subscriptionId = session.subscription as string;
            
            console.log('Checkout completed:', {
              userId,
              customerId,
              subscriptionId
            });
            
            // Update user in database
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              subscriptionStatus: 'active',
              subscriptionTier: 'ultimate', // Adjust based on your tiers
              subscriptionStartDate: new Date().toISOString(),
            });
            
            console.log(`User ${userId} subscription activated`);
          }
          break;
        }
        
        // Subscription created or updated
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
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
          break;
        }
        
        // Subscription deleted/canceled
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          
          console.log('Subscription canceled:', {
            subscriptionId: subscription.id,
            customerId
          });
          
          // Find user by customer ID
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('stripeCustomerId', '==', customerId));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userId = userDoc.id;
            
            // Update subscription status
            await updateDoc(doc(db, 'users', userId), {
              subscriptionStatus: 'canceled',
              subscriptionEndDate: new Date().toISOString(),
            });
            
            console.log(`User subscription canceled: ${userId}`);
          } else {
            console.log(`No user found with customer ID: ${customerId}`);
          }
          break;
        }
        
        // Invoice payment succeeded
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.subscription && invoice.customer) {
            const subscriptionId = invoice.subscription as string;
            const customerId = invoice.customer as string;
            
            console.log(`Payment succeeded for subscription: ${subscriptionId}`);
            
            // Find user by customer ID
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('stripeCustomerId', '==', customerId));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              const userId = userDoc.id;
              
              // Update last payment date
              await updateDoc(doc(db, 'users', userId), {
                lastPaymentDate: new Date().toISOString(),
                paymentStatus: 'succeeded'
              });
              
              console.log(`Updated payment status for user: ${userId}`);
            }
          }
          break;
        }
        
        // Invoice payment failed
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.subscription && invoice.customer) {
            const subscriptionId = invoice.subscription as string;
            const customerId = invoice.customer as string;
            
            console.log(`Payment failed for subscription: ${subscriptionId}`);
            
            // Find user by customer ID
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('stripeCustomerId', '==', customerId));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              const userId = userDoc.id;
              
              // Update payment status
              await updateDoc(doc(db, 'users', userId), {
                paymentStatus: 'failed',
                paymentFailedDate: new Date().toISOString()
              });
              
              console.log(`Updated payment failure for user: ${userId}`);
              
              // Here you could also implement logic to notify the user about the failed payment
            }
          }
          break;
        }
        
        // Customer created
        case 'customer.created': {
          const customer = event.data.object as Stripe.Customer;
          console.log(`New customer created: ${customer.id}`);
          // You might want to store this in your database or take other actions
          break;
        }
        
        // Default case for other events
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      
      return NextResponse.json({ received: true });
    } catch (error: any) {
      console.error('Error processing webhook event:', error.message, error.stack);
      return NextResponse.json(
        { error: `Event processing error: ${error.message}` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Webhook error:', error.message, error.stack);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

// This is important for Next.js to know not to parse the body
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';