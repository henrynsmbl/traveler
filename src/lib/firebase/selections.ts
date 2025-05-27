import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './config';
import type { Selection } from '@/types/selections';
import type { DateRange } from "react-day-picker";

const safeDate = (dateValue: any): Date | null => {
  try {
    if (!dateValue) return null;
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error('Error creating date:', error);
    return null;
  }
};

export const saveSelections = async (
  userId: string, 
  selections: Selection[], 
  hotelDates: { [key: string]: DateRange | undefined }
) => {
  const userDoc = doc(db, 'users', userId);
  
  // Convert DateRange objects to Timestamps for Firestore
  const serializedHotelDates = Object.entries(hotelDates).reduce((acc, [key, value]) => {
    if (value?.from && value?.to) {
      const fromDate = safeDate(value.from);
      const toDate = safeDate(value.to);
      
      if (fromDate && toDate) {
        acc[key] = {
          from: Timestamp.fromDate(fromDate),
          to: Timestamp.fromDate(toDate)
        };
      }
    }
    return acc;
  }, {} as Record<string, any>);
  
  await setDoc(userDoc, {
    selections,
    hotelDates: serializedHotelDates,
    updatedAt: new Date()
  }, { merge: true });
};

export const updateHotelDates = async (userId: string, hotelId: string, dates: { from: Date; to: Date }) => {
  try {
    const userDoc = doc(db, 'users', userId);
    const docSnap = await getDoc(userDoc);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Convert existing hotel dates back to proper format
      const existingHotelDates = Object.entries(data.hotelDates || {}).reduce((acc, [key, value]: [string, any]) => {
        if (value?.from && value?.to) {
          acc[key] = {
            from: value.from instanceof Timestamp ? value.from : Timestamp.fromDate(safeDate(value.from) || new Date()),
            to: value.to instanceof Timestamp ? value.to : Timestamp.fromDate(safeDate(value.to) || new Date())
          };
        }
        return acc;
      }, {} as Record<string, any>);
      
      const updatedHotelDates = {
        ...existingHotelDates,
        [hotelId]: {
          from: Timestamp.fromDate(dates.from),
          to: Timestamp.fromDate(dates.to)
        }
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
    
    // Convert Firestore Timestamps back to DateRange objects
    const hotelDates = Object.entries(data.hotelDates || {}).reduce((acc, [key, value]: [string, any]) => {
      if (value?.from && value?.to) {
        try {
          acc[key] = {
            from: value.from instanceof Timestamp ? value.from.toDate() : safeDate(value.from) || new Date(),
            to: value.to instanceof Timestamp ? value.to.toDate() : safeDate(value.to) || new Date()
          };
        } catch (error) {
          console.error('Error converting hotel dates for', key, error);
        }
      }
      return acc;
    }, {} as Record<string, DateRange>);
    
    return {
      selections: data.selections || [],
      hotelDates
    };
  }
  return { selections: [], hotelDates: {} };
}; 