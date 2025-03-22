'use client'

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import FlightCard from '../layout/FlightCard';
import FlightFilters from './FlightFilters';
import type { FlightData, FlightFilters as FlightFiltersType } from '../../types/flight';
import type { Selection } from '../../types/selections';

interface FlightDisplayProps {
  flightData: {
    best_flights: FlightData[];
    other_flights: FlightData[];
  };
  searchQuery?: string;
  selections: Selection[];
  onFlightSelect: (flight: FlightData) => void;
  hideOtherFlights?: boolean;
  onFilterUpdate?: (filters: FlightFiltersType) => void;
}

const FlightDisplay: React.FC<FlightDisplayProps> = ({ 
  flightData = { best_flights: [], other_flights: [] }, 
  searchQuery = '',
  selections = [],
  onFlightSelect,
  hideOtherFlights = false,
  onFilterUpdate
}) => {
  const [currentBestIndex, setCurrentBestIndex] = useState(0);
  const [showOtherFlights, setShowOtherFlights] = useState(false);
  const [filters, setFilters] = useState<FlightFiltersType>({});
  const [filteredFlights, setFilteredFlights] = useState<{ best: FlightData[], other: FlightData[] }>({ 
    best: [], 
    other: [] 
  });

  // Extract unique airlines from all flights for the filter dropdown
  const availableAirlines = React.useMemo(() => {
    const allFlights = [...(flightData.best_flights || []), ...(flightData.other_flights || [])];
    const airlines = new Set<string>();
    
    allFlights.forEach(flightData => {
      if (flightData && flightData.flights) {
        flightData.flights.forEach(flight => {
          if (flight && flight.airline) {
            airlines.add(flight.airline);
          }
        });
      }
    });
    
    return Array.from(airlines).sort();
  }, [flightData]);

  // Find the maximum price in the dataset for the price slider
  const maxPrice = React.useMemo(() => {
    const allFlights = [...(flightData.best_flights || []), ...(flightData.other_flights || [])];
    if (allFlights.length === 0) return 2000; // Default max price
    
    return Math.max(...allFlights.map(flight => flight.price || 0)) + 100; // Add 100 for slider buffer
  }, [flightData]);

  // Apply filters and search query to flights
  useEffect(() => {
    // Early return with empty arrays if flightData is undefined
    if (!flightData) {
      setFilteredFlights({ best: [], other: [] });
      return;
    }

    const filterFlight = (flight: FlightData) => {
      if (!flight || !flight.flights) return false;
      
      // Apply search query filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = (
          (flight.flights[0]?.airline?.toLowerCase().includes(searchLower)) ||
          flight.flights?.some(f => f?.flight_number?.toLowerCase().includes(searchLower)) ||
          flight.flights?.some(f => 
            f?.departure_airport?.name?.toLowerCase().includes(searchLower) ||
            f?.arrival_airport?.name?.toLowerCase().includes(searchLower)
          ) ||
          flight.price?.toString().includes(searchQuery)
        );
        
        if (!matchesSearch) return false;
      }
      
      // Apply price filter
      if (filters.maxPrice !== undefined && flight.price > filters.maxPrice) {
        return false;
      }
      
      // Apply duration filter
      if (filters.maxDuration !== undefined && flight.total_duration > filters.maxDuration) {
        return false;
      }
      
      // Apply stops filter
      if (filters.stops !== undefined && filters.stops !== -1) {
        const flightStops = flight.flights.length - 1;
        if (flightStops !== filters.stops) {
          return false;
        }
      }
      
      // Apply airline filter
      if (filters.airlines && filters.airlines.length > 0) {
        const flightAirlines = flight.flights.map(f => f.airline);
        if (!filters.airlines.some(airline => flightAirlines.includes(airline))) {
          return false;
        }
      }
      
      // Apply travel class filter
      if (filters.travelClass) {
        if (!flight.flights.some(f => 
          f.travel_class && f.travel_class.toLowerCase() === filters.travelClass?.toLowerCase()
        )) {
          return false;
        }
      }
      
      // Apply departure time filter
      if (filters.departureTime) {
        const departureHour = parseInt(flight.flights[0].departure_airport.time.split(' ')[1].split(':')[0]);
        
        switch(filters.departureTime) {
          case 'morning':
            if (!(departureHour >= 5 && departureHour < 12)) return false;
            break;
          case 'afternoon':
            if (!(departureHour >= 12 && departureHour < 17)) return false;
            break;
          case 'evening':
            if (!(departureHour >= 17 && departureHour < 21)) return false;
            break;
          case 'night':
            if (!((departureHour >= 21) || (departureHour < 5))) return false;
            break;
        }
      }
      
      return true;
    };

    // Ensure both arrays exist with fallbacks
    const bestFlights = Array.isArray(flightData.best_flights) ? flightData.best_flights : [];
    const otherFlights = Array.isArray(flightData.other_flights) ? flightData.other_flights : [];

    setFilteredFlights({
      best: bestFlights.filter(filterFlight),
      other: otherFlights.filter(filterFlight)
    });
  }, [flightData, searchQuery, filters]);

  // Reset currentBestIndex if it's out of bounds
  useEffect(() => {
    if (currentBestIndex >= filteredFlights.best.length) {
      setCurrentBestIndex(0);
    }
  }, [filteredFlights.best.length, currentBestIndex]);

  const handleFilterChange = (newFilters: FlightFiltersType) => {
    setFilters(newFilters);
    
    // Call the parent component's filter update handler if provided
    if (onFilterUpdate) {
      onFilterUpdate(newFilters);
    }
  };

  const handlePrevBest = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentBestIndex(current => 
      current > 0 ? current - 1 : filteredFlights.best.length - 1
    );
  };

  const handleNextBest = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentBestIndex(current => 
      current < filteredFlights.best.length - 1 ? current + 1 : 0
    );
  };

  const isFlightSelected = (flight: FlightData) => {
    if (!flight || !selections) return false;
    return selections.some(selection => 
      selection?.type === 'flight' && 
      selection?.data?.flights?.[0]?.flight_number === flight.flights?.[0]?.flight_number
    );
  };

  // If there's no valid data, show a message instead of empty sections
  if (!flightData || (!filteredFlights.best.length && !filteredFlights.other.length)) {
    return (
      <div className="space-y-6 max-w-full">
        <FlightFilters 
          onFilterChange={handleFilterChange}
          airlines={availableAirlines}
          maxPriceRange={maxPrice}
        />
        <div className="p-4 text-center text-gray-500 bg-white rounded-lg border">
          No flights match your current filters
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* Filters Section */}
      <FlightFilters 
        onFilterChange={handleFilterChange}
        airlines={availableAirlines}
        maxPriceRange={maxPrice}
      />

      {/* Best Flights with Pagination */}
      {filteredFlights.best.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Best Flights</h2>
          <div className={`relative ${filteredFlights.best.length > 1 ? 'px-12' : ''}`}>
            <div className="flex items-center">
              {filteredFlights.best.length > 1 && (
                <button
                  onClick={handlePrevBest}
                  className="absolute left-0 z-10 p-2 rounded-full bg-white shadow-lg hover:bg-gray-100"
                  aria-label="Previous flight"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
              
              <div className="w-full">
                <FlightCard 
                  flightData={filteredFlights.best[currentBestIndex]}
                  isSelected={isFlightSelected(filteredFlights.best[currentBestIndex])}
                  onSelect={onFlightSelect}
                />
              </div>
              
              {filteredFlights.best.length > 1 && (
                <button
                  onClick={handleNextBest}
                  className="absolute right-0 z-10 p-2 rounded-full bg-white shadow-lg hover:bg-gray-100"
                  aria-label="Next flight"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </div>
            
            {filteredFlights.best.length > 1 && (
              <div className="flex justify-center items-center mt-4 space-x-1">
                {filteredFlights.best.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-all duration-200 ${
                      index === currentBestIndex 
                        ? 'bg-blue-600 w-4' 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other Flights Section */}
      {!hideOtherFlights && filteredFlights.other.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <button
            onClick={() => setShowOtherFlights(!showOtherFlights)}
            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
          >
            <h2 className="text-xl font-semibold">
              Other Flights ({filteredFlights.other.length})
            </h2>
            {showOtherFlights ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
          
          {showOtherFlights && (
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <div className="p-4 space-y-4">
              {filteredFlights.other.map((flight, index) => (
                <FlightCard 
                  key={`${flight.flights?.[0]?.flight_number || index}-${index}`}
                  flightData={flight}
                  isSelected={isFlightSelected(flight)}
                  onSelect={onFlightSelect}
                />
              ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FlightDisplay;