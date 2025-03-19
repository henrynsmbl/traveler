'use client'

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import type { FlightData } from '../../types/flight';

interface FlightCardProps {
  flightData: FlightData;
  isSelected?: boolean;
  onSelect?: (flight: FlightData) => void;
}

interface EssentialInfo {
  airline: string;
  price: number;
  totalDuration: number;
  departureTime: string;
  arrivalTime: string;
  stops: number;
  departureDate: string;
  arrivalDate: string;
}

const formatTime = (time: string) => {
  // Expect time in 24hr format like "14:30" or "09:45"
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const formatDate = (dateTimeStr: string) => {
  try {
    if (!dateTimeStr) return '';
    
    // Parse the datetime string (format: "2024-12-30 23:16")
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return dateTimeStr; // Return original if invalid
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', dateTimeStr, error);
    return dateTimeStr;
  }
};

const FlightCard: React.FC<FlightCardProps> = ({ 
  flightData, 
  isSelected = false, 
  onSelect 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const essentialInfo: EssentialInfo = {
    airline: flightData.flights[0].airline,
    price: flightData.price,
    totalDuration: flightData.total_duration,
    departureTime: flightData.flights[0].departure_airport.time.split(' ')[1], // Get just the time part
    arrivalTime: flightData.flights[flightData.flights.length - 1].arrival_airport.time.split(' ')[1],
    stops: flightData.flights.length - 1,
    departureDate: flightData.flights[0].departure_airport.time, // Use the full datetime string
    arrivalDate: flightData.flights[flightData.flights.length - 1].arrival_airport.time
  };

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')?.contains(e.target as HTMLElement)) {
      return;
    }
    onSelect?.(flightData);
  };

  return (
    <div 
      onClick={handleClick}
      className={`w-full mb-4 rounded-lg border transition-all duration-200 cursor-pointer
        ${isSelected 
          ? 'border-green-500 bg-green-50 shadow-md' 
          : 'border-gray-200 bg-white shadow hover:shadow-md'
        }`}
    >

      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img 
              src={flightData.airline_logo} 
              alt={`${essentialInfo.airline} logo`}
              className="h-8 w-8 object-contain"
            />
            <h2 className="text-lg font-semibold">{essentialInfo.airline}</h2>
          </div>
          <div className="text-xl font-bold">${essentialInfo.price}</div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{Math.floor(essentialInfo.totalDuration / 60)}h {essentialInfo.totalDuration % 60}m</span>
          </div>
          <div>
            {essentialInfo.stops === 0 ? (
              <span className="text-green-600">Nonstop</span>
            ) : (
              <span>{essentialInfo.stops} stop{essentialInfo.stops > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {/* Updated Flight Times Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex-1 text-center sm:text-left w-full">
            <div className="text-sm text-gray-600 font-medium mb-1">DEPARTURE</div>
            <div className="font-bold text-base">{formatTime(essentialInfo.departureTime)}</div>
            <div className="text-sm text-gray-500">
              {flightData.flights[0].departure_airport.name}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {formatDate(essentialInfo.departureDate)}
            </div>
          </div>
          
          <div className="flex-none hidden sm:block">
            <svg width="120" height="14" className="text-gray-900" shapeRendering="geometricPrecision">
              <line x1="2" y1="7" x2="108" y2="7" stroke="currentColor" strokeWidth="1.5" />
              <polygon points="108,7 100,2 100,12" fill="currentColor" />
            </svg>
          </div>
          
          <div className="flex-1 text-center sm:text-right w-full">
            <div className="text-sm text-gray-600 font-medium mb-1">ARRIVAL</div>
            <div className="font-bold text-base">{formatTime(essentialInfo.arrivalTime)}</div>
            <div className="text-sm text-gray-500">
              {flightData.flights[flightData.flights.length - 1].arrival_airport.name}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {formatDate(essentialInfo.arrivalDate)}
            </div>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="w-full flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700"
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
          <div className="mt-4 space-y-4">
            {flightData.flights.map((flight, index) => (
              <div key={flight.flight_number} className="border-t pt-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">{flight.airline} {flight.flight_number}</div>
                    <div className="text-sm text-gray-500">{flight.airplane}</div>
                  </div>
                  <div className="text-sm">
                    {Math.floor(flight.duration / 60)}h {flight.duration % 60}m
                  </div>
                </div>

                {/* Flight Features */}
                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                {flight.extensions.map((feature, idx) => (
                  <div key={`${flight.flight_number}-feature-${idx}`} className="text-gray-500">
                    • {feature}
                  </div>
                ))}
                </div>

                {/* Layover Information */}
                {flightData.layovers && index < flightData.layovers.length && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-md">
                    <div className="text-sm font-medium">
                      {flightData.layovers[index].duration}m layover in {flightData.layovers[index].name}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Environmental Impact */}
            {flightData.carbon_emissions && (
              <div className="border-t pt-4">
                <div className="text-sm">
                  <div className="font-medium">Carbon Emissions</div>
                  <div className="text-gray-500">
                    This flight: {(flightData.carbon_emissions.this_flight / 1000).toFixed(1)}kg CO₂
                    <br />
                    {flightData.carbon_emissions.difference_percent > 0 ? (
                      <span className="text-red-500">
                        {flightData.carbon_emissions.difference_percent}% more
                      </span>
                    ) : (
                      <span className="text-green-500">
                        {Math.abs(flightData.carbon_emissions.difference_percent)}% less
                      </span>
                    )} than typical
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightCard;