'use client'

import React, { useState, useMemo } from 'react';
import { Star, MapPin, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

interface HotelData {
  name: string;
  description?: string;
  hotel_class?: string;
  overall_rating?: number;
  reviews?: number;
  rate_per_night?: {
    lowest: string;
    extracted_lowest: number;
  };
  amenities?: string[];
  images?: Array<{
    thumbnail: string;
    original_image: string;
  }>;
  nearby_places?: Array<{
    name: string;
    transportations: Array<{
      type: string;
      duration: string;
    }>;
  }>;
}

interface HotelCardProps {
  hotelData: HotelData;
  isSelected?: boolean;
  onSelect?: (hotel: HotelData) => void;
  dateRange?: DateRange;
}

// First, update the PLACEHOLDER_IMAGE to something more subtle
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzIwIiB2aWV3Qm94PSIwIDAgNDAwIDMyMCIgZmlsbD0iI2Y0ZjRmNCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMjAiIGZpbGw9IiNmMGYwZjAiLz48cGF0aCBkPSJNMTYwIDEyMGg4MHY4MGgtODB6IiBmaWxsPSIjZTBlMGUwIi8+PC9zdmc+';

const HotelCard: React.FC<HotelCardProps> = ({
  hotelData,
  isSelected = false,
  onSelect,
  dateRange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState(false);
  const [loadedImages, setLoadedImages] = useState<{[key: string]: boolean}>({});

  // Memoize the filtered images to prevent re-calculation on every render
  const validImages = useMemo(() => (
    (hotelData.images ?? []).filter(image => 
      image && 
      image.original_image && 
      image.original_image.trim() !== ''
    )
  ), [hotelData.images]);

  const handleClick = (e: React.MouseEvent) => {
    // Prevent clicking if already selected
    if (isSelected) {
      return;
    }
    
    if ((e.target as HTMLElement).closest('button')?.contains(e.target as HTMLElement)) {
      return;
    }
    onSelect?.(hotelData);
  };

  const renderStars = (rating: number) => {
    return [...Array(Math.floor(rating))].map((_, index) => (
      <Star 
        key={`star-${hotelData.name}-${index}`}
        className="h-4 w-4 text-yellow-400" 
        fill="currentColor"
      />
    ));
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => prev > 0 ? prev - 1 : validImages.length - 1);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => prev < validImages.length - 1 ? prev + 1 : 0);
  };

  // Add a function to handle image loading
  const handleImageLoad = (imageUrl: string) => {
    setLoadedImages(prev => ({...prev, [imageUrl]: true}));
  };

  // Add a function to handle image error
  const handleImageError = (imageUrl: string) => {
    setLoadedImages(prev => ({...prev, [imageUrl]: false}));
  };

  return (
    <>
      {fullScreenImage && validImages.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={() => setFullScreenImage(false)}
        >
          <button 
            onClick={() => setFullScreenImage(false)} 
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full"
          >
            <X className="w-8 h-8" />
          </button>

          <div 
            className="relative max-w-[90%] max-h-[90%] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main Image */}
            <div className="relative max-w-full max-h-[80%] mb-4">
              <img
                key={validImages[currentImageIndex]?.original_image}
                src={validImages[currentImageIndex]?.original_image ?? PLACEHOLDER_IMAGE}
                alt={`Full screen image ${currentImageIndex + 1}`}
                className={`max-w-full max-h-full object-contain transition-opacity duration-200
                  ${loadedImages[validImages[currentImageIndex]?.original_image] ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => handleImageLoad(validImages[currentImageIndex]?.original_image)}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = PLACEHOLDER_IMAGE;
                }}
              />
              {/* Show placeholder while image is loading or if it failed to load */}
              {!loadedImages[validImages[currentImageIndex]?.original_image] && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="p-4 rounded-lg">
                    <img 
                      src={PLACEHOLDER_IMAGE} 
                      alt="Placeholder"
                      className="w-12 h-12 opacity-50"
                    />
                  </div>
                </div>
              )}
              {validImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </>
              )}
            </div>

            {/* Image Gallery */}
            {validImages.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto max-w-full pb-2">
                {validImages.map((image, index) => (
                  <div 
                    key={`${hotelData.name}-image-${index}`}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-20 h-20 flex-shrink-0 cursor-pointer bg-gray-100 relative
                      ${index === currentImageIndex ? 'border-2 border-white' : ''}`}
                  >
                    <img
                      key={image.original_image}
                      src={image.original_image || PLACEHOLDER_IMAGE}
                      alt={`Thumbnail ${index + 1}`}
                      className={`w-full h-full object-cover rounded transition-opacity duration-200
                        ${loadedImages[image.original_image] ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => handleImageLoad(image.original_image)}
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    
                    {/* Show placeholder while thumbnail is loading or if it failed */}
                    {!loadedImages[image.original_image] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="w-6 h-6 opacity-50">
                          <img 
                            src={PLACEHOLDER_IMAGE} 
                            alt="Placeholder"
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="text-white mt-2">
              {currentImageIndex + 1} / {validImages.length}
            </div>
          </div>
        </div>
      )}

      <div 
        onClick={handleClick}
        className={`w-full rounded-lg border transition-all duration-200 overflow-hidden
          ${isSelected 
            ? 'border-green-500 bg-green-50 cursor-default' 
            : 'border-gray-200 bg-white shadow hover:shadow-md cursor-pointer'
          }`}
      >
        {/* Image Section with Navigation */}
        {validImages.length > 0 && (
          <div className="relative w-full h-48 bg-gray-100">
            <img
              key={validImages[currentImageIndex]?.original_image}
              src={validImages[currentImageIndex]?.original_image ?? PLACEHOLDER_IMAGE}
              alt={hotelData.name}
              className={`w-full h-full object-cover transition-opacity duration-200
                ${loadedImages[validImages[currentImageIndex]?.original_image] ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => handleImageLoad(validImages[currentImageIndex]?.original_image)}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.src = PLACEHOLDER_IMAGE;
              }}
            />
            
            {/* Show placeholder while image is loading or if it failed to load */}
            {!loadedImages[validImages[currentImageIndex]?.original_image] && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="p-4 rounded-lg">
                  <img 
                    src={PLACEHOLDER_IMAGE} 
                    alt="Placeholder"
                    className="w-12 h-12 opacity-50"
                  />
                </div>
              </div>
            )}
            
            {/* Image Count and Full Screen Button */}
            <div className="absolute bottom-2 right-2 flex items-center space-x-2">
              {validImages.length > 1 && (
                <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  {currentImageIndex + 1} / {validImages.length}
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFullScreenImage(true);
                }}
                className="bg-black bg-opacity-50 text-white p-1 rounded hover:bg-opacity-70"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Image Navigation */}
            {validImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Content Section */}
        <div className="flex-grow p-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
            <div>
              <h2 className="text-lg md:text-xl font-semibold">{hotelData.name}</h2>
              
              {/* Move date display above the hotel class */}
              {dateRange?.from && (
                <div className="text-sm text-gray-600 mt-1 mb-1">
                  <span className="font-medium">Dates:</span>{' '}
                  {format(dateRange.from, 'MMM d, yyyy')}
                  {dateRange.to && ` - ${format(dateRange.to, 'MMM d, yyyy')}`}
                </div>
              )}

              <div className="flex items-center">
                Class: {hotelData.hotel_class && (
                  <div className="flex items-center ml-1">
                    {renderStars(parseInt(hotelData.hotel_class))}
                  </div>
                )}
              </div>
            </div>
            {hotelData.rate_per_night && (
              <div className="text-right">
                <div className="text-xl md:text-2xl font-bold text-green-600">
                  {hotelData.rate_per_night.lowest}
                </div>
                <div className="text-sm text-gray-500">per night</div>
              </div>
            )}
          </div>

          {/* Rating and Reviews */}
          {hotelData.overall_rating && (
            <div className="flex items-center mt-2 gap-2">
              <div className="bg-green-600 text-white px-2 py-1 rounded-lg font-bold">
                {hotelData.overall_rating.toFixed(1)}
              </div>
              <span className="text-sm text-gray-600">
                ({hotelData.reviews} reviews)
              </span>
            </div>
          )}
        </div>

        {/* Expand/Collapse Button */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-1 py-2 text-sm text-gray-500 hover:text-gray-700 border-t"
        >
          {isExpanded ? (
            <>
              <span>Show less</span>
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              <span>Show more details</span>
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 border-t space-y-4">
            {/* Full Description */}
            {hotelData.description && (
              <div>
                <p className="text-gray-600 text-sm">{hotelData.description}</p>
              </div>
            )}

            {/* Nearby Places */}
            {hotelData.nearby_places && hotelData.nearby_places.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Nearby Places</h3>
                <div className="grid gap-2">
                {hotelData.nearby_places.map((place, index) => (
                  <div key={`${hotelData.name}-place-${index}`} className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-gray-400" />
                    <div>
                      <div className="font-medium">{place.name}</div>
                      {place.transportations.map((transport, tIndex) => (
                        <div key={`${hotelData.name}-place-${index}-transport-${tIndex}`} className="text-sm text-gray-500">
                          {transport.type}: {transport.duration}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}

            {/* All Amenities */}
            {hotelData.amenities && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {hotelData.amenities.map((amenity, index) => (
                  <div key={`${hotelData.name}-amenity-${index}`} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                    {amenity}
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// Add a more thorough props comparison function at the bottom of the file
const hotelPropsAreEqual = (prevProps: HotelCardProps, nextProps: HotelCardProps) => {
  return (
    prevProps.hotelData.name === nextProps.hotelData.name &&
    prevProps.isSelected === nextProps.isSelected &&
    JSON.stringify(prevProps.dateRange) === JSON.stringify(nextProps.dateRange) &&
    JSON.stringify(prevProps.hotelData.images) === JSON.stringify(nextProps.hotelData.images)
  );
};

export default React.memo(HotelCard, hotelPropsAreEqual);