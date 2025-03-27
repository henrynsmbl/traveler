import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { updateUserSubscription } from '@/lib/firebase/subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-01-27.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function GET() {
  return new Response('Webhook endpoint is working. Please use POST requests for webhooks.', {
    status: 200,
  });
}

export async function POST(request: Request) {
  try {
    console.log("Webhook received at:", new Date().toISOString());
    console.log("Request URL:", request.url);
    console.log("Webhook POST request received");
    const body = await request.text();
    console.log("Request body length:", body.length);
    
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');
    console.log('Webhook signature:', signature);

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
            await setDoc(userRef, {
              subscription: {
                status: 'active',
                plan: 'ultimate', // Hardcoded value
                currentPeriodEnd: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // Estimated value
                customerId: customerId,
                subscriptionId: subscriptionId,
                createdAt: Math.floor(Date.now() / 1000),
                updatedAt: Math.floor(Date.now() / 1000)
              }
            }, { merge: true });
            
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
            updatedAt: Math.floor(Date.now() / 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            canceledAt: subscription.canceled_at,
          };

          console.log('Attempting to update user subscription:', {
            userId,
            subscriptionData
          });

          try {
            await updateUserSubscription(userId, subscriptionData);
            console.log("Subscription update successful");
          } catch (dbError) {
            console.error("Subscription update failed:", dbError);
            // Continue processing - don't let DB errors fail the webhook
          }
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
          const q = query(usersRef, where('subscription.customerId', '==', customerId));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userId = userDoc.id;
            
            // Update subscription status
            await setDoc(doc(db, 'users', userId), {
              subscription: {
                status: 'canceled',
                updatedAt: Math.floor(Date.now() / 1000)
              }
            }, { merge: true });
            
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
            console.log('Invoice details:', JSON.stringify(invoice, null, 2));
            
            try {
              // Get the subscription details to update the user record
              const subscription = await stripe.subscriptions.retrieve(subscriptionId);
              console.log('Subscription details:', JSON.stringify(subscription, null, 2));
              
              // Find user by customer ID
              const usersRef = collection(db, 'users');
              const q = query(usersRef, where('subscription.customerId', '==', customerId));
              const querySnapshot = await getDocs(q);
              
              if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userId = userDoc.id;
                console.log(`Found user ${userId} for customer ${customerId}`);
                
                // Prepare subscription data
                const subscriptionData = {
                  status: subscription.status as 'active' | 'canceled' | 'past_due' | 'unpaid',
                  plan: subscription.items.data[0].price.id,
                  currentPeriodEnd: subscription.current_period_end,
                  customerId: customerId,
                  subscriptionId: subscriptionId,
                  createdAt: subscription.created,
                  updatedAt: Math.floor(Date.now() / 1000),
                  cancelAtPeriodEnd: subscription.cancel_at_period_end,
                  canceledAt: subscription.canceled_at,
                };
                
                console.log('Updating subscription with data:', subscriptionData);
                
                // Update subscription using the same function that works for other events
                await updateUserSubscription(userId, subscriptionData);
                
                // Additionally update payment-specific fields
                // Check if there's a discount that covers the entire amount
                const isFullyDiscounted = invoice.total === 0 && invoice.subtotal > 0;
                
                const paymentUpdateData: any = {
                  lastPaymentDate: new Date().toISOString(),
                  paymentStatus: 'succeeded',
                  lastInvoiceId: invoice.id,
                };
                
                // Add discount information if applicable
                if (isFullyDiscounted && invoice.discount) {
                  paymentUpdateData.discountApplied = true;
                  paymentUpdateData.discountType = invoice.discount.coupon.percent_off ? 'percent' : 'amount';
                  paymentUpdateData.discountValue = invoice.discount.coupon.percent_off || 
                                                   (invoice.discount.coupon.amount_off ? 
                                                    invoice.discount.coupon.amount_off / 100 : 0);
                  paymentUpdateData.discountName = invoice.discount.coupon.name || null;
                } else {
                  // Regular payment information
                  paymentUpdateData.lastPaymentAmount = invoice.amount_paid;
                  paymentUpdateData.lastPaymentCurrency = invoice.currency;
                }
                
                console.log('Updating payment info with:', paymentUpdateData);
                await updateDoc(doc(db, 'users', userId), paymentUpdateData);
                
                console.log(`Updated payment status for user: ${userId}`);
              } else {
                console.log(`No user found with customer ID: ${customerId}`);
              }
            } catch (error) {
              console.error(`Error processing invoice.payment_succeeded:`, error);
              // Continue processing - don't let errors fail the webhook
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
            
            try {
              // Find user by customer ID
              const usersRef = collection(db, 'users');
              const q = query(usersRef, where('subscription.customerId', '==', customerId));
              const querySnapshot = await getDocs(q);
              
              if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userId = userDoc.id;
                
                // Get failure reason safely using type assertion
                const invoiceWithError = invoice as any; // Use 'any' to bypass type checking
                const failureReason = invoiceWithError.last_payment_error?.message || 'Unknown reason';
                
                // Update payment-specific fields
                await updateDoc(doc(db, 'users', userId), {
                  paymentStatus: 'failed',
                  paymentFailedDate: new Date().toISOString(),
                  lastInvoiceId: invoice.id,
                  lastPaymentAttemptAmount: invoice.amount_due,
                  lastPaymentAttemptCurrency: invoice.currency,
                  paymentFailureReason: failureReason
                });
                
                console.log(`Updated payment failure for user: ${userId}`);
              }
            } catch (error) {
              console.error(`Error processing invoice.payment_failed:`, error);
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
      console.error(`Error processing ${event.type} event:`, error.message, error.stack);
      
      // Still return 200 to acknowledge receipt of the webhook
      // This prevents Stripe from retrying the webhook unnecessarily
      return NextResponse.json({ 
        received: true,
        warning: `Event processed with errors: ${error.message}`
      });
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
export const config = {
  api: {
    bodyParser: false,
  },
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';