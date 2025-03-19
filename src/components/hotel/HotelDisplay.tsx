import React, { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import HotelCard from '../layout/HotelCard';
import type { HotelData } from '@/types/hotel';
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
}

const MemoizedHotelCard = React.memo(HotelCard);

const HotelDisplay = React.memo(({ 
  hotelData, 
  searchQuery = '',
  selections = [],
  onHotelSelect,
  dateRange
}: HotelDisplayProps) => {
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState<number>(0);
  const [showAllHotels, setShowAllHotels] = useState<boolean>(false);

  // Memoize the isSelected check function
  const isHotelSelected = useCallback((hotelName: string) => 
    selections.some(selection => 
      selection.type === 'hotel' && 
      selection.data.name === hotelName
    ),
    [selections]
  );

  // Memoize filtered hotels
  const filteredHotels = useMemo(() => {
    if (!hotelData?.properties) return [];
    
    return hotelData.properties.filter(hotel => {
      if (!hotel) return false;

      const validImages = (hotel.images ?? []).filter(image => 
        image && 
        image.original_image && 
        image.original_image.trim() !== ''
      );

      const searchLower = searchQuery.toLowerCase();
      return validImages.length > 0 &&
        hotel.rate_per_night && 
        hotel.rate_per_night.lowest &&
        (!searchQuery || 
          hotel.name?.toLowerCase().includes(searchLower) ||
          hotel.description?.toLowerCase().includes(searchLower) ||
          hotel.rate_per_night.lowest.includes(searchQuery) ||
          hotel.amenities?.some(amenity => 
            amenity.toLowerCase().includes(searchLower)
          )
        );
    });
  }, [hotelData, searchQuery]);

  // Memoize the featured and other hotels
  const { featuredHotels, otherHotels } = useMemo(() => ({
    featuredHotels: filteredHotels.slice(0, 5),
    otherHotels: filteredHotels.slice(5)
  }), [filteredHotels]);

  // Memoize the current featured hotel
  const currentFeaturedHotel = useMemo(() => 
    featuredHotels[currentFeaturedIndex],
    [featuredHotels, currentFeaturedIndex]
  );

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
      {featuredHotels.length > 0 && (
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

            <MemoizedHotelCard
              key={currentFeaturedHotel.name}
              hotelData={currentFeaturedHotel}
              isSelected={isHotelSelected(currentFeaturedHotel.name)}
              onSelect={onHotelSelect}
              dateRange={dateRange}
            />

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
      )}

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