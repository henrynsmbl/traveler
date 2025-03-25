import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/stripe';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    // Add CORS protection
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*', // For development
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Validate origin - more permissive for development
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_BASE_URL,
      'https://aitinerary.world',
      'https://www.aitinerary.world',
      'http://localhost:3000',
      'http://localhost:3001'
    ];

    if (!origin || !allowedOrigins.includes(origin)) {
      console.log('Invalid origin:', origin); // For debugging
      console.log('Allowed origins:', allowedOrigins);
      return NextResponse.json(
        { error: 'Invalid origin' },
        { status: 403 }
      );
    }

    const { customerId, returnUrl } = await request.json();
    
    // Validate returnUrl more permissively for development
    if (returnUrl && !allowedOrigins.some(allowed => returnUrl.startsWith(allowed))) {
      return NextResponse.json(
        { error: 'Invalid return URL' },
        { status: 400 }
      );
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing customerId' },
        { status: 400 }
      );
    }

    console.log('Creating portal session for customer:', customerId);

    const baseUrl = request.headers.get('origin') || 'http://localhost:3000';
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${baseUrl}/`,
    });

    console.log('Created portal session:', portalSession);

    if (!portalSession.url) {
      throw new Error('No URL in portal session response');
    }

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: error.message || 'Error creating portal session' },
      { status: 500 }
    );
  }
} 