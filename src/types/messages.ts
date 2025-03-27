// types/messages.ts
import type { TableData } from '@/components/chat/Tables';
import type { FlightData } from './flight';
import type { HotelData } from './hotel';

export type ContentType = 'text' | 'flight' | 'hotel';

export type FlightContent = {
  best_flights: FlightData[];
  other_flights: FlightData[];
  search_metadata?: {
    departure: string;
    arrival: string;
    date: string;
    return_date?: string;
    passengers?: number;
  };
}

export type HotelContent = {
  properties: HotelData[];
  search_metadata?: {
    location: string;
    check_in?: string;
    check_out?: string;
    guests?: number;
    rooms?: number;
  };
}

export interface Citation {
  url: string;
  title?: string;
  text?: string;
  source?: string;
}

export interface MessageContent {
  type: ContentType;
  content: string | TableData | FlightContent | HotelContent;
  citations?: Citation[];
}

export interface Message {
  contents: Array<MessageContent>;
  isUser: boolean;
  timestamp: Date;
  components?: {
    TutorialHighlight?: React.ComponentType<{ children: React.ReactNode }>;
  };
}

export interface SearchAPIResponse {
  citations: Citation[];
  response: string;
  flights?: {
    best_flights: FlightData[];
    other_flights: FlightData[];
    search_metadata?: {
      departure: string;
      arrival: string;
      date: string;
      return_date?: string;
      passengers?: number;
      google_flights_url?: string;
    };
  };
  hotels?: {
    properties: HotelData[];
    search_metadata?: {
      location: string;
      check_in?: string;
      check_out?: string;
      guests?: number;
      rooms?: number;
      google_hotels_url?: string;
    };
  };
}
