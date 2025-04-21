'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Plane, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../components/auth/AuthContext';
import { useChatSessions } from '../../components/chat/ChatContext';
import { ContentType } from '../../types/messages';
import { useRouter } from 'next/router';

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

interface HotelSearchButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const HotelSearchButton: React.FC<HotelSearchButtonProps> = ({ onClick, isOpen }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
    aria-label="Search Hotels"
  >
    Hotel Search
  </button>
);

interface HotelSearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotelSearchDropdown: React.FC<HotelSearchDropdownProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { currentSession, updateCurrentSession } = useChatSessions();
  const router = useRouter();
  
  // Add loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Basic parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  
  // Additional parameters
  const [countryCode, setCountryCode] = useState('us');
  const [languageCode, setLanguageCode] = useState('en');
  const [currency, setCurrency] = useState('USD');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childrenAges, setChildrenAges] = useState('');
  
  // Advanced filters toggle
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced parameters
  const [sortBy, setSortBy] = useState(0); // Default: Relevance
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [propertyTypes, setPropertyTypes] = useState('');
  const [amenities, setAmenities] = useState('');
  const [rating, setRating] = useState(0);
  const [brands, setBrands] = useState('');
  const [hotelClass, setHotelClass] = useState('');
  const [freeCancellation, setFreeCancellation] = useState(false);
  const [specialOffers, setSpecialOffers] = useState(false);
  const [ecoCertified, setEcoCertified] = useState(false);
  const [vacationRentals, setVacationRentals] = useState(false);
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Set loading state to true
    setIsLoading(true);
    
    // Collect all search parameters, only including defined values
    const hotelParams: Record<string, any> = {};
    
    // Add basic parameters (only if they have values)
    if (searchQuery) hotelParams.q = searchQuery;
    if (checkInDate) hotelParams.check_in_date = checkInDate;
    if (checkOutDate) hotelParams.check_out_date = checkOutDate;
    
    // Add additional parameters
    hotelParams.gl = countryCode;
    hotelParams.hl = languageCode;
    hotelParams.currency = currency;
    hotelParams.adults = adults;
    
    // Add advanced parameters if they have values
    if (children > 0) hotelParams.children = children;
    if (childrenAges) hotelParams.children_ages = childrenAges;
    if (sortBy > 0) hotelParams.sort_by = sortBy;
    if (minPrice) hotelParams.min_price = parseInt(minPrice);
    if (maxPrice) hotelParams.max_price = parseInt(maxPrice);
    if (propertyTypes) hotelParams.property_types = propertyTypes;
    if (amenities) hotelParams.amenities = amenities;
    if (rating > 0) hotelParams.rating = rating;
    if (brands) hotelParams.brands = brands;
    if (hotelClass) hotelParams.hotel_class = hotelClass;
    if (freeCancellation) hotelParams.free_cancellation = freeCancellation;
    if (specialOffers) hotelParams.special_offers = specialOffers;
    if (ecoCertified) hotelParams.eco_certified = ecoCertified;
    if (vacationRentals) hotelParams.vacation_rentals = vacationRentals;
    if (bedrooms > 0) hotelParams.bedrooms = bedrooms;
    if (bathrooms > 0) hotelParams.bathrooms = bathrooms;
    
    console.log("Hotel search parameters:", hotelParams);
    
    // Create a user-friendly search query for the API
    const userQueryText = `Hotel search for ${searchQuery}`;
    
    // Define userMessage outside the try block so it's accessible in the catch block
    const userMessage = {
      contents: [{ content: userQueryText, type: 'text' as ContentType }],
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
      
      // Update the chat session with the user's message and loading message
      await updateCurrentSession({
        messages: [...(currentSession?.messages || []), userMessage]
      });
      
      // Now send the search query to your API
      console.log("Sending hotel search to API with params:", hotelParams);
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userQueryText,
          history: currentSession?.messages || [],
          hotelParams: hotelParams
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Hotel search response:", data);
      
      // Create a text message with the response
      const textMessage = {
        contents: [{ 
          type: 'text' as ContentType, 
          content: data.contents?.[0]?.content || "Here are your hotel search results."
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
      
      // Check if hotel data is in the response
      if (data.contents?.[0]?.hotels) {
        console.log("Found hotel data in contents:", data.contents[0].hotels);
        
        // Create a hotel message
        const hotelMessage = {
          contents: [{ 
            type: 'hotel' as ContentType, 
            content: {
              properties: data.contents[0].hotels.properties || [],
              search_metadata: data.contents[0].hotels.search_metadata || {}
            }
          }],
          isUser: false,
          timestamp: new Date()
        };
        
        // Add the hotel message to the chat in a separate update
        const finalMessages = [...updatedMessages, hotelMessage];
        await updateCurrentSession({
          messages: finalMessages
        });
      }
      
      // Close the hotel search form
      onClose();
      
    } catch (error) {
      console.error("Error submitting hotel search:", error);
      
      // Remove the loading message
      const messagesWithoutLoading = currentSession?.messages.filter(
        msg => !msg.contents.some(content => content.type === 'loading')
      ) || [];
      
      // Add a simple error message to the chat
      const errorMessage = {
        contents: [
          {
            type: 'text' as ContentType,
            content: "Sorry, I encountered an error while searching for hotels. Please try again."
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

  const handleSelectHotel = (hotel: any) => {
    // Implement the logic to handle selecting a hotel
    console.log("Selected hotel:", hotel);
    router.push('/itinerary');
  };

  return (
    <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-50 border-b border-gray-200 dark:border-gray-700">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
            Hotel Search
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
          {/* Search query input */}
          <div className="md:col-span-12">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Destination
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="City, neighborhood, or hotel"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          
          {/* Check-in date */}
          <div className="md:col-span-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Check-in
            </label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          
          {/* Check-out date */}
          <div className="md:col-span-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Check-out
            </label>
            <input
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          
          {/* Adults */}
          <div className="md:col-span-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Adults
            </label>
            <select
              value={adults}
              onChange={(e) => setAdults(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Adult' : 'Adults'}
                </option>
              ))}
            </select>
          </div>
          
          {/* Children */}
          <div className="md:col-span-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Children
            </label>
            <select
              value={children}
              onChange={(e) => setChildren(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {[0, 1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Child' : 'Children'}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Children ages input - only show if children > 0 */}
        {children > 0 && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-12">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Children Ages
              </label>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {Array.from({ length: children }).map((_, index) => (
                  <div key={index}>
                    <select
                      onChange={(e) => {
                        const ages = childrenAges.split(',').filter(age => age.trim() !== '');
                        ages[index] = e.target.value;
                        setChildrenAges(ages.join(','));
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      defaultValue=""
                    >
                      <option value="" disabled>Age of child {index + 1}</option>
                      {Array.from({ length: 18 }).map((_, age) => (
                        <option key={age} value={age}>{age} {age === 1 ? 'year' : 'years'}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
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
            
            {/* Sort By */}
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value={0}>Relevance (Default)</option>
                <option value={3}>Price: Low to High</option>
                <option value={8}>Rating: High to Low</option>
                <option value={13}>Most Reviewed</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min Price
              </label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="e.g. 100"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Price
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="e.g. 500"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Rating */}
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Guest Rating
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value={0}>Any</option>
                <option value={7}>3.5+</option>
                <option value={8}>4.0+</option>
                <option value={9}>4.5+</option>
              </select>
            </div>

            {/* Hotel Class */}
            <div className="md:col-span-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hotel Class
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {[
                  { id: "2", label: "2-star" },
                  { id: "3", label: "3-star" },
                  { id: "4", label: "4-star" },
                  { id: "5", label: "5-star" }
                ].map(classOption => {
                  const isSelected = hotelClass.split(',').includes(classOption.id);
                  return (
                    <button
                      key={classOption.id}
                      type="button"
                      onClick={() => {
                        const currentClasses = hotelClass.split(',').filter(c => c !== '');
                        if (isSelected) {
                          setHotelClass(currentClasses.filter(c => c !== classOption.id).join(','));
                        } else {
                          setHotelClass([...currentClasses, classOption.id].join(','));
                        }
                      }}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        isSelected 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700'
                      } border`}
                    >
                      {classOption.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Property Types */}
            <div className="md:col-span-12">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Property Types
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {[
                  { id: "12", label: "Beach hotels" },
                  { id: "13", label: "Boutique hotels" },
                  { id: "14", label: "Hostels" },
                  { id: "15", label: "Inns" },
                  { id: "16", label: "Motels" },
                  { id: "17", label: "Resorts" },
                  { id: "18", label: "Spa hotels" },
                  { id: "19", label: "Bed & Breakfasts" },
                  { id: "21", label: "Apartments" },
                  { id: "22", label: "Minshuku" },
                  { id: "23", label: "Business hotels" },
                  { id: "24", label: "Ryokan" }
                ].map(type => {
                  const isSelected = propertyTypes.split(',').includes(type.id);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        const currentTypes = propertyTypes.split(',').filter(t => t !== '');
                        if (isSelected) {
                          setPropertyTypes(currentTypes.filter(t => t !== type.id).join(','));
                        } else {
                          setPropertyTypes([...currentTypes, type.id].join(','));
                        }
                      }}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        isSelected 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700'
                      } border`}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amenities */}
            <div className="md:col-span-12 mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amenities
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {[
                  { id: "1", label: "Free parking" },
                  { id: "3", label: "Parking" },
                  { id: "6", label: "Pool" },
                  { id: "7", label: "Fitness center" },
                  { id: "8", label: "Restaurant" },
                  { id: "9", label: "Free breakfast" },
                  { id: "10", label: "Spa" },
                  { id: "11", label: "Beach" },
                  { id: "15", label: "Bar" },
                  { id: "19", label: "Pet-friendly" },
                  { id: "35", label: "Free Wi-Fi" },
                  { id: "40", label: "Air conditioning" },
                  { id: "53", label: "Accessible" }
                ].map(amenity => {
                  const isSelected = amenities.split(',').includes(amenity.id);
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => {
                        const currentAmenities = amenities.split(',').filter(a => a !== '');
                        if (isSelected) {
                          setAmenities(currentAmenities.filter(a => a !== amenity.id).join(','));
                        } else {
                          setAmenities([...currentAmenities, amenity.id].join(','));
                        }
                      }}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        isSelected 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700'
                      } border`}
                    >
                      {amenity.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hotel Brands */}
            <div className="md:col-span-12">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hotel Brands
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {[
                  { id: "hilton", label: "Hilton" },
                  { id: "marriott", label: "Marriott" },
                  { id: "hyatt", label: "Hyatt" },
                  { id: "ihg", label: "IHG" },
                  { id: "accor", label: "Accor" },
                  { id: "wyndham", label: "Wyndham" },
                  { id: "best_western", label: "Best Western" },
                  { id: "choice", label: "Choice Hotels" },
                  { id: "radisson", label: "Radisson" },
                  { id: "four_seasons", label: "Four Seasons" }
                ].map(brand => {
                  const isSelected = brands.split(',').includes(brand.id);
                  return (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => {
                        const currentBrands = brands.split(',').filter(b => b !== '');
                        if (isSelected) {
                          setBrands(currentBrands.filter(b => b !== brand.id).join(','));
                        } else {
                          setBrands([...currentBrands, brand.id].join(','));
                        }
                      }}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        isSelected 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700'
                      } border`}
                    >
                      {brand.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggle Options */}
            <div className="md:col-span-12 mt-2">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={freeCancellation}
                    onChange={(e) => setFreeCancellation(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Free Cancellation</span>
                </label>
                
                <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={specialOffers}
                    onChange={(e) => setSpecialOffers(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Special Offers</span>
                </label>
                
                <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={ecoCertified}
                    onChange={(e) => setEcoCertified(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Eco-Certified</span>
                </label>
              </div>
            </div>

            {/* Vacation Rentals Toggle */}
            <div className="md:col-span-12 mt-2">
              <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={vacationRentals}
                  onChange={(e) => setVacationRentals(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span>Search Vacation Rentals Instead of Hotels</span>
              </label>
            </div>

            {/* Vacation Rental Specific Options */}
            {vacationRentals && (
              <>
                <div className="md:col-span-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Bedrooms
                  </label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num === 0 ? 'Any' : num}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Bathrooms
                  </label>
                  <select
                    value={bathrooms}
                    onChange={(e) => setBathrooms(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {[0, 1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num === 0 ? 'Any' : num}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

interface HotelSearchContainerProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const HotelSearchContainer: React.FC<HotelSearchContainerProps> = ({ 
  isOpen, 
  setIsOpen 
}) => {
  return (
    <div className="relative">
      {!isOpen ? (
        <div className="flex justify-center py-3 border-b border-gray-200 dark:border-gray-700">
          <HotelSearchButton 
            onClick={() => setIsOpen(true)} 
            isOpen={isOpen}
          />
        </div>
      ) : (
        <HotelSearchDropdown 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </div>
  );
};