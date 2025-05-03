import { format, addDays, addWeeks, addMonths, addYears, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { CalendarEvent, CalendarView } from './types';
import { FlightSelection, HotelSelection } from '@/types/selections';
import { CustomNote } from '@/types/notes';

// Helper functions from your main component
export const formatTime = (dateTimeStr: string) => {
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

export const getEventsForDate = (
  date: Date, 
  flightSelections: FlightSelection[], 
  hotelSelections: HotelSelection[],
  hotelDates: Record<string, { from: Date; to: Date }>,
  customNotes: CustomNote[]
): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  
  // Add flights for this date
  for (const flight of flightSelections) {
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

export const navigateDate = (currentDate: Date, view: CalendarView, direction: 1 | -1): Date => {
  if (view === 'day') {
    return addDays(currentDate, direction);
  } else if (view === 'week') {
    return addWeeks(currentDate, direction);
  } else if (view === 'month') {
    return addMonths(currentDate, direction);
  } else {
    return addYears(currentDate, direction);
  }
};

export const getCurrentViewName = (view: CalendarView): string => {
  switch(view) {
    case 'day': return 'Day View';
    case 'week': return 'Week View';
    case 'month': return 'Month View';
    case 'year': return 'Year View';
  }
};

export const checkMonthHasEvents = (
  month: Date, 
  flightSelections: FlightSelection[], 
  hotelSelections: HotelSelection[],
  hotelDates: Record<string, { from: Date; to: Date }>,
  customNotes: CustomNote[]
): boolean => {
  const firstDay = startOfMonth(month);
  const lastDay = endOfMonth(month);
  let currentDay = firstDay;
  
  while (currentDay <= lastDay) {
    if (getEventsForDate(currentDay, flightSelections, hotelSelections, hotelDates, customNotes).length > 0) {
      return true;
    }
    currentDay = addDays(currentDay, 1);
  }
  
  return false;
}; 