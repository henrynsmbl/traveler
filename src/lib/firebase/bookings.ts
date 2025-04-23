import { collection, doc, getDoc, getDocs, setDoc, query, where, orderBy, Timestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './config';
import type { Selection } from '@/types/selections';
import type { DateRange } from "react-day-picker";
import { v4 as uuidv4 } from 'uuid';
import { SavedItinerary } from './itineraries';

export type BookingStatus = 
  | 'pending_review' 
  | 'agent_reviewing' 
  | 'questions_pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export interface BookingComment {
  id: string;
  authorId: string;
  authorName: string;
  isAgent: boolean;
  content: string;
  timestamp: Date;
}

export interface Booking {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  itineraryId: string | null;
  itineraryName: string;
  selections: Selection[];
  hotelDates: { [key: string]: DateRange | undefined };
  status: BookingStatus;
  comments: BookingComment[];
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export const createBooking = async (
  userId: string,
  userEmail: string,
  userName: string,
  itineraryId: string | null,
  itineraryName: string,
  selections: Selection[],
  hotelDates: { [key: string]: DateRange | undefined },
  totalPrice: number
) => {
  const bookingId = uuidv4();
  const bookingRef = doc(db, 'bookings', bookingId);
  
  // Create a booking object
  const booking: Booking = {
    id: bookingId,
    userId,
    userEmail,
    userName,
    itineraryId,
    itineraryName,
    selections,
    hotelDates,
    status: 'pending_review',
    comments: [],
    totalPrice,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Prepare the data for Firestore
  const firestoreData = {
    ...booking,
    createdAt: Timestamp.fromDate(booking.createdAt),
    updatedAt: Timestamp.fromDate(booking.updatedAt),
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
  
  await setDoc(bookingRef, firestoreData);
  
  // Send email notification to agent (this would typically be done in a Cloud Function)
  // For now, we'll just log it
  console.log(`Booking ${bookingId} created and email would be sent to agent`);
  
  return bookingId;
};

export const getBooking = async (bookingId: string): Promise<Booking | null> => {
  const bookingRef = doc(db, 'bookings', bookingId);
  const docSnap = await getDoc(bookingRef);
  
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
  
  // Convert comment timestamps
  const comments = (data.comments || []).map((comment: any) => ({
    ...comment,
    timestamp: comment.timestamp?.toDate() || new Date()
  }));
  
  return {
    ...data,
    id: docSnap.id,
    createdAt,
    updatedAt,
    hotelDates,
    comments
  } as Booking;
};

export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  const bookingsRef = collection(db, 'bookings');
  const q = query(
    bookingsRef,
    where('userId', '==', userId)
  );
  
  const querySnapshot = await getDocs(q);
  const bookings: Booking[] = [];
  
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
    
    // Convert comment timestamps
    const comments = (data.comments || []).map((comment: any) => ({
      ...comment,
      timestamp: comment.timestamp?.toDate() || new Date()
    }));
    
    bookings.push({
      ...data,
      id: doc.id,
      createdAt,
      updatedAt,
      hotelDates,
      comments
    } as Booking);
  });
  
  // Sort by creation date, newest first
  return bookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getAllBookings = async (): Promise<Booking[]> => {
  const bookingsRef = collection(db, 'bookings');
  const querySnapshot = await getDocs(bookingsRef);
  const bookings: Booking[] = [];
  
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
    
    // Convert comment timestamps
    const comments = (data.comments || []).map((comment: any) => ({
      ...comment,
      timestamp: comment.timestamp?.toDate() || new Date()
    }));
    
    bookings.push({
      ...data,
      id: doc.id,
      createdAt,
      updatedAt,
      hotelDates,
      comments
    } as Booking);
  });
  
  // Sort by creation date, newest first
  return bookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const updateBookingStatus = async (
  bookingId: string,
  status: BookingStatus
) => {
  const bookingRef = doc(db, 'bookings', bookingId);
  
  await updateDoc(bookingRef, {
    status,
    updatedAt: Timestamp.fromDate(new Date())
  });
};

export const addBookingComment = async (
  bookingId: string,
  authorId: string,
  authorName: string,
  isAgent: boolean,
  content: string
) => {
  const bookingRef = doc(db, 'bookings', bookingId);
  
  const comment: BookingComment = {
    id: uuidv4(),
    authorId,
    authorName,
    isAgent,
    content,
    timestamp: new Date()
  };
  
  await updateDoc(bookingRef, {
    comments: arrayUnion({
      ...comment,
      timestamp: Timestamp.fromDate(comment.timestamp)
    }),
    updatedAt: Timestamp.fromDate(new Date())
  });
  
  return comment;
};

// Function to calculate the total price of an itinerary
export const calculateItineraryTotal = (selections: Selection[], hotelDates: { [key: string]: DateRange | undefined }): number => {
  return selections.reduce((total, selection) => {
    if (selection.type === 'flight') {
      return total + selection.data.price;
    } else if (selection.type === 'hotel') {
      const dates = hotelDates[selection.id];
      if (dates?.from && dates?.to && selection.data.rate_per_night?.lowest) {
        const nights = Math.ceil((dates.to.getTime() - dates.from.getTime()) / (1000 * 60 * 60 * 24));
        const nightlyRate = parseFloat(selection.data.rate_per_night.lowest.replace(/[^0-9.]/g, ''));
        return total + (nightlyRate * nights);
      }
      const nightlyRate = parseFloat(selection.data.rate_per_night?.lowest?.replace(/[^0-9.]/g, '') || '0');
      return total + nightlyRate;
    }
    return total;
  }, 0);
}; 