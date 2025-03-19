'use client'

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import FlightCard from '../layout/FlightCard';
import type { FlightData } from '../../types/flight';
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
}

const FlightDisplay: React.FC<FlightDisplayProps> = ({ 
  flightData = { best_flights: [], other_flights: [] }, 
  searchQuery = '',
  selections = [],
  onFlightSelect,
  hideOtherFlights = false
}) => {
  const [currentBestIndex, setCurrentBestIndex] = useState(0);
  const [showOtherFlights, setShowOtherFlights] = useState(false);

  const filteredFlights = React.useMemo(() => {
    // Early return with empty arrays if flightData is undefined
    if (!flightData) {
      return { best: [], other: [] };
    }

    const filterFlight = (flight: FlightData) => {
      if (!searchQuery) return true;
      if (!flight) return false;
      
      const searchLower = searchQuery.toLowerCase();
      return (
        (flight.flights?.[0]?.airline?.toLowerCase().includes(searchLower)) ||
        flight.flights?.some(f => f?.flight_number?.toLowerCase().includes(searchLower)) ||
        flight.flights?.some(f => 
          f?.departure_airport?.name?.toLowerCase().includes(searchLower) ||
          f?.arrival_airport?.name?.toLowerCase().includes(searchLower)
        ) ||
        flight.price?.toString().includes(searchQuery)
      );
    };

    // Ensure both arrays exist with fallbacks
    const bestFlights = Array.isArray(flightData.best_flights) ? flightData.best_flights : [];
    const otherFlights = Array.isArray(flightData.other_flights) ? flightData.other_flights : [];

    return {
      best: bestFlights.filter(filterFlight),
      other: otherFlights.filter(filterFlight)
    };
  }, [flightData, searchQuery]);

  // Reset currentBestIndex if it's out of bounds
  React.useEffect(() => {
    if (currentBestIndex >= filteredFlights.best.length) {
      setCurrentBestIndex(0);
    }
  }, [filteredFlights.best.length, currentBestIndex]);

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
      <div className="p-4 text-center text-gray-500">
        No flights available at the moment
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full">
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
                  key={`${flight.flights[0].flight_number}-${index}`}
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