'use client'

import React, { useState } from 'react'
import { Plane } from 'lucide-react'

interface FlightSearchButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const FlightSearchButton: React.FC<FlightSearchButtonProps> = ({ onClick, isOpen }) => (
  <button
    onClick={onClick}
    className={`p-1.5 rounded-md transition-colors ${
      isOpen 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
    }`}
    aria-label="Search Flights"
  >
    <Plane size={16} />
  </button>
);

interface FlightSearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlightSearchDropdown: React.FC<FlightSearchDropdownProps> = ({ isOpen, onClose }) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway'>('roundtrip');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      origin,
      destination,
      departDate,
      returnDate,
      passengers,
      tripType
    });
    onClose();
  };

  return (
    <div className="absolute top-12 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-50 border-b border-gray-200 dark:border-gray-700">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center">
            <Plane size={16} className="mr-1.5" /> Flight Search
          </h3>
          <button 
            type="button" 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <span className="text-xs">✕</span>
          </button>
        </div>
        
        <div className="grid grid-cols-12 gap-2">
          {/* Trip type selector */}
          <div className="col-span-12 sm:col-span-2 flex space-x-1">
            <button
              type="button"
              className={`flex-1 px-2 py-1.5 text-xs rounded-md ${
                tripType === 'roundtrip' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
              onClick={() => setTripType('roundtrip')}
            >
              Round Trip
            </button>
            <button
              type="button"
              className={`flex-1 px-2 py-1.5 text-xs rounded-md ${
                tripType === 'oneway' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
              onClick={() => setTripType('oneway')}
            >
              One Way
            </button>
          </div>
          
          {/* Origin */}
          <div className="col-span-6 sm:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xs">From</span>
              </div>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="City or airport"
                className="w-full pl-12 pr-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
          </div>
          
          {/* Destination */}
          <div className="col-span-6 sm:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xs">To</span>
              </div>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="City or airport"
                className="w-full pl-12 pr-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
          </div>
          
          {/* Depart date */}
          <div className="col-span-6 sm:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xs">Depart</span>
              </div>
              <input
                type="date"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
                className="w-full pl-14 pr-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
          </div>
          
          {/* Return date */}
          {tripType === 'roundtrip' && (
            <div className="col-span-6 sm:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-xs">Return</span>
                </div>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full pl-14 pr-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required={tripType === 'roundtrip'}
                />
              </div>
            </div>
          )}
          
          {/* Passengers */}
          <div className="col-span-6 sm:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xs">Passengers</span>
              </div>
              <select
                value={passengers}
                onChange={(e) => setPassengers(parseInt(e.target.value))}
                className="w-full pl-20 pr-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Search button */}
          <div className="col-span-6 sm:col-span-2">
            <button
              type="submit"
              className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors"
            >
              Search Flights
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

interface FlightSearchContainerProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const FlightSearchContainer: React.FC<FlightSearchContainerProps> = ({ 
  isOpen, 
  setIsOpen 
}) => {
  return (
    <div className="sticky top-16 z-40 bg-gray-50 dark:bg-gray-900 flex justify-end">
      <FlightSearchButton 
        onClick={() => setIsOpen(!isOpen)} 
        isOpen={isOpen}
      />
      <FlightSearchDropdown 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </div>
  );
};