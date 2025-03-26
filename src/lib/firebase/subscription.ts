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
      // Update both the subscription object and individual fields for backward compatibility
      await updateDoc(userRef, {
        subscription,
        subscriptionStatus: subscription.status,
        subscriptionTier: 'ultimate', // Adjust based on your tiers
        stripeCustomerId: subscription.customerId,
        stripeSubscriptionId: subscription.subscriptionId,
        subscriptionStartDate: new Date(subscription.createdAt * 1000).toISOString(),
        subscriptionEndDate: new Date(subscription.currentPeriodEnd * 1000).toISOString(),
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