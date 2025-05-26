import { CustomNote } from '@/types/notes';
import { FlightSelection, HotelSelection } from '@/types/selections';
import { DateRange } from 'react-day-picker';

export type CalendarView = 'year' | 'month' | 'week' | 'day';

export interface CalendarEvent {
  type: 'flight' | 'hotel' | 'note';
  title: string;
  time?: string;
  details?: string;
  id?: string;
  color?: string;
}

export interface CalendarProps {
  flightSelections: FlightSelection[];
  hotelSelections: HotelSelection[];
  hotelDates: Record<string, DateRange>;
  customNotes: CustomNote[];
  onAddNote: (date: Date) => void;
}

export interface ViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  events: Record<string, CalendarEvent[]>;
  onDateSelect: (date: Date) => void;
} 