'use client'

import React, { useState } from 'react';
import { ChevronDown, X, Filter } from 'lucide-react';
import type { FlightFilters as FlightFiltersType } from '../../types/flight';

interface FlightFiltersProps {
  onFilterChange: (filters: FlightFiltersType) => void;
  airlines: string[]; // Available airlines for filtering
  maxPriceRange: number; // Maximum price in the dataset
}

const FlightFilters: React.FC<FlightFiltersProps> = ({
  onFilterChange,
  airlines = [],
  maxPriceRange = 2000,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FlightFiltersType>({
    airlines: [],
    maxPrice: maxPriceRange,
    maxDuration: 24 * 60, // 24 hours in minutes
    departureTime: undefined,
    stops: -1, // -1 means any number of stops
    travelClass: undefined,
  });

  const handleFilterChange = (newFilters: Partial<FlightFiltersType>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const clearFilters = () => {
    const resetFilters: FlightFiltersType = {
      airlines: [],
      maxPrice: maxPriceRange,
      maxDuration: 24 * 60,
      departureTime: undefined,
      stops: -1,
      travelClass: undefined,
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const toggleAirline = (airline: string) => {
    const currentAirlines = filters.airlines || [];
    const updatedAirlines = currentAirlines.includes(airline)
      ? currentAirlines.filter(a => a !== airline)
      : [...currentAirlines, airline];
    
    handleFilterChange({ airlines: updatedAirlines });
  };

  // Updated function to properly check if any filters are active
  const hasActiveFilters = () => {
    return (
      (filters.airlines && filters.airlines.length > 0) ||
      (filters.departureTime !== undefined) ||
      (filters.travelClass !== undefined) ||
      (filters.stops !== -1) ||
      (filters.maxPrice !== maxPriceRange) ||
      (filters.maxDuration !== 24 * 60)
    );
  };

  return (
    <div className="mb-6 border rounded-lg bg-white shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex justify-between items-center"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <span className="font-medium">Filter Flights</span>
          {hasActiveFilters() && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Filters applied
            </span>
          )}
        </div>
        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="p-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Price Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Price (${filters.maxPrice})
              </label>
              <input
                type="range"
                min="0"
                max={maxPriceRange}
                step="50"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange({ maxPrice: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$0</span>
                <span>${maxPriceRange}</span>
              </div>
            </div>

            {/* Duration Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Duration ({Math.floor(filters.maxDuration! / 60)}h {filters.maxDuration! % 60}m)
              </label>
              <input
                type="range"
                min="60"
                max="1440" // 24 hours in minutes
                step="30"
                value={filters.maxDuration}
                onChange={(e) => handleFilterChange({ maxDuration: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1h</span>
                <span>24h</span>
              </div>
            </div>

            {/* Stops Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stops
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFilterChange({ stops: -1 })}
                  className={`px-3 py-1 text-sm rounded-full ${
                    filters.stops === -1 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Any
                </button>
                <button
                  onClick={() => handleFilterChange({ stops: 0 })}
                  className={`px-3 py-1 text-sm rounded-full ${
                    filters.stops === 0 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Nonstop
                </button>
                <button
                  onClick={() => handleFilterChange({ stops: 1 })}
                  className={`px-3 py-1 text-sm rounded-full ${
                    filters.stops === 1 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  1 Stop
                </button>
              </div>
            </div>

            {/* Departure Time Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departure Time
              </label>
              <div className="flex gap-2 flex-wrap">
                {['morning', 'afternoon', 'evening', 'night'].map(time => (
                  <button
                    key={time}
                    onClick={() => handleFilterChange({ 
                      departureTime: filters.departureTime === time ? undefined : time 
                    })}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filters.departureTime === time 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {time.charAt(0).toUpperCase() + time.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Travel Class Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Travel Class
              </label>
              <div className="flex gap-2 flex-wrap">
                {['economy', 'premium economy', 'business', 'first'].map(travelClass => (
                  <button
                    key={travelClass}
                    onClick={() => handleFilterChange({ 
                      travelClass: filters.travelClass === travelClass ? undefined : travelClass 
                    })}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filters.travelClass === travelClass 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {travelClass.charAt(0).toUpperCase() + travelClass.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Airlines Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Airlines
              </label>
              <div className="max-h-32 overflow-y-auto pr-2 space-y-1">
                {airlines.map(airline => (
                  <div key={airline} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`airline-${airline}`}
                      checked={(filters.airlines || []).includes(airline)}
                      onChange={() => toggleAirline(airline)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor={`airline-${airline}`} className="ml-2 text-sm text-gray-700">
                      {airline}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <X className="h-4 w-4" />
              Clear all filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightFilters; 