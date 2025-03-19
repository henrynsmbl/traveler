'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';

interface SubscribeButtonProps {
  priceId: string;
}

export default function SubscribeButton({ priceId }: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [lastClick, setLastClick] = useState(0);

  const handleSubscribe = async () => {
    const now = Date.now();
    if (now - lastClick < 1000) {
      return;
    }
    setLastClick(now);

    try {
      if (!user || !user.email) {
        console.error('User not authenticated');
        return;
      }

      if (!priceId?.trim()) {
        throw new Error('Invalid price ID');
      }

      setLoading(true);
      
      const requestData = {
        price_id: priceId,
        email: user.email,
        userId: user.uid,
      };

      console.log('Sending request with:', requestData); // Debug log

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error: ${errorData.error || 'Unknown error'}`);
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading || !user}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {loading ? 'Loading...' : 'Subscribe'}
    </button>
  );
}