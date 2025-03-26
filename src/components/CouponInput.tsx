'use client';

import { useState } from 'react';
import { Tag, Check, AlertCircle } from 'lucide-react';
import { auth } from '@/lib/firebase/config';

interface CouponInputProps {
  onApply: (code: string) => void;
  disabled?: boolean;
}

export default function CouponInput({ onApply, disabled = false }: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [discountInfo, setDiscountInfo] = useState<string | null>(null);

  const handleApply = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setIsApplying(true);
    setError(null);
    setSuccess(false);
    setDiscountInfo(null);
    
    try {
      // Get current user email if available
      const userEmail = auth.currentUser?.email || null;
      
      // Validate the coupon with our API
      const response = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          couponCode: couponCode.trim(),
          email: userEmail
        }),
      });
      
      const data = await response.json();
      
      if (data.valid) {
        // Coupon is valid
        setSuccess(true);
        setDiscountInfo(data.discount);
        onApply(couponCode.trim());
      } else {
        // Coupon is invalid
        setError(data.error || 'Invalid coupon code');
      }
    } catch (err) {
      setError('Error validating coupon. Please try again.');
      console.error('Error validating coupon:', err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="mt-3 w-full bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800 transition-all duration-300">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">
          <Tag size={16} />
          <span>Promotional Code</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value);
              setError(null);
              setSuccess(false);
              setDiscountInfo(null);
            }}
            placeholder="Enter your code"
            disabled={disabled || isApplying || success}
            className="flex-grow px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          />
          <button
            onClick={handleApply}
            disabled={disabled || isApplying || success || !couponCode.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:hover:bg-blue-500"
          >
            {isApplying ? 'Validating...' : success ? 'Applied' : 'Apply'}
          </button>
        </div>
        
        {error && (
          <div className="mt-2 flex items-center gap-1.5 text-red-500">
            <AlertCircle size={14} />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mt-2 flex items-center gap-1.5 text-green-500">
            <Check size={14} />
            <div>
              <p className="text-sm font-medium">Coupon applied successfully!</p>
              {discountInfo && <p className="text-xs">{discountInfo}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 