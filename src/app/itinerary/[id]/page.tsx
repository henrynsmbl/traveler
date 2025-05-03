'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isSameMonth, addMonths, addWeeks, addYears, getDay, getDaysInMonth } from 'date-fns';
import { ArrowLeft, Calendar, MapPin, Plane, Hotel, Bookmark, Send, Save, X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Selection, FlightSelection, HotelSelection, ActivitySelection } from '@/types/selections';
import type { DateRange } from 'react-day-picker';
import { getItinerary, SavedItinerary } from '@/lib/firebase/itineraries';
import { createBooking, calculateItineraryTotal } from '@/lib/firebase/bookings';
import CalendarContainer from '@/components/calendar/CalendarContainer';
import { CustomNote } from '@/types/notes';

// Import the same helper functions from your itinerary page
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

export default function SavedItineraryPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const [itinerary, setItinerary] = useState<SavedItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentNote, setCurrentNote] = useState<{ id: string; date: Date; title: string; content: string; color: string } | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [customNotes, setCustomNotes] = useState<CustomNote[]>([]);
  const [showCalendarView, setShowCalendarView] = useState(false);
  
  // Unwrap params if it's a Promise
  const itineraryId = params instanceof Promise ? React.use(params).id : params.id;

  useEffect(() => {
    const fetchItinerary = async () => {
      if (!user?.uid) {
        router.push('/');
        return;
      }

      try {
        setLoading(true);
        // Use the unwrapped itineraryId
        const fetchedItinerary = await getItinerary(itineraryId);
        
        if (!fetchedItinerary) {
          setError('Itinerary not found');
          return;
        }
        
        if (fetchedItinerary.userId !== user.uid) {
          setError('You do not have permission to view this itinerary');
          return;
        }
        
        setItinerary(fetchedItinerary);
      } catch (error) {
        console.error('Error fetching itinerary:', error);
        setError('Failed to load itinerary');
      } finally {
        setLoading(false);
      }
    };

    fetchItinerary();
  }, [itineraryId, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Failed to load itinerary'}</p>
        <button 
          onClick={() => router.push('/my-itineraries')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to My Itineraries
        </button>
      </div>
    );
  }

  // Group selections by type
  const selections = itinerary.selections;
  const hotelDates = itinerary.hotelDates;
  
  const flightSelections = selections.filter(s => s.type === 'flight') as FlightSelection[];
  const hotelSelections = selections.filter(s => s.type === 'hotel') as HotelSelection[];
  const activitySelections = selections.filter(s => s.type === 'activity') as ActivitySelection[];

  // Sort flights by departure time
  const sortedFlights = [...flightSelections].sort((a, b) => {
    const aTime = new Date(a.data.flights[0].departure_airport.time).getTime();
    const bTime = new Date(b.data.flights[0].departure_airport.time).getTime();
    return aTime - bTime;
  });

  const handleBookItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setBookingError('Please sign in to book your itinerary');
      return;
    }
    
    if (!itinerary) {
      setBookingError('Itinerary not found');
      return;
    }
    
    try {
      setIsBooking(true);
      setBookingError('');
      
      // Calculate total price
      const totalPrice = calculateItineraryTotal(itinerary.selections, itinerary.hotelDates);
      
      // Create booking in Firebase
      const bookingId = await createBooking(
        user.uid,
        user.email || 'unknown@example.com',
        user.displayName || 'Anonymous User',
        itinerary.id,
        itinerary.name,
        itinerary.selections,
        itinerary.hotelDates,
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

  const handleSaveNote = () => {
    if (!currentNote || !selectedDate) return;
    
    const newNote: CustomNote = {
      id: currentNote.id || `note-${Date.now()}`,
      date: selectedDate,
      title: currentNote.title,
      content: currentNote.content,
      color: currentNote.color
    };
    
    if (currentNote.id) {
      // Edit existing note
      setCustomNotes(prev => prev.map(note => note.id === currentNote.id ? newNote : note));
    } else {
      // Add new note
      setCustomNotes(prev => [...prev, newNote]);
    }
    
    setNoteModalOpen(false);
    setCurrentNote(null);
  };

  const handleAddNote = (date: Date) => {
    setSelectedDate(date);
    setCurrentNote({ id: '', date, title: '', content: '', color: 'bg-amber-100 border-amber-500' });
    setNoteModalOpen(true);
  };

  const toggleCalendarView = () => {
    setShowCalendarView(!showCalendarView);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - only show when not in calendar view */}
      {!showCalendarView && (
        <header className="bg-transparent shadow-sm z-20 pt-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => router.push('/my-itineraries')}
                className="flex items-center gap-1 px-2.5 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">Back</span>
              </button>

              <h1 className="text-lg font-medium truncate max-w-[50%] mx-auto text-center text-gray-900 dark:text-white absolute left-1/2 transform -translate-x-1/2">
                {itinerary.name}
              </h1>
              
              <button 
                onClick={toggleCalendarView}
                className="flex items-center gap-1 px-2.5 py-1 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800"
              >
                <Calendar size={14} />
                <span className="hidden sm:inline">Calendar</span>
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${showCalendarView ? 'pt-20' : ''}`}>
        {showCalendarView ? (
          <div className="space-y-6">
            <button 
              onClick={toggleCalendarView}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Itinerary
            </button>
            
            {/* Calendar View using the new component */}
            <CalendarContainer
              flightSelections={flightSelections}
              hotelSelections={hotelSelections}
              hotelDates={Object.fromEntries(
                Object.entries(hotelDates).filter(([_, v]) => v !== undefined)
              ) as Record<string, DateRange>}
              customNotes={customNotes}
              onAddNote={handleAddNote}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <Plane className="h-5 w-5 text-blue-500" />
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
                              <div className="md:w-1/3 relative">
                                {(() => {
                                  // State for current image index (using useState hook)
                                  const [currentImageIndex, setCurrentImageIndex] = useState(0);
                                  
                                  // Function to get valid image URL from an image entry
                                  const getImageUrl = (imageData: any) => {
                                    if (typeof imageData === 'string') {
                                      return imageData || null;
                                    } else if (imageData && imageData.url) {
                                      return imageData.url || null;
                                    }
                                    return null;
                                  };
                                  
                                  // Get all valid image URLs
                                  const validImageUrls = hotel.data.images
                                    .map(getImageUrl)
                                    .filter(url => url !== null);
                                  
                                  // If no valid images, show placeholder
                                  if (validImageUrls.length === 0) {
                                    return (
                                      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                        <Hotel className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                                      </div>
                                    );
                                  }
                                  
                                  // Show current image with navigation controls
                                  return (
                                    <>
                                      <img 
                                        src={validImageUrls[currentImageIndex]}
                                        alt={`${hotel.data.name} - Image ${currentImageIndex + 1}`}
                                        className="w-full h-48 object-cover rounded-lg"
                                      />
                                      
                                      {/* Only show navigation if there are multiple images */}
                                      {validImageUrls.length > 1 && (
                                        <>
                                          {/* Left navigation button */}
                                          <button 
                                            onClick={(e) => {
                                              e.preventDefault();
                                              setCurrentImageIndex((prev) => 
                                                prev === 0 ? validImageUrls.length - 1 : prev - 1
                                              );
                                            }}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                                            aria-label="Previous image"
                                          >
                                            <ChevronLeft size={20} />
                                          </button>
                                          
                                          {/* Right navigation button */}
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              setCurrentImageIndex((prev) => 
                                                prev === validImageUrls.length - 1 ? 0 : prev + 1
                                              );
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                                            aria-label="Next image"
                                          >
                                            <ChevronRight size={20} />
                                          </button>
                                          
                                          {/* Image counter indicator */}
                                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                                            {currentImageIndex + 1} / {validImageUrls.length}
                                          </div>
                                        </>
                                      )}
                                    </>
                                  );
                                })()}
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
              
              {/* Activities Section */}
              {activitySelections && activitySelections.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <Bookmark className="h-5 w-5 text-blue-500" />
                    <h2 className="text-xl font-semibold">Activities</h2>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {activitySelections.map((activity) => (
                      <div key={activity.id} className="p-6">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{activity.data.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Sidebar - Summary */}
            <section className="space-y-6">
              {/* Summary Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden sticky top-24 z-20">
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
                          
                          <span className="text-gray-700 dark:text-gray-300">Custom Notes:</span>
                          <span className="text-right">{customNotes.length}</span>
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
                  
                  <button 
                    onClick={toggleCalendarView}
                    className="w-full mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Open Calendar View
                  </button>
                  
                  <button 
                    onClick={() => setBookModalOpen(true)}
                    className="w-full mt-4 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Book with Agent
                  </button>
                  
                  <button 
                    onClick={() => window.print()}
                    className="w-full mt-4 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Print Itinerary
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Note Modal */}
      {noteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">
                {currentNote?.id ? 'Edit Note' : 'Add Note'}
              </h2>
              <button 
                onClick={() => {
                  setNoteModalOpen(false);
                  setCurrentNote(null);
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input 
                  type="date" 
                  value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(new Date(e.target.value));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input 
                  type="text" 
                  value={currentNote?.title || ''}
                  onChange={(e) => setCurrentNote(prev => prev ? {...prev, title: e.target.value} : null)}
                  placeholder="Note title"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content
                </label>
                <textarea 
                  value={currentNote?.content || ''}
                  onChange={(e) => setCurrentNote(prev => prev ? {...prev, content: e.target.value} : null)}
                  placeholder="Enter your note details here..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['bg-amber-100 border-amber-500', 'bg-blue-100 border-blue-500', 'bg-green-100 border-green-500', 
                    'bg-purple-100 border-purple-500', 'bg-red-100 border-red-500', 'bg-gray-100 border-gray-500'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setCurrentNote(prev => prev ? {...prev, color} : null)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        currentNote?.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                      } ${color.split(' ')[0]}`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setNoteModalOpen(false);
                    setCurrentNote(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={!currentNote?.title || !selectedDate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentNote?.id ? 'Update Note' : 'Add Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <p className="font-medium text-gray-900 dark:text-white mb-2">
                  {itinerary?.name}
                </p>
                {itinerary?.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {itinerary.description}
                  </p>
                )}
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
    </div>
  );
} 