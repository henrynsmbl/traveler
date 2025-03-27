'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Plane, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../components/auth/AuthContext';
import { useChatSessions } from '../../components/chat/ChatContext';
import { ContentType } from '../../types/messages';

// Sample airport data - in a real app, you'd fetch this from an API
const AIRPORTS = [
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA' },
  { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'USA' },
  { code: 'ORD', name: 'O\'Hare International Airport', city: 'Chicago', country: 'USA' },
  { code: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'USA' },
  { code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'USA' },
  { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK' },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'MAD', name: 'Adolfo Suárez Madrid–Barajas Airport', city: 'Madrid', country: 'Spain' },
  { code: 'FCO', name: 'Leonardo da Vinci–Fiumicino Airport', city: 'Rome', country: 'Italy' },
  { code: 'SYD', name: 'Sydney Airport', city: 'Sydney', country: 'Australia' },
  { code: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'Japan' },
  { code: 'PEK', name: 'Beijing Capital International Airport', city: 'Beijing', country: 'China' },
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE' },
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi', country: 'India' },
  { code: 'GRU', name: 'São Paulo–Guarulhos International Airport', city: 'São Paulo', country: 'Brazil' },
  { code: 'MEX', name: 'Mexico City International Airport', city: 'Mexico City', country: 'Mexico' },
  { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada' },
];

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

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

  // Filter airports based on input
  useEffect(() => {
    if (inputValue.trim() === '') {
      setSuggestions([]);
      return;
    }

    const query = inputValue.toLowerCase();
    const filtered = AIRPORTS.filter(airport => 
      airport.code.toLowerCase().includes(query) || 
      airport.city.toLowerCase().includes(query) || 
      airport.name.toLowerCase().includes(query)
    ).slice(0, 5); // Limit to 5 suggestions
    
    setSuggestions(filtered);
  }, [inputValue]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (airport: Airport) => {
    const displayValue = `${airport.city} (${airport.code})`;
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
              <div className="font-medium">{airport.city} ({airport.code})</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{airport.name}</div>
            </div>
          ))}
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
  
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Collect all search parameters, only including defined values
    const flightParams: Record<string, any> = {};
    
    // Add basic parameters (only if they have values)
    if (origin) flightParams.departure_id = origin;
    if (destination) flightParams.arrival_id = destination;
    if (departDate) flightParams.outbound_date = departDate;
    if (tripType === 'roundtrip' && returnDate) flightParams.return_date = returnDate;
    flightParams.type = tripType === 'roundtrip' ? 1 : 2;
    
    // Add additional parameters
    flightParams.gl = countryCode;
    flightParams.hl = languageCode;
    flightParams.currency = currency;
    flightParams.adults = passengers;
    
    console.log("Flight search parameters:", flightParams);
    
    // Create a user-friendly search query for the API
    const searchQuery = `Find flights from ${origin} to ${destination} departing on ${departDate}${
      tripType === 'roundtrip' ? ` and returning on ${returnDate}` : ''
    } for ${passengers} adult${passengers > 1 ? 's' : ''}`;
    
    try {
      // Only proceed if user is logged in and there's an active session
      if (!user || !currentSession) {
        console.error("User not logged in or no active session");
        return;
      }
      
      // Create a user message with the search query
      const userMessage = {
        contents: [{ content: searchQuery, type: 'text' as ContentType }],
        isUser: true,
        timestamp: new Date()
      };
      
      // Update the chat session with just the user's message first
      await updateCurrentSession({
        messages: [...(currentSession?.messages || []), userMessage]
      });
      
      // Now send the search query to your API
      console.log("Sending flight search to API with params:", flightParams);
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: searchQuery,
          history: currentSession?.messages || [],
          flightParams: flightParams
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
      
      // Add the text message to the chat
      const updatedMessages = [...(currentSession?.messages || []), userMessage, textMessage];
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
        messages: [...(currentSession?.messages || []), userMessage, errorMessage]
      });
    }
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
          <div className="md:col-span-3">
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
          
          {/* Search button */}
          <div className={`md:col-span-${tripType === 'roundtrip' ? '3' : '6'}`}>
            <label className="block text-sm font-medium text-transparent dark:text-transparent mb-1">
              Search
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-md transition-colors flex items-center"
              >
                <Filter size={16} className="mr-1" />
                More Options
                {showFilters ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
              </button>
              <button
                type="submit"
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>
        
        {/* Additional options section */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-12">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Options</h4>
            </div>
            
            {/* Country code */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Country (gl)
              </label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="us">United States (US)</option>
                <option value="gb">United Kingdom (GB)</option>
                <option value="ca">Canada (CA)</option>
                <option value="au">Australia (AU)</option>
                <option value="de">Germany (DE)</option>
                <option value="fr">France (FR)</option>
                <option value="jp">Japan (JP)</option>
                <option value="in">India (IN)</option>
                <option value="br">Brazil (BR)</option>
                <option value="mx">Mexico (MX)</option>
              </select>
            </div>
            
            {/* Language code */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Language (hl)
              </label>
              <select
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ja">Japanese</option>
                <option value="zh">Chinese</option>
                <option value="ru">Russian</option>
                <option value="ar">Arabic</option>
              </select>
            </div>
            
            {/* Currency */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
                <option value="CAD">Canadian Dollar (CAD)</option>
                <option value="AUD">Australian Dollar (AUD)</option>
                <option value="JPY">Japanese Yen (JPY)</option>
                <option value="INR">Indian Rupee (INR)</option>
                <option value="CNY">Chinese Yuan (CNY)</option>
                <option value="BRL">Brazilian Real (BRL)</option>
                <option value="MXN">Mexican Peso (MXN)</option>
              </select>
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