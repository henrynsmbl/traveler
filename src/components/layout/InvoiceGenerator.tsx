import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Selection } from '@/types/selections';
import type { DateRange } from "react-day-picker";
import { useAuth } from '../auth/AuthContext';
import { createBooking, calculateItineraryTotal } from '@/lib/firebase/bookings';
import { X, Save, Send } from 'lucide-react';

interface InvoiceGeneratorProps {
  selections: Selection[];
  hotelDates: { [key: string]: DateRange | undefined };
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ selections, hotelDates }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [itineraryName, setItineraryName] = useState('My Trip');

  const handleViewItinerary = async () => {
    if (!user) {
      alert('Please sign in to view your itinerary');
      return;
    }

    try {
      // Navigate directly to the itinerary page
      // Hotel dates are already in state and will be passed to the page
      router.push('/itinerary');
    } catch (error) {
      console.error('Error accessing itinerary:', error);
      alert('There was an error accessing your itinerary. Please try again.');
    }
  };

  const handleBookItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setBookingError('Please sign in to book your itinerary');
      return;
    }
    
    if (selections.length === 0) {
      setBookingError('Your itinerary is empty. Please add some items before booking.');
      return;
    }
    
    try {
      setIsBooking(true);
      setBookingError('');
      
      // Calculate total price
      const totalPrice = calculateItineraryTotal(selections, hotelDates);
      
      // Create booking in Firebase
      const bookingId = await createBooking(
        user.uid,
        user.email || 'unknown@example.com',
        user.displayName || 'Anonymous User',
        null, // No saved itinerary ID
        itineraryName,
        selections,
        hotelDates,
        totalPrice
      );
      
      // Navigate to the booking status page
      router.push(`/booking/${bookingId}`);
      
    } catch (error) {
      console.error('Error creating booking:', error);
      setBookingError('Failed to create booking. Please try again.');
      setIsBooking(false);
    }
  };

  return (
    <>
      <div className="flex flex-col space-y-2 w-full">
        <button
          onClick={handleViewItinerary}
          disabled={selections.length === 0}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          View Itinerary
        </button>
        
        <button
          onClick={() => setBookModalOpen(true)}
          disabled={selections.length === 0}
          className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Send className="h-4 w-4" />
          Book with Agent
        </button>
      </div>

      {/* Booking Modal */}
      {bookModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Book with Travel Agent</h2>
              <button 
                onClick={() => {
                  setBookModalOpen(false);
                  setBookingError('');
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleBookItinerary} className="p-6 space-y-4">
              {bookingError && (
                <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg text-sm">
                  {bookingError}
                </div>
              )}
              
              <div>
                <label htmlFor="itineraryName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trip Name
                </label>
                <input
                  type="text"
                  id="itineraryName"
                  value={itineraryName}
                  onChange={(e) => setItineraryName(e.target.value)}
                  placeholder="e.g., Summer Vacation 2023"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm">
                <p className="text-blue-800 dark:text-blue-200">
                  By clicking "Book Now", your itinerary will be sent to our travel agent who will review it and contact you with any questions or to confirm your booking.
                </p>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setBookModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBooking}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isBooking ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Book Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default InvoiceGenerator;