import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';

export const checkSubscription = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      console.log('No user document found');
      return false;
    }
    
    const userData = userDoc.data();    
    const hasSubscription = userData.subscription?.status === 'active';
    return hasSubscription;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}; 