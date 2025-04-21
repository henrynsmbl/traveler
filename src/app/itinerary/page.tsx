'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, MapPin, Plane, Hotel, Bookmark, Save, X } from 'lucide-react';
import type { Selection, FlightSelection, HotelSelection, ActivitySelection } from '@/types/selections';
import type { DateRange } from 'react-day-picker';
import { getSelections } from '@/lib/firebase/selections';
import { saveItinerary } from '@/lib/firebase/itineraries';
import Link from 'next/link';

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

const formatDate = (dateTimeStr: string) => {
  try {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return dateTimeStr;
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', dateTimeStr, error);
    return dateTimeStr;
  }
};

const formatTime = (dateTimeStr: string) => {
  try {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting time:', dateTimeStr, error);
    return '';
  }
};

export default function ItineraryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selections, setSelections] = useState<Selection[]>([]);
  const [hotelDates, setHotelDates] = useState<{[key: string]: DateRange | undefined}>({});
  const [loading, setLoading] = useState(true);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [itineraryName, setItineraryName] = useState('');
  const [itineraryDescription, setItineraryDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const fetchSelections = async () => {
      if (!user?.uid) {
        router.push('/');
        return;
      }

      try {
        setLoading(true);
        const { selections: fetchedSelections, hotelDates: fetchedHotelDates } = await getSelections(user.uid);
        setSelections(fetchedSelections);
        setHotelDates(fetchedHotelDates);
      } catch (error) {
        console.error('Error fetching selections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSelections();
  }, [user, router]);

  // Group selections by type
  const flightSelections = selections.filter(s => s.type === 'flight') as FlightSelection[];
  const hotelSelections = selections.filter(s => s.type === 'hotel') as HotelSelection[];
  const activitySelections = selections.filter(s => s.type === 'activity') as ActivitySelection[];

  // Sort flights by departure time
  const sortedFlights = [...flightSelections].sort((a, b) => {
    const aTime = new Date(a.data.flights[0].departure_airport.time).getTime();
    const bTime = new Date(b.data.flights[0].departure_airport.time).getTime();
    return aTime - bTime;
  });

  const handleSaveItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      setSaveError('You must be logged in to save an itinerary');
      return;
    }
    
    if (!itineraryName.trim()) {
      setSaveError('Please provide a name for your itinerary');
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveError('');
      
      await saveItinerary(
        user.uid,
        itineraryName.trim(),
        itineraryDescription.trim() || undefined,
        selections,
        hotelDates
      );
      
      setSaveSuccess(true);
      
      // Reset form after successful save
      setTimeout(() => {
        setSaveModalOpen(false);
        setSaveSuccess(false);
        setItineraryName('');
        setItineraryDescription('');
      }, 2000);
      
    } catch (error) {
      console.error('Error saving itinerary:', error);
      setSaveError('Failed to save itinerary. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (selections.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">No Itinerary Items</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">You haven't added any items to your itinerary yet.</p>
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      {/* Header - Adjust positioning to account for navbar */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Itinerary</h1>
          </div>
        </div>
      </header>

      {/* Main content - Add pt-6 for spacing from header */}
      <main className="max-w-7xl mx-auto px-4 py-8 pt-6 sm:px-6 lg:px-8">
        {/* Add Save Itinerary button */}
        {user && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setSaveModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save size={16} />
              Save Itinerary
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <section className="lg:col-span-2 space-y-6">
            {/* Flights Section */}
            {sortedFlights.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <Plane className="h-5 w-5 text-blue-500" />
                  <h2 className="text-xl font-semibold">Flights</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedFlights.map((flight) => (
                    <div key={flight.id} className="p-6 space-y-4">
                      {flight.data.flights.map((segment, index) => (
                        <div key={`${flight.id}-${index}`} className="space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                            {segment.airline_logo && (
                              <img 
                                src={segment.airline_logo} 
                                alt={segment.airline} 
                                className="h-8 w-8 object-contain"
                              />
                            )}
                            <div>
                              <div className="font-medium">{segment.airline} {segment.flight_number}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(segment.departure_airport.time)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-stretch">
                            <div className="flex flex-col items-center mr-4">
                              <div className="rounded-full w-3 h-3 bg-blue-500"></div>
                              <div className="w-0.5 flex-grow bg-gray-300 dark:bg-gray-600 my-1"></div>
                              <div className="rounded-full w-3 h-3 bg-blue-500"></div>
                            </div>
                            
                            <div className="flex-grow space-y-6">
                              <div>
                                <div className="font-medium">
                                  {formatTime(segment.departure_airport.time)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {segment.departure_airport.name} ({segment.departure_airport.id})
                                </div>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex-grow border-t border-dashed border-gray-300 dark:border-gray-600 mx-2"></div>
                                <span>{formatDuration(segment.duration)}</span>
                                <div className="flex-grow border-t border-dashed border-gray-300 dark:border-gray-600 mx-2"></div>
                              </div>
                              
                              <div>
                                <div className="font-medium">
                                  {formatTime(segment.arrival_airport.time)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {segment.arrival_airport.name} ({segment.arrival_airport.id})
                                </div>
                              </div>
                            </div>
                            
                            <div className="ml-4 text-right">
                              <div className="text-sm font-medium">
                                {segment.travel_class}
                              </div>
                            </div>
                          </div>
                          
                          {flight.data.layovers && flight.data.layovers[index] && (
                            <div className="ml-7 pl-4 border-l border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400">
                              <div className="py-2">
                                Layover at {flight.data.layovers[index].name}: {formatDuration(flight.data.layovers[index].duration)}
                                {flight.data.layovers[index].overnight && ' (Overnight)'}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="mt-4 text-right text-lg font-semibold text-blue-600 dark:text-blue-400">
                        ${flight.data.price.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hotels Section */}
            {hotelSelections.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <Hotel className="h-5 w-5 text-blue-500" />
                  <h2 className="text-xl font-semibold">Accommodations</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {hotelSelections.map((hotel) => {
                    const dates = hotelDates[hotel.id];
                    const nightlyRate = hotel.data.rate_per_night?.lowest?.replace(/[^0-9.]/g, '') || '0';
                    
                    let totalPrice = parseFloat(nightlyRate);
                    let nights = 1;
                    
                    if (dates?.from && dates?.to) {
                      nights = Math.ceil((dates.to.getTime() - dates.from.getTime()) / (1000 * 60 * 60 * 24));
                      totalPrice = parseFloat(nightlyRate) * nights;
                    }
                    
                    return (
                      <div key={hotel.id} className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          {hotel.data.images && hotel.data.images.length > 0 && (
                            <div className="md:w-1/3">
                              <img 
                                src={typeof hotel.data.images[0] === 'string' 
                                  ? hotel.data.images[0] 
                                  : (hotel.data.images[0] as any).url || ''} 
                                alt={hotel.data.name} 
                                className="w-full h-48 object-cover rounded-lg"
                              />
                            </div>
                          )}
                          
                          <div className="md:w-2/3 space-y-4">
                            <h3 className="text-xl font-medium">{hotel.data.name}</h3>
                            
                            {hotel.data.address && (
                              <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                                <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <span>{hotel.data.address}</span>
                              </div>
                            )}
                            
                            {dates?.from && dates?.to && (
                              <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                                <Calendar className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div>
                                    {format(dates.from, 'MMM d, yyyy')} - {format(dates.to, 'MMM d, yyyy')}
                                  </div>
                                  <div className="text-sm">{nights} night{nights !== 1 ? 's' : ''}</div>
                                </div>
                              </div>
                            )}
                            
                            <div className="text-right">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {hotel.data.rate_per_night?.lowest} per night
                              </div>
                              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                ${totalPrice.toFixed(2)} total
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Activities Section - Moved from sidebar to main content */}
            {activitySelections.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-blue-500" />
                  <h2 className="text-xl font-semibold">Activities & Notes</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {activitySelections.map((activity) => (
                    <div key={activity.id} className="p-6">
                      <p className="text-gray-900 dark:text-gray-100 mb-3 text-lg font-medium">
                        {activity.data.description}
                      </p>
                      {activity.data.notes && (
                        <div className="mt-3 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <p className="italic whitespace-pre-wrap">{activity.data.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Sidebar - Now only contains the summary */}
          <section className="space-y-6">
            {/* Summary Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden sticky top-6">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold">Trip Summary</h2>
              </div>
              <div className="p-6 space-y-4">
                {/* Calculate total price */}
                {(() => {
                  let totalPrice = 0;
                  
                  // Add flight prices
                  flightSelections.forEach(flight => {
                    totalPrice += flight.data.price;
                  });
                  
                  // Add hotel prices
                  hotelSelections.forEach(hotel => {
                    const dates = hotelDates[hotel.id];
                    if (dates?.from && dates?.to && hotel.data.rate_per_night?.lowest) {
                      const nights = Math.ceil((dates.to.getTime() - dates.from.getTime()) / (1000 * 60 * 60 * 24));
                      const nightlyRate = parseFloat(hotel.data.rate_per_night.lowest.replace(/[^0-9.]/g, ''));
                      totalPrice += (nightlyRate * nights);
                    } else {
                      const nightlyRate = parseFloat(hotel.data.rate_per_night?.lowest?.replace(/[^0-9.]/g, '') || '0');
                      totalPrice += nightlyRate;
                    }
                  });
                  
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-700 dark:text-gray-300">Flights:</span>
                        <span className="text-right">{flightSelections.length}</span>
                        
                        <span className="text-gray-700 dark:text-gray-300">Hotels:</span>
                        <span className="text-right">{hotelSelections.length}</span>
                        
                        <span className="text-gray-700 dark:text-gray-300">Activities:</span>
                        <span className="text-right">{activitySelections.length}</span>
                      </div>
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <div className="flex justify-between items-center font-semibold text-lg">
                          <span>Total:</span>
                          <span>${totalPrice.toFixed(2)}</span>
                        </div>
                        
                        {activitySelections.length > 0 && (
                          <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                            Note: Activity costs will be updated before booking confirmation if applicable.
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}
                
                <Link
                  href="/itinerary"
                  className="w-full mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center block"
                >
                  Book Itinerary
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {saveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Save Your Itinerary</h2>
              <button 
                onClick={() => {
                  setSaveModalOpen(false);
                  setSaveSuccess(false);
                  setSaveError('');
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveItinerary} className="p-6 space-y-4">
              {saveSuccess ? (
                <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-4 rounded-lg text-center">
                  Itinerary saved successfully!
                </div>
              ) : (
                <>
                  {saveError && (
                    <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg text-sm">
                      {saveError}
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="itineraryName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Itinerary Name *
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
                  
                  <div>
                    <label htmlFor="itineraryDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      id="itineraryDescription"
                      value={itineraryDescription}
                      onChange={(e) => setItineraryDescription(e.target.value)}
                      placeholder="Add any notes about this trip..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setSaveModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save Itinerary
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 