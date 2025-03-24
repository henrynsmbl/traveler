import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia',
  timeout: 30000,
});

// Client-side Stripe initialization
export const getStripe = async () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('Missing Stripe Publishable Key');
  }
  
  const { loadStripe } = await import('@stripe/stripe-js');
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
};