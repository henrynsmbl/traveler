export interface Airport {
    name: string;
    id: string;
    time: string;
    date: string;
  }
  
  export interface Flight {
    departure_airport: Airport;
    arrival_airport: Airport;
    duration: number;
    airplane: string;
    airline: string;
    airline_logo: string;
    travel_class: string;
    flight_number: string;
    legroom: string;
    extensions: string[];
    overnight?: boolean;
    often_delayed_by_over_30_min?: boolean;
    price?: number;
  }
  
  export interface Layover {
    duration: number;
    name: string;
    id: string;
    overnight?: boolean;
  }
  
  export interface CarbonEmissions {
    this_flight: number;
    typical_for_this_route: number;
    difference_percent: number;
  }
  
  export interface FlightData {
    flights: Flight[];
    layovers?: Layover[];
    total_duration: number;
    carbon_emissions: CarbonEmissions;
    price: number;
    type: string;
    airline_logo: string;
    extensions: string[];
  }
  
  export interface FlightFilters {
    airlines?: string[];
    maxPrice?: number;
    maxDuration?: number;
    departureTime?: string;
    stops?: number;
    travelClass?: string;
  }