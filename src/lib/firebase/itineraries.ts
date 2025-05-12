import { collection, doc, getDoc, getDocs, setDoc, query, where, orderBy, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from './config';
import type { Selection } from '@/types/selections';
import type { DateRange } from "react-day-picker";
import { v4 as uuidv4 } from 'uuid';

export interface SavedItinerary {
  id: string;
  userId: string;
  name: string;
  description?: string;
  selections: Selection[];
  hotelDates: { [key: string]: DateRange | undefined };
  customNotes?: CustomNote[];
  createdAt: Date;
  updatedAt: Date;
}

export const saveItinerary = async (
  userId: string,
  name: string,
  description: string | undefined,
  selections: Selection[],
  hotelDates: { [key: string]: DateRange | undefined }
) => {
  const itineraryId = uuidv4();
  const itineraryRef = doc(db, 'itineraries', itineraryId);
  
  // Create a base itinerary object
  const itinerary: SavedItinerary = {
    id: itineraryId,
    userId,
    name,
    // Only include description if it's not undefined or empty
    ...(description ? { description } : {}),
    selections,
    hotelDates,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Prepare the data for Firestore
  const firestoreData = {
    ...itinerary,
    createdAt: Timestamp.fromDate(itinerary.createdAt),
    updatedAt: Timestamp.fromDate(itinerary.updatedAt),
    // Convert DateRange objects to serializable format
    hotelDates: Object.entries(hotelDates).reduce((acc, [key, value]) => {
      if (value?.from && value?.to) {
        acc[key] = {
          from: Timestamp.fromDate(value.from),
          to: Timestamp.fromDate(value.to)
        };
      }
      return acc;
    }, {} as Record<string, any>)
  };
  
  await setDoc(itineraryRef, firestoreData);
  
  return itineraryId;
};

export const updateItinerary = async (
  itineraryId: string,
  updates: Partial<Omit<SavedItinerary, 'id' | 'userId' | 'createdAt'>>
) => {
  const itineraryRef = doc(db, 'itineraries', itineraryId);
  const itinerarySnap = await getDoc(itineraryRef);
  
  if (!itinerarySnap.exists()) {
    throw new Error('Itinerary not found');
  }
  
  const updatedData = {
    ...updates,
    updatedAt: new Date()
  };
  
  // Convert DateRange objects if present
  if (updates.hotelDates) {
    updatedData.hotelDates = Object.entries(updates.hotelDates).reduce((acc, [key, value]) => {
      if (value?.from && value?.to) {
        acc[key] = {
          from: Timestamp.fromDate(value.from),
          to: Timestamp.fromDate(value.to)
        };
      }
      return acc;
    }, {} as Record<string, any>);
  }
  
  // Convert CustomNote dates if present
  if (updates.customNotes) {
    updatedData.customNotes = updates.customNotes.map(note => ({
      ...note,
      date: note.date instanceof Date ? Timestamp.fromDate(note.date) : note.date
    }));
  }
  
  await setDoc(itineraryRef, updatedData, { merge: true });
};

export const deleteItinerary = async (itineraryId: string) => {
  const itineraryRef = doc(db, 'itineraries', itineraryId);
  await deleteDoc(itineraryRef);
};

export const getItineraries = async (userId: string): Promise<SavedItinerary[]> => {
  const itinerariesRef = collection(db, 'itineraries');
  
  // Simpler query that doesn't require a composite index
  const q = query(
    itinerariesRef,
    where('userId', '==', userId)
    // Remove the orderBy to avoid requiring an index
  );
  
  const querySnapshot = await getDocs(q);
  const itineraries: SavedItinerary[] = [];
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    
    // Convert Firestore Timestamps back to Date objects
    const createdAt = data.createdAt?.toDate() || new Date();
    const updatedAt = data.updatedAt?.toDate() || new Date();
    
    // Convert serialized DateRange objects back to proper format
    const hotelDates = Object.entries(data.hotelDates || {}).reduce((acc, [key, value]: [string, any]) => {
      if (value?.from && value?.to) {
        acc[key] = {
          from: value.from.toDate(),
          to: value.to.toDate()
        };
      }
      return acc;
    }, {} as Record<string, DateRange>);
    
    itineraries.push({
      ...data,
      id: doc.id,
      createdAt,
      updatedAt,
      hotelDates
    } as SavedItinerary);
  });
  
  // Sort in memory instead of in the query
  return itineraries.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const getItinerary = async (itineraryId: string): Promise<SavedItinerary | null> => {
  const itineraryRef = doc(db, 'itineraries', itineraryId);
  const docSnap = await getDoc(itineraryRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  const data = docSnap.data();
  
  // Convert Firestore Timestamps back to Date objects
  const createdAt = data.createdAt?.toDate() || new Date();
  const updatedAt = data.updatedAt?.toDate() || new Date();
  
  // Convert serialized DateRange objects back to proper format
  const hotelDates = Object.entries(data.hotelDates || {}).reduce((acc, [key, value]: [string, any]) => {
    if (value?.from && value?.to) {
      acc[key] = {
        from: value.from.toDate(),
        to: value.to.toDate()
      };
    }
    return acc;
  }, {} as Record<string, DateRange>);
  
  // Convert custom note dates from Timestamp to Date
  const customNotes = data.customNotes 
    ? data.customNotes.map((note: any) => ({
        ...note,
        date: note.date instanceof Timestamp ? note.date.toDate() : new Date(note.date)
      }))
    : [];
  
  return {
    ...data,
    id: docSnap.id,
    createdAt,
    updatedAt,
    hotelDates,
    customNotes
  } as SavedItinerary;
}; 