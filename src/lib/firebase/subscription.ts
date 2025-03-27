import { db } from './config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

interface SubscriptionStatus {
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  plan: string;
  currentPeriodEnd: number;
  customerId: string;
  subscriptionId: string;
  createdAt: number;
  updatedAt: number;
}

interface SubscriptionInfo extends SubscriptionStatus {
  cancelAtPeriodEnd: boolean;
  canceledAt?: number;
}

export async function updateUserSubscription(userId: string, subscription: SubscriptionStatus) {
  try {
    console.log(`Updating subscription for user ${userId}:`, subscription);
    const userRef = doc(db, 'users', userId);
    
    // First check if the user document exists
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Ensure all timestamps are in seconds for consistency
      const currentTimeInSeconds = Math.floor(Date.now() / 1000);
      
      // Normalize the subscription data
      const normalizedSubscription = {
        ...subscription,
        // Ensure these fields exist and are in seconds
        createdAt: subscription.createdAt || currentTimeInSeconds,
        updatedAt: currentTimeInSeconds,
        // Convert any millisecond timestamps to seconds if needed
        currentPeriodEnd: typeof subscription.currentPeriodEnd === 'number' 
          ? (subscription.currentPeriodEnd > 9999999999 
              ? Math.floor(subscription.currentPeriodEnd / 1000) 
              : subscription.currentPeriodEnd)
          : currentTimeInSeconds + (30 * 24 * 60 * 60) // Default to 30 days if missing
      };
      
      // Update both the subscription object and individual fields for backward compatibility
      await updateDoc(userRef, {
        subscription: normalizedSubscription,
        subscriptionStatus: normalizedSubscription.status,
        subscriptionTier: normalizedSubscription.plan.includes('price_') 
          ? 'ultimate' // Default to 'ultimate' for price IDs
          : normalizedSubscription.plan,
        stripeCustomerId: normalizedSubscription.customerId,
        stripeSubscriptionId: normalizedSubscription.subscriptionId,
        subscriptionStartDate: new Date(normalizedSubscription.createdAt * 1000).toISOString(),
        subscriptionEndDate: new Date(normalizedSubscription.currentPeriodEnd * 1000).toISOString(),
      });
      console.log(`Successfully updated subscription for user ${userId}`);
    } else {
      console.error(`User document ${userId} does not exist`);
      throw new Error(`User document ${userId} does not exist`);
    }
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

export async function getUserSubscription(userId: string): Promise<SubscriptionInfo | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists() && userDoc.data().subscription) {
      const subData = userDoc.data().subscription;
      return {
        ...subData,
        cancelAtPeriodEnd: subData.cancelAtPeriodEnd || false // Add default value
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
} 