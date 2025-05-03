'use client'

import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { createCheckoutSession } from '@/lib/stripe/subscription'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import getStripe from '@/lib/stripe/client';
import SubscribeButton from '@/components/stripe/SubscribeButton';
import CouponInput from '@/components/CouponInput';

interface PricingTier {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  recommended?: boolean;
  priceId: {
    monthly: string;
    yearly: string;
  };
}

const pricingTiers: PricingTier[] = [
  {
    name: "Ultimate",
    monthlyPrice: 15,
    yearlyPrice: 165,
    features: [
      "AI suggestions and web crawl",
      "Book 3 itineraries per month",
      "Flight and hotel search",
      "Itinerary builder and planner",
      "Map integration"
    ],
    priceId: {
      monthly: "price_1R59roIzmoU5zafNovVMqvVK",
      yearly: "price_1R59roIzmoU5zafNJNxPLXN9",
      // STRIPE TEST MODE, this is not live products
      //monthly: "price_1R6cCnIzmoU5zafNi6o8v5lc",
      //yearly: "price_1R6cEUIzmoU5zafNHT5F2x9V"
    }
  }
]

export default function SubscriptionPage() {
  const [isYearly, setIsYearly] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [showCoupon, setShowCoupon] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthChecking(false)
    })

    return () => unsubscribe()
  }, [router])

  const handleSubscribe = async (tier: PricingTier) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        // Redirect to signin page if user is not authenticated
        router.push('/signin');
        return;
      }

      setIsLoading(true);
      const price_id = isYearly ? tier.priceId.yearly : tier.priceId.monthly;

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id,
          userId: user.uid,
          email: user.email,
          couponCode: couponCode
        }),
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
      console.error('Error creating checkout session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCoupon = (code: string) => {
    setCouponCode(code);
  };

  // Show loading state while checking authentication
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="animate-pulse text-xl text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-y-auto">
      <div className="pt-24 pb-32 sm:py-20 md:py-24 px-2 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 inline-block text-transparent bg-clip-text">
              Choose Your Plan
            </h1>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 bg-white dark:bg-gray-800 rounded-full p-1 sm:p-1.5 shadow-xl w-fit mx-auto border border-gray-100 dark:border-gray-700 mt-6">
              <span className={`text-[11px] sm:text-xs font-medium px-2 sm:px-3 py-1.5 sm:py-2 rounded-full transition-all duration-300 ${
                !isYearly ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}>
                Monthly
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className="relative inline-flex h-5 sm:h-6 w-10 sm:w-12 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300"
              >
                <span className={`inline-block h-3.5 sm:h-4 w-3.5 sm:w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${
                  isYearly ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'
                }`} />
              </button>
              <div className={`text-[11px] sm:text-xs font-medium px-2 sm:px-3 py-1.5 sm:py-2 rounded-full transition-all duration-300 relative ${
                isYearly ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}>
                Yearly
                <span className="absolute -top-3.5 right-0 sm:-right-2 bg-green-500 text-white text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                  Free Month!
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="flex-1 overflow-visible">
            <div className="flex justify-center max-w-4xl mx-auto relative pb-4">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`relative rounded-3xl p-6 sm:p-8 flex flex-col
                    transition-all duration-300 hover:shadow-2xl
                    max-w-md w-full
                    ${tier.recommended 
                      ? 'bg-gradient-to-br from-blue-600/10 to-purple-500/10 border border-blue-200 dark:border-blue-800 shadow-[0_20px_50px_rgba(8,_112,_184,_0.3)]' 
                      : 'bg-white dark:bg-gray-800 sm:bg-white/80 sm:dark:bg-gray-800/80 sm:backdrop-blur-lg border border-gray-100 dark:border-gray-700 shadow-xl'
                    }`}
                >
                  {tier.recommended && (
                    <div className="absolute -top-5 left-0 right-0 mx-auto w-40 rounded-full bg-gradient-to-r from-blue-600 to-purple-500 px-4 py-2 text-sm font-medium text-white text-center shadow-lg">
                      Most Popular
                    </div>
                  )}

                  <div className="text-center">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 inline-block text-transparent bg-clip-text mb-4">
                      {tier.name}
                    </h2>
                    <div className="relative mb-16">
                      <span className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 inline-block text-transparent bg-clip-text">
                        ${isYearly ? tier.yearlyPrice : tier.monthlyPrice}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-base ml-2">
                        /{isYearly ? 'year' : 'month'}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-6 flex-grow mb-16 mx-auto max-w-[85%]">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <div className="mr-3 rounded-full p-1.5 bg-blue-50 dark:bg-blue-900/20">
                          <Check className="h-4 w-4 text-blue-500" strokeWidth={3} />
                        </div>
                        <span className="text-gray-600 dark:text-gray-300 text-sm">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(tier)}
                    disabled={isLoading}
                    className={`w-full rounded-2xl px-6 py-4 text-center text-sm font-semibold
                      transition-all duration-300 transform hover:-translate-y-1
                      ${tier.recommended
                        ? 'bg-gradient-to-r from-blue-600 to-purple-500 text-white hover:shadow-lg hover:from-blue-700 hover:to-purple-600'
                        : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                      }
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? 'Processing...' : 'Get Started'}
                  </button>

                  <div className="mt-4 w-full">
                    <button
                      onClick={() => setShowCoupon(!showCoupon)}
                      className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center justify-center w-full"
                    >
                      {showCoupon ? 'Hide coupon code' : 'Have a coupon code?'}
                    </button>
                    
                    {showCoupon && (
                      <CouponInput 
                        onApply={handleApplyCoupon} 
                        disabled={isLoading} 
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Enterprise Note */}
            <div className="text-center mt-4 md:mt-8 text-gray-500 dark:text-gray-400 py-4 px-4 max-w-xl mx-auto mb-8">
              Contact <a href="mailto:henry@aitinerary.world" className="text-blue-500 hover:text-blue-600 font-medium">henry@aitinerary.world</a> with any questions.
            </div>

            {/* Footer links integrated */}
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-4 mb-8">
              <div className="flex items-center justify-center space-x-4 flex-wrap px-4">
                <a href="/terms" className="hover:text-blue-500 transition-colors duration-200">
                  Terms & Conditions
                </a>
                <span className="text-gray-400">•</span>
                <a href="/privacy" className="hover:text-blue-500 transition-colors duration-200">
                  Privacy Policy
                </a>
              </div>
              <div className="flex items-center justify-center px-4">
                <span className="font-medium">aitinerary, LLC</span>
                <span className="mx-2">•</span>
                <span>{new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}