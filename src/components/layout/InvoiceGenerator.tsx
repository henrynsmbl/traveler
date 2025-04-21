import React from 'react';
import { useRouter } from 'next/navigation';
import type { Selection } from '@/types/selections';
import type { DateRange } from "react-day-picker";
import { useAuth } from '../auth/AuthContext';
import { saveSelections } from '@/lib/firebase/selections';

interface InvoiceGeneratorProps {
  selections: Selection[];
  hotelDates: { [key: string]: DateRange | undefined };
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ selections, hotelDates }) => {
  const router = useRouter();
  const { user } = useAuth();

  const handleViewItinerary = async () => {
    if (!user) {
      alert('Please sign in to view your itinerary');
      return;
    }

    try {
      // Save the current selections to Firebase
      await saveSelections(user.uid, selections, hotelDates);
      
      // Navigate to the itinerary page
      router.push('/itinerary');
    } catch (error) {
      console.error('Error saving selections:', error);
      alert('There was an error saving your itinerary. Please try again.');
    }
  };

  return (
    <button
      onClick={handleViewItinerary}
      disabled={selections.length === 0}
      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      View Itinerary
    </button>
  );
};

export default InvoiceGenerator;