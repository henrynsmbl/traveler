import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';
import YearView from './YearView';
import { CalendarProps, CalendarView, CalendarEvent } from './types';
import { getEventsForDate, navigateDate, getCurrentViewName } from './utils';

interface CalendarProps {
  flightSelections: FlightSelection[];
  hotelSelections: HotelSelection[];
  hotelDates: Record<string, DateRange>;
  customNotes: CustomNote[];
  onAddNote: (date: Date) => void;
  onDeleteNote: (noteId: string) => Promise<void>;
  initialDate?: Date | null;
}

const CalendarContainer: React.FC<CalendarProps> = ({ 
  flightSelections, 
  hotelSelections, 
  hotelDates, 
  customNotes,
  onAddNote,
  onDeleteNote,
  initialDate
}) => {
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventsByDate, setEventsByDate] = useState<Record<string, CalendarEvent[]>>({});
  
  // Calculate all events when dependencies change
  useEffect(() => {
    const newEvents: Record<string, CalendarEvent[]> = {};
    
    // Collect all dates that might have events
    const relevantDates = new Set<string>();
    
    // Add flight dates
    flightSelections.forEach(flight => {
      flight.data.flights.forEach(segment => {
        const departureDate = format(new Date(segment.departure_airport.time), 'yyyy-MM-dd');
        const arrivalDate = format(new Date(segment.arrival_airport.time), 'yyyy-MM-dd');
        relevantDates.add(departureDate);
        relevantDates.add(arrivalDate);
      });
    });
    
    // Add hotel dates
    hotelSelections.forEach(hotel => {
      if (hotelDates[hotel.id]?.from) {
        relevantDates.add(format(hotelDates[hotel.id].from, 'yyyy-MM-dd'));
      }
      if (hotelDates[hotel.id]?.to) {
        relevantDates.add(format(hotelDates[hotel.id].to, 'yyyy-MM-dd'));
      }
    });
    
    // Add note dates
    customNotes.forEach(note => {
      relevantDates.add(format(note.date, 'yyyy-MM-dd'));
    });
    
    // Calculate events for each relevant date
    relevantDates.forEach(dateStr => {
      const date = new Date(dateStr);
      newEvents[dateStr] = getEventsForDate(date, flightSelections, hotelSelections, hotelDates, customNotes);
    });
    
    setEventsByDate(newEvents);
  }, [flightSelections, hotelSelections, hotelDates, customNotes]);
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentDate(date);
    
    if (calendarView === 'year') {
      setCalendarView('month');
    } else if (calendarView === 'month') {
      setCalendarView('day');
    }
    
    // If it's a day view, trigger add note
    if (calendarView === 'day') {
      onAddNote(date);
    }
  };
  
  const navigatePrevious = () => {
    setCurrentDate(prev => navigateDate(prev, calendarView, -1));
  };
  
  const navigateNext = () => {
    setCurrentDate(prev => navigateDate(prev, calendarView, 1));
  };
  
  const navigateToday = () => {
    setCurrentDate(new Date());
  };
  
  const renderCalendar = () => {
    switch (calendarView) {
      case 'day':
        return (
          <DayView 
            currentDate={currentDate} 
            selectedDate={selectedDate} 
            events={eventsByDate} 
            onDateSelect={handleDateSelect} 
          />
        );
      case 'week':
        return (
          <WeekView 
            currentDate={currentDate} 
            selectedDate={selectedDate} 
            events={eventsByDate} 
            onDateSelect={handleDateSelect} 
          />
        );
      case 'month':
        return (
          <MonthView 
            currentDate={currentDate} 
            selectedDate={selectedDate} 
            events={eventsByDate} 
            onDateSelect={handleDateSelect} 
          />
        );
      case 'year':
        return (
          <YearView 
            currentDate={currentDate} 
            selectedDate={selectedDate} 
            events={eventsByDate} 
            onDateSelect={handleDateSelect} 
          />
        );
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Calendar Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 max-w-md mx-auto">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={navigatePrevious}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            aria-label={`Previous ${calendarView}`}
          >
            <ChevronLeft size={20} />
          </button>
          
          {/* View selector */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => {
                if (calendarView === 'year') {
                  navigateToday();
                } else {
                  setCalendarView('year');
                }
              }}
              className={`px-3 py-1 text-sm rounded-md ${
                calendarView === 'year' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm font-medium' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Year
            </button>
            <button
              onClick={() => {
                if (calendarView === 'month') {
                  navigateToday();
                } else {
                  setCalendarView('month');
                }
              }}
              className={`px-3 py-1 text-sm rounded-md ${
                calendarView === 'month' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm font-medium' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => {
                if (calendarView === 'week') {
                  navigateToday();
                } else {
                  setCalendarView('week');
                }
              }}
              className={`px-3 py-1 text-sm rounded-md ${
                calendarView === 'week' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm font-medium' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => {
                if (calendarView === 'day') {
                  navigateToday();
                } else {
                  setCalendarView('day');
                }
              }}
              className={`px-3 py-1 text-sm rounded-md ${
                calendarView === 'day' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm font-medium' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Day
            </button>
          </div>
          
          <button
            onClick={navigateNext}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            aria-label={`Next ${calendarView}`}
          >
            <ChevronRight size={20} />
          </button>
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
    </div>
  );
};

export default CalendarContainer; 