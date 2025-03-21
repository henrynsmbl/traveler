'use client'

import React, { useState } from 'react';
import { ChevronDown, X, Filter, Star } from 'lucide-react';
import type { HotelFilters as HotelFiltersType } from '../../types/hotel';

interface HotelFiltersProps {
  onFilterChange: (filters: HotelFiltersType) => void;
  amenities: string[]; // Available amenities for filtering
  priceRange: {
    min: number;
    max: number;
  };
  nearbyLocations: string[]; // Available nearby locations
}

const HotelFilters: React.FC<HotelFiltersProps> = ({
  onFilterChange,
  amenities = [],
  priceRange = { min: 0, max: 1000 },
  nearbyLocations = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<HotelFiltersType>({
    priceRange: priceRange,
    starRating: [],
    amenities: [],
    minReviewScore: 0,
    nearbyLocations: []
  });

  const handleFilterChange = (newFilters: Partial<HotelFiltersType>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const clearFilters = () => {
    const resetFilters: HotelFiltersType = {
      priceRange: priceRange,
      starRating: [],
      amenities: [],
      minReviewScore: 0,
      nearbyLocations: []
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const toggleStarRating = (rating: number) => {
    const currentRatings = filters.starRating || [];
    const updatedRatings = currentRatings.includes(rating)
      ? currentRatings.filter(r => r !== rating)
      : [...currentRatings, rating];
    
    handleFilterChange({ starRating: updatedRatings });
  };

  const toggleAmenity = (amenity: string) => {
    const currentAmenities = filters.amenities || [];
    const updatedAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    
    handleFilterChange({ amenities: updatedAmenities });
  };

  const toggleNearbyLocation = (location: string) => {
    const currentLocations = filters.nearbyLocations || [];
    const updatedLocations = currentLocations.includes(location)
      ? currentLocations.filter(l => l !== location)
      : [...currentLocations, location];
    
    handleFilterChange({ nearbyLocations: updatedLocations });
  };

  const hasActiveFilters = () => {
    return (
      (filters.starRating && filters.starRating.length > 0) ||
      (filters.amenities && filters.amenities.length > 0) ||
      (filters.nearbyLocations && filters.nearbyLocations.length > 0) ||
      filters.minReviewScore > 0 ||
      (filters.priceRange && 
        (filters.priceRange.min > priceRange.min || 
         filters.priceRange.max < priceRange.max))
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
          <span className="font-medium">Filter Hotels</span>
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
            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Range (${filters.priceRange?.min} - ${filters.priceRange?.max})
              </label>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-gray-500">Min Price</span>
                  <input
                    type="range"
                    min={priceRange.min}
                    max={priceRange.max}
                    step="10"
                    value={filters.priceRange?.min}
                    onChange={(e) => handleFilterChange({ 
                      priceRange: { 
                        ...filters.priceRange!, 
                        min: Number(e.target.value) 
                      } 
                    })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-500">Max Price</span>
                  <input
                    type="range"
                    min={priceRange.min}
                    max={priceRange.max}
                    step="10"
                    value={filters.priceRange?.max}
                    onChange={(e) => handleFilterChange({ 
                      priceRange: { 
                        ...filters.priceRange!, 
                        max: Number(e.target.value) 
                      } 
                    })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>${priceRange.min}</span>
                <span>${priceRange.max}</span>
              </div>
            </div>

            {/* Star Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Star Rating
              </label>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => (
                  <div key={`star-rating-${rating}`} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`star-rating-${rating}`}
                      checked={(filters.starRating || []).includes(rating)}
                      onChange={() => toggleStarRating(rating)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor={`star-rating-${rating}`} className="ml-2 flex items-center">
                      {[...Array(rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400" fill="currentColor" />
                      ))}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Score Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Review Score ({filters.minReviewScore})
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={filters.minReviewScore}
                onChange={(e) => handleFilterChange({ minReviewScore: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>10</span>
              </div>
            </div>

            {/* Amenities Filter */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amenities
              </label>
              <div className="max-h-40 overflow-y-auto pr-2 grid grid-cols-2 gap-1">
                {amenities.map(amenity => (
                  <div key={amenity} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`amenity-${amenity}`}
                      checked={(filters.amenities || []).includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor={`amenity-${amenity}`} className="ml-2 text-sm text-gray-700">
                      {amenity}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby Locations Filter */}
            {nearbyLocations.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nearby Locations
                </label>
                <div className="max-h-40 overflow-y-auto pr-2 space-y-1">
                  {nearbyLocations.map(location => (
                    <div key={location} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`location-${location}`}
                        checked={(filters.nearbyLocations || []).includes(location)}
                        onChange={() => toggleNearbyLocation(location)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor={`location-${location}`} className="ml-2 text-sm text-gray-700">
                        {location}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

export default HotelFilters; 