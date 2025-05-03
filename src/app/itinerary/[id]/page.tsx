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

interface CustomNote {
  id: string;
  date: Date;
  title: string;
  content: string;
  color?: string;
}

type CalendarView = 'year' | 'month' | 'week' | 'day';

export default function SavedItineraryPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const [itinerary, setItinerary] = useState<SavedItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
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
    // Implementation of handleSaveNote function
  };

  const navigatePrevious = () => {
    if (calendarView === 'day') {
      setCurrentDate(prev => addDays(prev, -1));
    } else if (calendarView === 'week') {
      setCurrentDate(prev => addWeeks(prev, -1));
    } else if (calendarView === 'month') {
      setCurrentDate(prev => addMonths(prev, -1));
    } else if (calendarView === 'year') {
      setCurrentDate(prev => addYears(prev, -1));
    }
  };

  const navigateNext = () => {
    if (calendarView === 'day') {
      setCurrentDate(prev => addDays(prev, 1));
    } else if (calendarView === 'week') {
      setCurrentDate(prev => addWeeks(prev, 1));
    } else if (calendarView === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else if (calendarView === 'year') {
      setCurrentDate(prev => addYears(prev, 1));
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date: Date) => {
    const events = [];
    
    // Add flights for this date
    for (const flight of sortedFlights) {
      for (const segment of flight.data.flights) {
        const departureDate = new Date(segment.departure_airport.time);
        if (isSameDay(departureDate, date)) {
          events.push({
            type: 'flight',
            title: `Flight: ${segment.airline} ${segment.flight_number}`,
            time: formatTime(segment.departure_airport.time),
            details: `${segment.departure_airport.id} → ${segment.arrival_airport.id}`,
            color: 'bg-blue-100 border-blue-500'
          });
        }
        
        const arrivalDate = new Date(segment.arrival_airport.time);
        if (isSameDay(arrivalDate, date)) {
          events.push({
            type: 'flight',
            title: `Flight Arrival: ${segment.airline} ${segment.flight_number}`,
            time: formatTime(segment.arrival_airport.time),
            details: `${segment.departure_airport.id} → ${segment.arrival_airport.id}`,
            color: 'bg-green-100 border-green-500'
          });
        }
      }
    }
    
    // Add hotel check-ins and check-outs
    for (const hotel of hotelSelections) {
      const dates = hotelDates[hotel.id];
      if (dates?.from && isSameDay(dates.from, date)) {
        events.push({
          type: 'hotel',
          title: `Check-in: ${hotel.data.name}`,
          time: '3:00 PM', // Default check-in time
          details: hotel.data.address || '',
          color: 'bg-purple-100 border-purple-500'
        });
      }
      
      if (dates?.to && isSameDay(dates.to, date)) {
        events.push({
          type: 'hotel',
          title: `Check-out: ${hotel.data.name}`,
          time: '11:00 AM', // Default check-out time
          details: hotel.data.address || '',
          color: 'bg-red-100 border-red-500'
        });
      }
    }
    
    // Add custom notes for this date
    const notesForDate = customNotes.filter(note => isSameDay(note.date, date));
    for (const note of notesForDate) {
      events.push({
        type: 'note',
        title: note.title,
        details: note.content,
        id: note.id,
        color: note.color || 'bg-amber-100 border-amber-500'
      });
    }
    
    return events.sort((a, b) => {
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      return 0;
    });
  };

  const renderCalendar = () => {
    if (calendarView === 'day') {
      return renderDayView();
    } else if (calendarView === 'week') {
      return renderWeekView();
    } else if (calendarView === 'month') {
      return renderMonthView();
    } else {
      return renderYearView();
    }
  };

  const renderDayView = () => {
    const events = getEventsForDate(currentDate);
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h2>
          
          {events.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No events scheduled for this day</p>
              <button 
                onClick={() => {
                  setSelectedDate(currentDate);
                  setCurrentNote({ id: '', date: currentDate, title: '', content: '', color: 'bg-amber-100 border-amber-500' });
                  setNoteModalOpen(true);
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Add Note
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event, index) => (
                <div 
                  key={index} 
                  className={`p-4 border-l-4 rounded-r-lg ${event.color || 'bg-gray-100 border-gray-500'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{event.title}</h3>
                      {event.time && <p className="text-sm text-gray-600 dark:text-gray-400">{event.time}</p>}
                      {event.details && <p className="mt-1 text-gray-700 dark:text-gray-300">{event.details}</p>}
                    </div>
                    
                    {event.type === 'note' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const note = customNotes.find(n => n.id === event.id);
                            if (note) {
                              setCurrentNote({...note, color: note.color || 'bg-amber-100 border-amber-500'});
                              setSelectedDate(note.date);
                              setNoteModalOpen(true);
                            }
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => {
                  setSelectedDate(currentDate);
                  setCurrentNote({ id: '', date: currentDate, title: '', content: '', color: 'bg-amber-100 border-amber-500' });
                  setNoteModalOpen(true);
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Add Note
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const endDate = endOfWeek(currentDate);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(startDate, i);
      days.push(day);
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
          </h2>
          
          <div className="grid grid-cols-7 gap-4">
            {days.map((day, index) => {
              const events = getEventsForDate(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              
              return (
                <div 
                  key={index} 
                  className={`border rounded-lg overflow-hidden ${
                    isToday ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
                  } ${
                    isSelected ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div 
                    className={`p-2 text-center font-medium ${
                      isToday ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    {format(day, 'EEE')}
                    <div className={isToday ? 'text-white' : 'text-gray-600 dark:text-gray-400'}>
                      {format(day, 'd')}
                    </div>
                  </div>
                  
                  <div 
                    className="p-2 min-h-[100px] cursor-pointer"
                    onClick={() => {
                      setSelectedDate(day);
                      setCurrentDate(day);
                      setCalendarView('day');
                    }}
                  >
                    {events.length > 0 ? (
                      <div className="space-y-1">
                        {events.slice(0, 3).map((event, idx) => (
                          <div 
                            key={idx} 
                            className={`p-1 text-xs rounded truncate ${event.color || 'bg-gray-100'}`}
                            title={event.title}
                          >
                            {event.time && <span className="font-medium mr-1">{event.time}</span>}
                            {event.title}
                          </div>
                        ))}
                        {events.length > 3 && (
                          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                            +{events.length - 3} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                        <Plus size={16} className="opacity-50" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);
    const startDate = startOfWeek(firstDayOfMonth);
    
    const days = [];
    let day = startDate;
    
    // Generate 6 weeks (42 days) to ensure we cover the month
    for (let i = 0; i < 42; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">{format(currentDate, 'MMMM yyyy')}</h2>
          
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, index) => (
              <div key={index} className="text-center font-medium text-gray-500 dark:text-gray-400 p-2">
                {dayName}
              </div>
            ))}
            
            {days.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const events = getEventsForDate(day);
              
              return (
                <div 
                  key={index} 
                  className={`border rounded-lg overflow-hidden ${
                    !isCurrentMonth ? 'opacity-40' : ''
                  } ${
                    isToday ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
                  } ${
                    isSelected ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedDate(day);
                    setCurrentDate(day);
                    setCalendarView('day');
                  }}
                >
                  <div 
                    className={`p-1 text-center ${
                      isToday ? 'bg-blue-500 text-white' : ''
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                  
                  <div className="min-h-[40px] p-1">
                    {events.length > 0 && (
                      <div className="space-y-1">
                        {events.slice(0, 2).map((event, idx) => (
                          <div 
                            key={idx} 
                            className={`h-2 rounded-full ${
                              event.type === 'flight' ? 'bg-blue-500' :
                              event.type === 'hotel' ? 'bg-purple-500' :
                              'bg-amber-500'
                            }`}
                            title={event.title}
                          />
                        ))}
                        {events.length > 2 && (
                          <div className="text-[10px] text-center text-gray-500">
                            +{events.length - 2}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const months = [];
    
    for (let i = 0; i < 12; i++) {
      months.push(new Date(currentDate.getFullYear(), i, 1));
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">{format(currentDate, 'yyyy')}</h2>
          
          <div className="grid grid-cols-3 gap-6">
            {months.map((month, index) => {
              const isCurrentMonth = month.getMonth() === new Date().getMonth() && 
                                    month.getFullYear() === new Date().getFullYear();
              
              return (
                <div 
                  key={index} 
                  className={`border rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 ${
                    isCurrentMonth ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => {
                    setCurrentDate(month);
                    setCalendarView('month');
                  }}
                >
                  <div 
                    className={`p-2 text-center font-medium ${
                      isCurrentMonth ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    {format(month, 'MMMM')}
                  </div>
                  
                  <div className="p-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    {format(month, 'yyyy')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const toggleCalendarView = () => {
    setShowCalendarView(!showCalendarView);
  };

  const getCurrentViewName = () => {
    switch(calendarView) {
      case 'day': return 'Day View';
      case 'week': return 'Week View';
      case 'month': return 'Month View';
      case 'year': return 'Year View';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      {/* Header - Adjust positioning to account for navbar */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => showCalendarView ? toggleCalendarView() : router.push('/my-itineraries')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{itinerary.name}</h1>
                {itinerary.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{itinerary.description}</p>
                )}
              </div>
            </div>
            
            {/* View Toggle Button */}
            <button
              onClick={toggleCalendarView}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {showCalendarView ? (
                <>
                  <ArrowLeft size={16} />
                  Back to Itinerary
                </>
              ) : (
                <>
                  <Calendar size={16} />
                  Calendar View
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8 pt-6 sm:px-6 lg:px-8">
        {showCalendarView ? (
          <div className="space-y-6">
            {/* Calendar Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* View selector */}
                <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setCalendarView('year')}
                    className={`px-3 py-1 text-sm rounded-md ${
                      calendarView === 'year' 
                        ? 'bg-white dark:bg-gray-600 shadow-sm font-medium' 
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Year
                  </button>
                  <button
                    onClick={() => setCalendarView('month')}
                    className={`px-3 py-1 text-sm rounded-md ${
                      calendarView === 'month' 
                        ? 'bg-white dark:bg-gray-600 shadow-sm font-medium' 
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setCalendarView('week')}
                    className={`px-3 py-1 text-sm rounded-md ${
                      calendarView === 'week' 
                        ? 'bg-white dark:bg-gray-600 shadow-sm font-medium' 
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setCalendarView('day')}
                    className={`px-3 py-1 text-sm rounded-md ${
                      calendarView === 'day' 
                        ? 'bg-white dark:bg-gray-600 shadow-sm font-medium' 
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Day
                  </button>
                </div>
                
                {/* Navigation controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={navigatePrevious}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    aria-label={`Previous ${calendarView}`}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <button
                    onClick={navigateToday}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center gap-1"
                  >
                    <Calendar size={16} />
                    Today ({getCurrentViewName()})
                  </button>
                  
                  <button
                    onClick={navigateNext}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    aria-label={`Next ${calendarView}`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Calendar */}
            {renderCalendar()}
            
            {/* Legend */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <h3 className="font-medium mb-3">Legend</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Flight</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm">Arrival</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                  <span className="text-sm">Hotel</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                  <span className="text-sm">Note</span>
                </div>
              </div>
            </div>
            
            {/* Quick Add Note */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold">Quick Add Note</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
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
                  
                  <button 
                    onClick={() => {
                      if (selectedDate) {
                        setCurrentNote({ id: '', date: selectedDate, title: '', content: '', color: 'bg-amber-100 border-amber-500' });
                        setNoteModalOpen(true);
                      } else {
                        alert('Please select a date first');
                      }
                    }}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    disabled={!selectedDate}
                  >
                    <Plus size={16} />
                    Add Note for {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Selected Date'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Column */}
            <section className="lg:col-span-2 space-y-6">
              {/* Flights Section */}
              {sortedFlights.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Plane className="h-5 w-5 text-blue-500" />
                      <h2 className="text-xl font-semibold">Flights</h2>
                    </div>
                    <button 
                      onClick={() => {
                        toggleCalendarView();
                        setCalendarView('day');
                        if (sortedFlights.length > 0 && sortedFlights[0].data.flights.length > 0) {
                          const firstFlightDate = new Date(sortedFlights[0].data.flights[0].departure_airport.time);
                          setCurrentDate(firstFlightDate);
                          setSelectedDate(firstFlightDate);
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Calendar size={14} />
                      View in Calendar
                    </button>
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
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hotel className="h-5 w-5 text-blue-500" />
                      <h2 className="text-xl font-semibold">Accommodations</h2>
                    </div>
                    <button 
                      onClick={() => {
                        toggleCalendarView();
                        setCalendarView('month');
                        if (hotelSelections.length > 0 && hotelDates[hotelSelections[0].id]?.from) {
                          const firstHotelDate = hotelDates[hotelSelections[0].id].from;
                          setCurrentDate(firstHotelDate);
                          setSelectedDate(firstHotelDate);
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Calendar size={14} />
                      View in Calendar
                    </button>
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
              
              {/* Activities Section */}
              {activitySelections.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <Bookmark className="h-5 w-5 text-blue-500" />
                    <h2 className="text-xl font-semibold">Activities & Notes</h2>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {activitySelections.map((activity) => (
                      <div key={activity.id} className="p-6">
                        {/* Activity content (unchanged) */}
                        {/* ... */}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Custom Notes Section */}
              {customNotes.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <h2 className="text-xl font-semibold">Your Notes</h2>
                    </div>
                    <button 
                      onClick={() => {
                        toggleCalendarView();
                        setCalendarView('month');
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Calendar size={14} />
                      View in Calendar
                    </button>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {customNotes.map((note) => (
                      <div key={note.id} className={`p-6 ${note.color || 'bg-amber-50 dark:bg-amber-900/20'}`}>
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium text-lg">{note.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              {format(note.date, 'EEEE, MMMM d, yyyy')}
                            </p>
                            <p className="whitespace-pre-wrap">{note.content}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setCurrentNote({...note, color: note.color || 'bg-amber-100 border-amber-500'});
                                setSelectedDate(note.date);
                                setNoteModalOpen(true);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Sidebar - Summary */}
            <section className="space-y-6">
              {/* Summary Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden sticky top-32">
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
              
              {/* Quick Add Note */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold">Quick Add Note</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
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
                    
                    <button 
                      onClick={() => {
                        if (selectedDate) {
                          setCurrentNote({ id: '', date: selectedDate, title: '', content: '', color: 'bg-amber-100 border-amber-500' });
                          setNoteModalOpen(true);
                        } else {
                          alert('Please select a date first');
                        }
                      }}
                      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      disabled={!selectedDate}
                    >
                      <Plus size={16} />
                      Add Note
                    </button>
                  </div>
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