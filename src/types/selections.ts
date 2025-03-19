import type { FlightData } from './flight';
import type { HotelData } from './hotel';

export interface ActivitySelection {
  id: string;
  type: 'activity';
  data: {
    description: string;
    addedAt: Date;
    notes?: string;
  };
}

export interface FlightSelection {
  id: string;
  type: 'flight';
  data: FlightData;
  addedAt: Date;
}

export interface HotelSelection {
  id: string;
  type: 'hotel';
  data: HotelData;
  addedAt: Date;
}

export type Selection = FlightSelection | HotelSelection | ActivitySelection;