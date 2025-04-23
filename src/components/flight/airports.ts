export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
}

// Export a subset of major airports for client-side use
export const MAJOR_AIRPORTS: Airport[] = [
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA' },
  { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'USA' },
  { code: 'ORD', name: 'O\'Hare International Airport', city: 'Chicago', country: 'USA' },
  { code: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'USA' },
  { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK' },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE' },
  { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'China' },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
  { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan' },
  { code: 'SYD', name: 'Sydney Airport', city: 'Sydney', country: 'Australia' },
  { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada' },
]; 