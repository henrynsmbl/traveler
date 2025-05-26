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

export const updateHotelDates = async (userId: string, hotelId: string, dates: { from: Date; to: Date }) => {
  try {
    const userDoc = doc(db, 'users', userId);
    const docSnap = await getDoc(userDoc);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const updatedHotelDates = {
        ...data.hotelDates,
        [hotelId]: dates
      };
      
      await setDoc(userDoc, {
        hotelDates: updatedHotelDates,
        updatedAt: new Date()
      }, { merge: true });
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating hotel dates:', error);
    return false;
  }
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