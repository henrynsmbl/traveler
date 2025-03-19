import { db } from './config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface SubscriptionStatus {
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  plan: string;
  currentPeriodEnd: number;
  customerId: string;
  subscriptionId: string;
  createdAt: number;
  updatedAt: number;
}

export async function updateUserSubscription(userId: string, subscription: SubscriptionStatus) {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { subscription }, { merge: true });
    
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

export async function getUserSubscription(userId: string): Promise<SubscriptionStatus | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const data = userDoc.exists() ? userDoc.data().subscription : null;
    return data;
  } catch (error) {
    console.error('Error getting subscription:', error);
    throw error;
  }
} 