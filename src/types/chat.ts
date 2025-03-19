import type { Message } from './messages';

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  selections?: Selection[];
}

export interface Selection {
  id: string;
  type: 'flight' | 'hotel';
  data: FlightSelectionData | HotelSelectionData;
  addedAt: Date;
}

export interface FlightSelectionData {
  flights: Array<{
    flight_number: string;
    departure: {
      airport: string;
      time: Date;
    };
    arrival: {
      airport: string;
      time: Date;
    };
    airline: string;
    price: {
      amount: number;
      currency: string;
    };
    cabin_class: string;
    [key: string]: any;
  }>;
}

export interface HotelSelectionData {
  name: string;
  address: string;
  check_in: Date;
  check_out: Date;
  room_type: string;
  price: {
    amount: number;
    currency: string;
    per_night: boolean;
  };
  amenities: string[];
  rating?: number;
  images?: string[];
  [key: string]: any;
}