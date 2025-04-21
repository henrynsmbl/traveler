'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/auth/AuthContext';
import { RequireAuth } from '../../components/auth/RequireAuth';
import { getUserSubscription } from '@/lib/firebase/subscription';
import Link from 'next/link';
import { CreditCard, Settings, User, BookOpen, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getUserProfile } from '@/lib/firebase/db';

interface SubscriptionInfo {
  status: string;
  plan: string;
  currentPeriodEnd: number;
  customerId: string;
  cancelAtPeriodEnd: boolean;
}

const getPlanName = (priceId: string) => {
  const plans: { [key: string]: string } = {
    'price_1R59roIzmoU5zafNJNxPLXN9': 'Ultimate Plan',
    'price_1R59roIzmoU5zafNovVMqvVK': 'Ultimate Plan',
  };
  return plans[priceId] || 'No Plan';
};

const AccountPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function loadSubscription() {
      if (user?.uid) {
        try {
          const sub = await getUserSubscription(user.uid);
          setSubscription(sub);
        } catch (error) {
          console.error('Error loading subscription:', error);
        } finally {
          setLoading(false);
        }
      }
    }

    loadSubscription();
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) {
        router.push('/');
        return;
      }

      try {
        setLoading(true);
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, router]);

  const handleManageSubscription = async () => {
    try {
      if (!subscription?.customerId) {
        setErrorMessage("You don't have an active subscription. Please subscribe to a plan first.");
        return;
      }

      // Clear any previous error messages
      setErrorMessage(null);
      
      const customerId = subscription.customerId;

      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customerId,
          returnUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create portal session');
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error('No URL returned from portal session creation');
      }

      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      setErrorMessage("An error occurred while trying to manage your subscription.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex justify-center">
        <div className="w-full max-w-3xl px-4 pt-20 pb-12 sm:py-24">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 inline-block text-transparent bg-clip-text">
              Account Settings
            </h1>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Profile Section */}
            <div className="bg-white dark:bg-gray-800 sm:bg-white/90 sm:dark:bg-gray-800/90 sm:backdrop-blur-lg rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-lg max-w-md mx-auto w-full">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">
                    {user.email?.[0].toUpperCase() || '?'}
                  </span>
                </div>
                <div className="text-center sm:text-left overflow-hidden">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white overflow-hidden text-ellipsis">
                    {user.email}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Member since {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Section */}
            <div className="bg-white dark:bg-gray-800 sm:bg-white/90 sm:dark:bg-gray-800/90 sm:backdrop-blur-lg rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-lg max-w-md mx-auto w-full">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                <CreditCard className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Subscription Details
                </h2>
              </div>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4 mx-auto"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2 mx-auto"></div>
                </div>
              ) : subscription ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      subscription.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xl font-medium bg-gradient-to-r from-blue-600 to-purple-500 inline-block text-transparent bg-clip-text">
                      {subscription.plan ? getPlanName(subscription.plan) : 'No Plan'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</p>
                      <div className={`text-base font-semibold capitalize ${
                        subscription.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {subscription.status}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Next Payment</p>
                      <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {subscription.status === 'active' && subscription.cancelAtPeriodEnd && (
                    <div className="text-amber-600 mt-2">
                      Your subscription will cancel on {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}.
                      You'll have access until then.
                    </div>
                  )}

                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleManageSubscription}
                      className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Manage Subscription</span>
                    </button>
                  </div>
                  
                  {errorMessage && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm text-center">
                      {errorMessage}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <p className="text-gray-600 dark:text-gray-400">No active subscription</p>
                  <Link
                    href="/subscription"
                    className="inline-flex px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    View Plans
                  </Link>
                  
                  {errorMessage && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                      {errorMessage}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Travel Section */}
            <div className="mt-6">
              <h2 className="text-lg font-medium mb-4">Your Travel</h2>
              <div className="space-y-3">
                <Link 
                  href="/my-itineraries"
                  className="flex items-center justify-between w-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">My Saved Itineraries</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">View and manage your saved travel plans</p>
                    </div>
                  </div>
                  <div className="text-blue-600 dark:text-blue-400">
                    View →
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
};

export default AccountPage;