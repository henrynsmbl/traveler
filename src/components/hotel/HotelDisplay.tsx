import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import HotelCard from '../layout/HotelCard';
import HotelFilters from './HotelFilters';
import type { HotelData, HotelFilters as HotelFiltersType } from '@/types/hotel';
import type { Selection } from '@/types/selections';
import type { DateRange } from "react-day-picker";

interface HotelDisplayProps {
  hotelData: {
    properties: HotelData[];
  };
  searchQuery?: string;
  selections: Selection[];
  onHotelSelect: (hotel: HotelData) => void;
  dateRange?: DateRange;
  onFilterUpdate?: (filters: HotelFiltersType) => void;
}

const MemoizedHotelCard = React.memo(HotelCard);

const HotelDisplay = React.memo(({ 
  hotelData, 
  searchQuery = '',
  selections = [],
  onHotelSelect,
  dateRange,
  onFilterUpdate
}: HotelDisplayProps) => {
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState<number>(0);
  const [showAllHotels, setShowAllHotels] = useState<boolean>(false);
  const [filters, setFilters] = useState<HotelFiltersType>({});
  const [filteredHotels, setFilteredHotels] = useState<HotelData[]>([]);

  // Extract unique amenities from all hotels for the filter dropdown
  const availableAmenities = useMemo(() => {
    if (!hotelData?.properties) return [];
    
    const amenitiesSet = new Set<string>();
    hotelData.properties.forEach(hotel => {
      if (hotel.amenities) {
        hotel.amenities.forEach(amenity => {
          amenitiesSet.add(amenity);
        });
      }
    });
    
    return Array.from(amenitiesSet).sort();
  }, [hotelData]);

  // Extract unique nearby locations from all hotels
  const nearbyLocations = useMemo(() => {
    if (!hotelData?.properties) return [];
    
    const locationsSet = new Set<string>();
    hotelData.properties.forEach(hotel => {
      if (hotel.nearby_places) {
        hotel.nearby_places.forEach(place => {
          locationsSet.add(place.name);
        });
      }
    });
    
    return Array.from(locationsSet).sort();
  }, [hotelData]);

  // Find the price range in the dataset
  const priceRange = useMemo(() => {
    if (!hotelData?.properties || hotelData.properties.length === 0) {
      return { min: 0, max: 1000 };
    }
    
    let min = Number.MAX_SAFE_INTEGER;
    let max = 0;
    
    hotelData.properties.forEach(hotel => {
      if (hotel.rate_per_night?.extracted_lowest) {
        min = Math.min(min, hotel.rate_per_night.extracted_lowest);
        max = Math.max(max, hotel.rate_per_night.extracted_lowest);
      }
    });
    
    // Add some buffer to the max price
    return { 
      min: Math.floor(min / 10) * 10, // Round down to nearest 10
      max: Math.ceil(max / 10) * 10 + 50 // Round up to nearest 10 and add 50
    };
  }, [hotelData]);

  // Memoize the isSelected check function
  const isHotelSelected = useCallback((hotelName: string) => 
    selections.some(selection => 
      selection.type === 'hotel' && 
      selection.data.name === hotelName
    ),
    [selections]
  );

  // Apply filters and search query to hotels
  useEffect(() => {
    if (!hotelData?.properties) {
      setFilteredHotels([]);
      return;
    }

    const filtered = hotelData.properties.filter(hotel => {
      if (!hotel) return false;

      // Filter by valid images first
      const validImages = (hotel.images ?? []).filter(image => 
        image && 
        image.original_image && 
        image.original_image.trim() !== ''
      );
      
      if (validImages.length === 0) return false;
      
      // Filter by search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          hotel.name?.toLowerCase().includes(searchLower) ||
          hotel.description?.toLowerCase().includes(searchLower) ||
          hotel.rate_per_night?.lowest?.includes(searchQuery) ||
          hotel.amenities?.some(amenity => 
            amenity.toLowerCase().includes(searchLower)
          );
          
        if (!matchesSearch) return false;
      }
      
      // Filter by price range
      if (filters.priceRange && hotel.rate_per_night?.extracted_lowest) {
        if (
          hotel.rate_per_night.extracted_lowest < filters.priceRange.min ||
          hotel.rate_per_night.extracted_lowest > filters.priceRange.max
        ) {
          return false;
        }
      }
      
      // Filter by star rating
      if (filters.starRating && filters.starRating.length > 0 && hotel.hotel_class) {
        const hotelStars = parseInt(hotel.hotel_class);
        if (!filters.starRating.includes(hotelStars)) {
          return false;
        }
      }
      
      // Filter by review score
      if (filters.minReviewScore && filters.minReviewScore > 0 && hotel.overall_rating) {
        if (hotel.overall_rating < filters.minReviewScore) {
          return false;
        }
      }
      
      // Filter by amenities
      if (filters.amenities && filters.amenities.length > 0) {
        if (!hotel.amenities || !filters.amenities.every(amenity => 
          hotel.amenities!.includes(amenity)
        )) {
          return false;
        }
      }
      
      // Filter by nearby locations
      if (filters.nearbyLocations && filters.nearbyLocations.length > 0) {
        if (!hotel.nearby_places || !filters.nearbyLocations.some(location => 
          hotel.nearby_places!.some(place => place.name === location)
        )) {
          return false;
        }
      }
      
      return true;
    });

    setFilteredHotels(filtered);
  }, [hotelData, searchQuery, filters]);

  // Memoize the featured and other hotels
  const { featuredHotels, otherHotels } = useMemo(() => ({
    featuredHotels: filteredHotels.slice(0, 5),
    otherHotels: filteredHotels.slice(5)
  }), [filteredHotels]);

  // Reset currentFeaturedIndex if it's out of bounds
  useEffect(() => {
    if (currentFeaturedIndex >= featuredHotels.length) {
      setCurrentFeaturedIndex(0);
    }
  }, [featuredHotels.length, currentFeaturedIndex]);

  const handleFilterChange = (newFilters: HotelFiltersType) => {
    setFilters(newFilters);
    
    // Call the parent component's filter update handler if provided
    if (onFilterUpdate) {
      onFilterUpdate(newFilters);
    }
  };

  // Early return if no hotels are available
  if (!hotelData?.properties) {
    return (
      <div className="w-full p-4 text-center text-gray-500">
        No hotels available at the moment
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Filters Section */}
      <HotelFilters 
        onFilterChange={handleFilterChange}
        amenities={availableAmenities}
        priceRange={priceRange}
        nearbyLocations={nearbyLocations}
      />

      {featuredHotels.length > 0 ? (
        <>
          <div>
            <h2 className="text-xl font-semibold mb-4 px-4 md:px-0">Featured Hotels</h2>
            <div className="relative px-4 md:px-12">
              {featuredHotels.length > 1 && (
                <button
                  onClick={() => setCurrentFeaturedIndex(prev => 
                    prev > 0 ? prev - 1 : featuredHotels.length - 1
                  )}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/50 rounded-full p-2 hover:bg-white/75"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {featuredHotels[currentFeaturedIndex] && (
                <MemoizedHotelCard
                  key={featuredHotels[currentFeaturedIndex].name}
                  hotelData={featuredHotels[currentFeaturedIndex]}
                  isSelected={isHotelSelected(featuredHotels[currentFeaturedIndex].name)}
                  onSelect={onHotelSelect}
                  dateRange={dateRange}
                />
              )}

              {featuredHotels.length > 1 && (
                <button
                  onClick={() => setCurrentFeaturedIndex(prev => 
                    prev < featuredHotels.length - 1 ? prev + 1 : 0
                  )}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/50 rounded-full p-2 hover:bg-white/75"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
              
              <div className="flex justify-center items-center mt-4 space-x-1">
                {featuredHotels.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFeaturedIndex(index)}
                    className={`h-2 rounded-full transition-all duration-200 ${
                      index === currentFeaturedIndex 
                        ? 'bg-blue-600 w-4' 
                        : 'bg-gray-300 w-2'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {otherHotels.length > 0 && (
            <div className="border rounded-lg overflow-hidden mx-4 md:mx-0">
              <button
                onClick={() => setShowAllHotels(!showAllHotels)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
              >
                <h2 className="text-xl font-semibold">
                  More Hotels ({otherHotels.length})
                </h2>
                {showAllHotels ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
              
              {showAllHotels && (
                <div className="max-h-96 overflow-y-auto">
                  <div className="p-4 space-y-4">
                    {otherHotels.map((hotel) => (
                      <MemoizedHotelCard
                        key={hotel.name}
                        hotelData={hotel}
                        isSelected={isHotelSelected(hotel.name)}
                        onSelect={onHotelSelect}
                        dateRange={dateRange}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="p-4 text-center text-gray-500 bg-white rounded-lg border mx-4 md:mx-0">
          No hotels match your current filters
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.dateRange === nextProps.dateRange &&
    JSON.stringify(prevProps.selections) === JSON.stringify(nextProps.selections) &&
    JSON.stringify(prevProps.hotelData) === JSON.stringify(nextProps.hotelData)
  );
});

export default HotelDisplay;