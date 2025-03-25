'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function SuccessPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/signin');
        return;
      }

      if (!sessionId) {
        setError('No session ID found');
        setLoading(false);
        return;
      }

      // Verify the session (optional but recommended)
      const verifySession = async () => {
        try {
          const response = await fetch('/api/verify-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
          });

          if (!response.ok) {
            throw new Error('Failed to verify session');
          }

          // Redirect to account page after a short delay
          setTimeout(() => {
            router.push('/account');
          }, 5000);
        } catch (err) {
          console.error('Error verifying session:', err);
          setError('Failed to verify your subscription. Please contact support.');
        } finally {
          setLoading(false);
        }
      };

      verifySession();
    });

    return () => unsubscribe();
  }, [sessionId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 text-center">
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Processing Your Subscription
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Please wait while we confirm your payment...
            </p>
          </>
        ) : error ? (
          <>
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Something Went Wrong
            </h1>
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => router.push('/subscription')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Subscription Page
            </button>
          </>
        ) : (
          <>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Thank You for Subscribing!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your subscription has been processed successfully. You will be redirected to your account page shortly.
            </p>
            <button
              onClick={() => router.push('/account')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go to My Account
            </button>
          </>
        )}
      </div>
    </div>
  );
} 