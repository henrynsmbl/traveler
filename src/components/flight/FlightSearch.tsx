'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../components/auth/AuthContext';
import { useChatSessions } from '../../components/chat/ChatContext';
import { ContentType } from '../../types/messages';
import { useRouter } from 'next/navigation';
import { MAJOR_AIRPORTS, Airport } from './airports';

interface AirportInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  required?: boolean;
}

const AirportInput: React.FC<AirportInputProps> = ({ 
  value, 
  onChange, 
  placeholder, 
  label,
  required = false 
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    if (inputValue.trim() === '') {
      setSuggestions([]);
      return;
    }

    const query = inputValue.toLowerCase();
    
    // Use local major airports for very short queries
    if (query.length < 2) {
      const filtered = MAJOR_AIRPORTS.filter(airport => 
        airport.code.toLowerCase().includes(query) || 
        airport.city.toLowerCase().includes(query)
      ).slice(0, 5);
      setSuggestions(filtered);
      return;
    }
    
    // Debounce API calls
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/airports?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          
          // Prioritize exact code matches first
          const exactCodeMatches = data.filter((airport: Airport) => 
            airport.code.toLowerCase() === query
          );
          
          // Then prioritize codes that start with the query
          const codeStartsWithMatches = data.filter((airport: Airport) => 
            airport.code.toLowerCase().startsWith(query) && 
            airport.code.toLowerCase() !== query
          );
          
          // Then prioritize city matches
          const cityMatches = data.filter((airport: Airport) => 
            airport.city.toLowerCase().includes(query) && 
            !airport.code.toLowerCase().startsWith(query)
          );
          
          // Then include any other matches
          const otherMatches = data.filter((airport: Airport) => 
            !airport.code.toLowerCase().startsWith(query) && 
            !airport.city.toLowerCase().includes(query) &&
            airport.name.toLowerCase().includes(query)
          );
          
          // Combine the results in priority order
          const prioritizedResults = [
            ...exactCodeMatches,
            ...codeStartsWithMatches,
            ...cityMatches,
            ...otherMatches
          ].slice(0, 10); // Limit to 10 total results
          
          setSuggestions(prioritizedResults);
        }
      } catch (error) {
        console.error('Error fetching airport suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (airport: Airport) => {
    const displayValue = `${airport.city} (${airport.code}), ${airport.country}`;
    setInputValue(displayValue);
    onChange(airport.code);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        required={required}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto"
        >
          {suggestions.map((airport) => (
            <div
              key={airport.code}
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
              onClick={() => handleSelectSuggestion(airport)}
            >
              <div className="font-medium">{airport.city} ({airport.code}) <span className="text-gray-500 dark:text-gray-400">{airport.country}</span></div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{airport.name}</div>
            </div>
          ))}
        </div>
      )}
      
      {isLoading && (
        <div className="absolute right-3 top-9">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}
    </div>
  );
};

interface FlightSearchButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const FlightSearchButton: React.FC<FlightSearchButtonProps> = ({ onClick, isOpen }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
    aria-label="Search Flights"
  >
    Flight Search
  </button>
);

interface FlightSearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlightSearchDropdown: React.FC<FlightSearchDropdownProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { currentSession, updateCurrentSession } = useChatSessions();
  const router = useRouter();
  
  // Add loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Basic parameters
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway'>('roundtrip');
  
  // Additional parameters
  const [countryCode, setCountryCode] = useState('us');
  const [languageCode, setLanguageCode] = useState('en');
  const [currency, setCurrency] = useState('USD');
  const [passengers, setPassengers] = useState(1);
  
  // Advanced filters toggle
  const [showFilters, setShowFilters] = useState(false);
  
  // First, add new state variables for the additional parameters
  const [travelClass, setTravelClass] = useState(1); // Economy by default
  const [showHidden, setShowHidden] = useState(false);
  const [deepSearch, setDeepSearch] = useState(false);
  const [children, setChildren] = useState(0);
  const [infantsInSeat, setInfantsInSeat] = useState(0);
  const [infantsOnLap, setInfantsOnLap] = useState(0);
  const [sortBy, setSortBy] = useState(1); // Top flights by default
  const [stops, setStops] = useState(0); // Any number of stops by default
  const [airlines, setAirlines] = useState('');
  const [excludeAirlines, setExcludeAirlines] = useState(false); // Toggle between include/exclude
  const [bags, setBags] = useState(0);
  const [maxPrice, setMaxPrice] = useState('');
  const [outboundTimes, setOutboundTimes] = useState('');
  const [returnTimes, setReturnTimes] = useState('');
  const [emissions, setEmissions] = useState(0);
  const [excludeConns, setExcludeConns] = useState('');
  const [maxDurationHours, setMaxDurationHours] = useState('');
  const [maxDurationMinutes, setMaxDurationMinutes] = useState('');
  
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Set loading state to true
    setIsLoading(true);
    
    // Collect all search parameters, only including defined values
    const flightParams: Record<string, any> = {};
    
    // Add basic parameters (only if they have values)
    if (origin) flightParams.departure_id = origin;
    if (destination) flightParams.arrival_id = destination;
    if (departDate) flightParams.outbound_date = departDate;
    if (tripType === 'roundtrip' && returnDate) flightParams.return_date = returnDate;
    
    // Map tripType to the correct integer value
    flightParams.type = tripType === 'roundtrip' ? 1 : 2; // 1 for Round trip, 2 for One way
    
    // Add additional parameters with correct mapping
    flightParams.gl = countryCode;
    flightParams.hl = languageCode;
    flightParams.currency = currency;
    flightParams.adults = parseInt(passengers.toString()); // Ensure it's a number
    
    // Map travel class to the correct integer value
    if (travelClass) {
      flightParams.travel_class = parseInt(travelClass.toString()); // Ensure it's a number
    }
    
    // Add other parameters with correct mapping
    if (showHidden) flightParams.show_hidden = true;
    if (deepSearch) flightParams.deep_search = true;
    if (children > 0) flightParams.children = parseInt(children.toString());
    if (infantsInSeat > 0) flightParams.infants_in_seat = parseInt(infantsInSeat.toString());
    if (infantsOnLap > 0) flightParams.infants_on_lap = parseInt(infantsOnLap.toString());
    
    // Map sort_by to the correct integer value
    if (sortBy) {
      flightParams.sort_by = parseInt(sortBy.toString()); // Ensure it's a number
    }
    
    // Map stops to the correct integer value
    if (stops) {
      flightParams.stops = parseInt(stops.toString()); // Ensure it's a number
    }
    
    // Handle airlines inclusion/exclusion
    if (airlines) {
      if (excludeAirlines) {
        flightParams.exclude_airlines = airlines;
      } else {
        flightParams.include_airlines = airlines;
      }
    }
    
    // Map bags to the correct integer value
    if (bags > 0) {
      flightParams.bags = parseInt(bags.toString());
    }
    
    // Handle max_price as integer
    if (maxPrice) {
      const maxPriceInt = parseInt(maxPrice);
      if (!isNaN(maxPriceInt)) {
        flightParams.max_price = maxPriceInt;
      }
    }
    
    // Handle outbound_times and return_times
    if (outboundTimes) flightParams.outbound_times = outboundTimes;
    if (returnTimes && tripType === 'roundtrip') flightParams.return_times = returnTimes;
    
    // Handle emissions
    if (emissions === 1) flightParams.emissions = 1;
        
    // Handle exclude_conns
    if (excludeConns) flightParams.exclude_conns = excludeConns;
    
    // Handle max_duration as integer (convert hours and minutes to total minutes)
    if (maxDurationHours || maxDurationMinutes) {
      const hours = parseInt(maxDurationHours) || 0;
      const minutes = parseInt(maxDurationMinutes) || 0;
      const totalMinutes = (hours * 60) + minutes;
      
      if (totalMinutes > 0) {
        flightParams.max_duration = totalMinutes;
      }
    }
    
    // Log the final parameters for debugging
    console.log("Flight search parameters:", flightParams);
    
    // Create a user-friendly search query for the API
    let searchQuery = `Manual search from ${origin} to ${destination}`;
    
    // Add class information to the search query for better context
    if (flightParams.travel_class) {
      const classNames: Record<number, string> = {1: "Economy", 2: "Premium Economy", 3: "Business", 4: "First"};
      searchQuery += ` in ${classNames[flightParams.travel_class as keyof typeof classNames] || "Economy"} class`;
    }
    
    // Add stops information
    if (flightParams.stops) {
      const stopsDesc: Record<number, string> = {0: "any number of stops", 1: "nonstop only", 2: "1 stop or fewer", 3: "2 stops or fewer"};
      searchQuery += ` with ${stopsDesc[flightParams.stops as keyof typeof stopsDesc] || "any number of stops"}`;
    }
    
    // Add bags information
    if (flightParams.bags) {
      searchQuery += ` with ${flightParams.bags} carry-on bag${flightParams.bags > 1 ? 's' : ''}`;
    }
    
    // Add duration information if specified
    if (flightParams.max_duration) {
      const hours = Math.floor(flightParams.max_duration / 60);
      const minutes = flightParams.max_duration % 60;
      let durationText = '';
      
      if (hours > 0) {
        durationText += `${hours} hour${hours > 1 ? 's' : ''}`;
      }
      
      if (minutes > 0) {
        if (hours > 0) durationText += ' and ';
        durationText += `${minutes} minute${minutes > 1 ? 's' : ''}`;
      }
      
      searchQuery += ` with maximum duration of ${durationText}`;
    }
    
    // Define userMessage outside the try block so it's accessible in the catch block
    const userMessage = {
      contents: [{ content: searchQuery, type: 'text' as ContentType }],
      isUser: true,
      timestamp: new Date()
    };
    
    // Create a loading message with a special content type
    const loadingMessage = {
      contents: [{ 
        type: 'loading' as ContentType, // Use a special type for loading
        content: "Searching..." 
      }],
      isUser: false,
      timestamp: new Date()
    };

    try {
      // Only proceed if user is logged in and there's an active session
      if (!user || !currentSession) {
        console.error("User not logged in or no active session");
        setIsLoading(false);
        return;
      }
      
      // Update the chat session with the user's message
      await updateCurrentSession({
        messages: [...(currentSession?.messages || []), userMessage]
      });
      
      // Clean up the flight parameters to ensure they're all valid
      // Remove any undefined or empty values
      const cleanedParams = Object.fromEntries(
        Object.entries(flightParams).filter(([_, value]) => 
          value !== undefined && value !== null && value !== ''
        )
      );
      
      // Now send the search query to your API
      console.log("Sending flight search to API with params:", cleanedParams);
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: searchQuery,
          history: currentSession?.messages || [],
          flightParams: cleanedParams,
          isDirectFlightSearch: true
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Flight search response:", data);
      
      // Create a text message with the response
      const textMessage = {
        contents: [{ 
          type: 'text' as ContentType, 
          content: data.contents?.[0]?.content || "Here are your flight search results."
        }],
        isUser: false,
        timestamp: new Date()
      };
      
      // Then update the filter to look for this type:
      const messagesWithoutLoading = currentSession?.messages.filter(
        msg => !msg.contents.some(content => content.type === 'loading')
      ) || [];
      
      const updatedMessages = [...messagesWithoutLoading, userMessage, textMessage];
      await updateCurrentSession({
        messages: updatedMessages
      });
      
      // Check if flight data is in the response
      if (data.contents?.[0]?.flights) {
        console.log("Found flight data in contents:", data.contents[0].flights);
        
        // Create a flight message
        const flightMessage = {
          contents: [{ 
            type: 'flight' as ContentType, 
            content: {
              best_flights: data.contents[0].flights.best_flights || [],
              other_flights: data.contents[0].flights.other_flights || [],
              search_metadata: data.contents[0].flights.search_metadata || {}
            }
          }],
          isUser: false,
          timestamp: new Date()
        };
        
        // Add the flight message to the chat in a separate update
        const finalMessages = [...updatedMessages, flightMessage];
        await updateCurrentSession({
          messages: finalMessages
        });
      }
      
      // Close the flight search form
      onClose();
      
    } catch (error) {
      console.error("Error submitting flight search:", error);
      
      // Remove the loading message
      const messagesWithoutLoading = currentSession?.messages.filter(
        msg => !msg.contents.some(content => content.type === 'loading')
      ) || [];
      
      // Add a simple error message to the chat
      const errorMessage = {
        contents: [
          {
            type: 'text' as ContentType,
            content: "Sorry, I encountered an error while searching for flights. Please try again."
          }
        ],
        isUser: false,
        timestamp: new Date()
      };
      
      await updateCurrentSession({
        messages: [...messagesWithoutLoading, userMessage, errorMessage]
      });
    } finally {
      // Set loading state back to false
      setIsLoading(false);
    }
  };

  const handleSelectFlight = (flight: any) => {
    // Implementation of handleSelectFlight
  };

  return (
    <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-50 border-b border-gray-200 dark:border-gray-700">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
            Flight Search
          </h3>
          <button 
            type="button" 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Trip type selector */}
          <div className="md:col-span-12 flex space-x-2 mb-1">
            <button
              type="button"
              className={`flex-1 px-3 py-2 text-sm rounded-md ${
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
              className={`flex-1 px-3 py-2 text-sm rounded-md ${
                tripType === 'oneway' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
              onClick={() => setTripType('oneway')}
            >
              One Way
            </button>
          </div>
          
          {/* Origin input */}
          <div className="md:col-span-6">
            <AirportInput
              value={origin}
              onChange={setOrigin}
              placeholder="City or airport code"
              label="From"
              required
            />
          </div>
          
          {/* Destination input */}
          <div className="md:col-span-6">
            <AirportInput
              value={destination}
              onChange={setDestination}
              placeholder="City or airport code"
              label="To"
              required
            />
          </div>
          
          {/* Depart date */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Depart
            </label>
            <input
              type="date"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          
          {/* Return date */}
          {tripType === 'roundtrip' && (
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Return
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required={tripType === 'roundtrip'}
              />
            </div>
          )}
          
          {/* Passengers */}
          <div className={`md:col-span-${tripType === 'roundtrip' ? '3' : '6'}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Passengers
            </label>
            <select
              value={passengers}
              onChange={(e) => setPassengers(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Passenger' : 'Passengers'}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Search button in its own centered row */}
        <div className="mt-4 flex justify-center">
          <button
            type="submit"
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin mr-2" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>
        
        {/* More options toggle - subtle version at the bottom */}
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center mx-auto"
          >
            {showFilters ? 'Hide advanced options' : 'Show advanced options'}
            {showFilters ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
          </button>
        </div>
        
        {/* Additional options section */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-12">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Advanced Options
              </h4>
            </div>
            
            {/* Travel Class */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Travel Class
              </label>
              <select
                value={travelClass}
                onChange={(e) => setTravelClass(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value={1}>Economy</option>
                <option value={2}>Premium Economy</option>
                <option value={3}>Business</option>
                <option value={4}>First</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort Results By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value={1}>Top Flights</option>
                <option value={2}>Price</option>
                <option value={3}>Departure Time</option>
                <option value={4}>Arrival Time</option>
                <option value={5}>Duration</option>
                <option value={6}>Emissions</option>
              </select>
            </div>

            {/* Stops */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stops
              </label>
              <select
                value={stops}
                onChange={(e) => setStops(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value={0}>Any</option>
                <option value={1}>Nonstop Only</option>
                <option value={2}>1 Stop or Fewer</option>
                <option value={3}>2 Stops or Fewer</option>
              </select>
            </div>

            {/* Additional Passengers */}
            <div className="md:col-span-12 mt-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Passengers</h4>
            </div>

            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Children
              </label>
              <select
                value={children}
                onChange={(e) => setChildren(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {[0, 1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Infants in Seat
              </label>
              <select
                value={infantsInSeat}
                onChange={(e) => setInfantsInSeat(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {[0, 1, 2, 3, 4].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Infants on Lap
              </label>
              <select
                value={infantsOnLap}
                onChange={(e) => setInfantsOnLap(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {[0, 1, 2, 3, 4].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            {/* Advanced Filters */}
            <div className="md:col-span-12 mt-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Advanced Filters</h4>
            </div>

            {/* Max Price */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Price
              </label>
              <input
                type="text"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="e.g. 500"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Bags */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Carry-on Bags
              </label>
              <select
                value={bags}
                onChange={(e) => setBags(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {[0, 1, 2].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            {/* Max Duration */}
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Flight Duration
              </label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={maxDurationHours}
                    onChange={(e) => setMaxDurationHours(e.target.value)}
                    placeholder="Hours"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Hours</span>
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={maxDurationMinutes}
                    onChange={(e) => setMaxDurationMinutes(e.target.value)}
                    placeholder="Minutes"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Minutes</span>
                </div>
              </div>
            </div>
          </div>
        )}
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
    <div className="relative">
      {!isOpen ? (
        <div className="flex justify-center py-3 border-b border-gray-200 dark:border-gray-700">
          <FlightSearchButton 
            onClick={() => setIsOpen(true)} 
            isOpen={isOpen}
          />
        </div>
      ) : (
        <FlightSearchDropdown 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </div>
  );
};