import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';
import type { Selection } from '@/types/selections';
import type { DateRange } from "react-day-picker";

export const saveSelections = async (
  userId: string, 
  selections: Selection[], 
  hotelDates: { [key: string]: DateRange | undefined }
) => {
  const userDoc = doc(db, 'users', userId);
  await setDoc(userDoc, {
    selections,
    hotelDates,
    updatedAt: new Date()
  }, { merge: true });
};

export const getSelections = async (userId: string) => {
  const userDoc = doc(db, 'users', userId);
  const docSnap = await getDoc(userDoc);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      selections: data.selections || [],
      hotelDates: data.hotelDates || {}
    };
  }
  return { selections: [], hotelDates: {} };
}; 