'use client'

import React, { useRef, useEffect, useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import * as Popover from '@radix-ui/react-popover';
import type { FlightData, Flight } from '../../types/flight';
import type { HotelData } from '../../types/hotel';
import type { Selection, ActivitySelection } from '../../types/selections';
import 'react-day-picker/dist/style.css';
import type { DateRange } from "react-day-picker";
import InvoiceGenerator from './InvoiceGenerator';

interface HotelDates {
  [hotelId: string]: DateRange | undefined;
}

interface SelectionsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  selections: Selection[];
  onRemoveSelection: (id: string) => void;
  onUpdateHotelDates: (hotelId: string, dates: { from: Date; to: Date }) => void;
  isMobile: boolean;
  hotelDates: HotelDates;
  onUpdateSelection: (id: string, selection: Selection) => void;
}

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

const safeDate = (dateValue: any): Date | null => {
  try {
    if (!dateValue) return null;
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error('Error creating date:', error);
    return null;
  }
};

const formatDate = (dateTimeStr: string) => {
  try {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return dateTimeStr;
    
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

const calculateTotal = (selections: Selection[], hotelDates: HotelDates): number => {
  return selections.reduce((total, selection) => {
    if (selection.type === 'flight') {
      return total + selection.data.price;
    } else if (selection.type === 'hotel') {
      const dates = hotelDates[selection.id];
      if (dates?.from && dates?.to && selection.data.rate_per_night?.lowest) {
        const fromDate = safeDate(dates.from);
        const toDate = safeDate(dates.to);
        
        if (fromDate && toDate) {
          const nights = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
          const nightlyRate = parseFloat(selection.data.rate_per_night.lowest.replace(/[^0-9.]/g, ''));
          return total + (nightlyRate * nights);
        }
      }
      const nightlyRate = parseFloat(selection.data.rate_per_night?.lowest?.replace(/[^0-9.]/g, '') || '0');
      return total + nightlyRate;
    }
    return total;
  }, 0);
};

const SelectionsSidebar: React.FC<SelectionsSidebarProps> = ({
  isOpen,
  onClose,
  selections,
  onRemoveSelection,
  onUpdateHotelDates,
  isMobile,
  hotelDates,
  onUpdateSelection
}) => {
  const hasSelections = selections.length > 0;
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [notesState, setNotesState] = useState<{[key: string]: string}>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen && 
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('[role="dialog"]')
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const groupedSelections = selections.reduce((acc, selection) => {
    const { type } = selection;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(selection);
    return acc;
  }, {} as Record<'flight' | 'hotel' | 'activity', Selection[]>);

  const renderFlight = (flight: Flight) => (
    <div className="border-b dark:border-gray-700 last:border-b-0 py-2">
      <div className="flex items-center gap-2 mb-1">
        {flight.airline_logo && (
          <img 
            src={flight.airline_logo} 
            alt={flight.airline} 
            className="h-6 w-6 object-contain"
          />
        )}
        <span>{flight.airline} {flight.flight_number}</span>
      </div>
      <div className="text-sm space-y-1">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {formatDate(flight.departure_airport.time)}
        </div>
        <p>
          {flight.departure_airport.name} ({flight.departure_airport.id}) →{' '}
          {flight.arrival_airport.name} ({flight.arrival_airport.id})
        </p>
        <div className="font-medium text-gray-900 dark:text-gray-100">
          Arrives: {formatDate(flight.arrival_airport.time)}
        </div>
        <p>Duration: {formatDuration(flight.duration)}</p>
        <p>Class: {flight.travel_class}</p>
        {flight.overnight && (
          <p className="text-amber-600 dark:text-amber-400">Overnight flight</p>
        )}
      </div>
    </div>
  );

  const renderFlightSelection = (selection: Selection) => {
    const flightData = selection.data as FlightData;
    return (
      <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <button
          onClick={() => onRemoveSelection(selection.id)}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
          ${flightData.price.toFixed(2)}
        </div>

        {flightData.flights.map((flight, index) => (
          <React.Fragment key={`${selection.id}-flight-${flight.flight_number}-${index}`}>
            {renderFlight(flight)}
            {flightData.layovers?.[index] && (
              <div 
                key={`${selection.id}-layover-${index}`}
                className="py-2 px-4 bg-gray-50 dark:bg-gray-700 text-sm"
              >
                Layover at {flightData.layovers[index].name}:{' '}
                {formatDuration(flightData.layovers[index].duration)}
                {flightData.layovers[index].overnight && ' (Overnight)'}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderHotelSelection = (selection: Selection) => {
    const hotelData = selection.data as HotelData;
    const dates = hotelDates[selection.id];
    
    const calculateHotelPrice = () => {
      if (dates?.from && dates?.to && hotelData.rate_per_night?.lowest) {
        const fromDate = safeDate(dates.from);
        const toDate = safeDate(dates.to);
        
        if (fromDate && toDate) {
          const nights = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
          const nightlyRate = parseFloat(hotelData.rate_per_night.lowest.replace(/[^0-9.]/g, ''));
          return (nightlyRate * nights).toFixed(2);
        }
      }
      return hotelData.rate_per_night?.lowest?.replace(/[^0-9.]/g, '') || '0.00';
    };

    return (
      <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <button
          onClick={() => onRemoveSelection(selection.id)}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-3">
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            ${calculateHotelPrice()}
          </div>
          {hotelData.rate_per_night?.lowest && (
            <div className="text-sm text-gray-500">
              {hotelData.rate_per_night.lowest} per night
            </div>
          )}
        </div>

        <div className="mb-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{hotelData.name}</h4>
          {hotelData.address && (
            <p className="text-sm text-gray-600 dark:text-gray-300">{hotelData.address}</p>
          )}
        </div>

        <div className="space-y-2">
          <Popover.Root>
            <Popover.Trigger asChild>
              <button className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                <Calendar className="h-4 w-4" />
                {dates?.from && dates?.to ? (
                  <span>
                    {(() => {
                      const fromDate = safeDate(dates.from);
                      const toDate = safeDate(dates.to);
                      
                      if (fromDate && toDate) {
                        return `${format(fromDate, 'MMM d')} - ${format(toDate, 'MMM d, yyyy')}`;
                      }
                      
                      return 'Invalid dates';
                    })()}
                  </span>
                ) : (
                  <span>Select dates</span>
                )}
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content 
                className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[100]"
                sideOffset={5}
              >
                <DayPicker
                  mode="range"
                  selected={dates}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      onUpdateHotelDates(selection.id, {
                        from: range.from,
                        to: range.to
                      });
                    }
                  }}
                  disabled={{ before: new Date() }}
                  className="dark:text-white"
                />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </div>
    );
  };

  const renderActivitySelection = (selection: Selection) => {
    const activityData = selection.data as ActivitySelection['data'];
    const isEditing = editingId === selection.id;
    const notes = isEditing ? notesState[selection.id] : (activityData.notes || '');

    const handleSaveNotes = () => {
      if (selection.type === 'activity') {
        onUpdateSelection(selection.id, {
          ...selection,
          data: { ...activityData, notes: notesState[selection.id] }
        } as ActivitySelection);
      }
      setEditingId(null);
    };

    return (
      <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="w-[calc(100%-28px)] max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            <p className="text-gray-600 dark:text-gray-300">
              {activityData.description}
            </p>
          </div>
          <button
            onClick={() => onRemoveSelection(selection.id)}
            className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 ml-2 flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={notes}
              onChange={(e) => setNotesState({ ...notesState, [selection.id]: e.target.value })}
              placeholder="Add notes..."
              className="w-full p-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
              rows={2}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setEditingId(null)}>Cancel</button>
              <button onClick={handleSaveNotes}>Save</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditingId(selection.id)}>
            {notes ? 'Edit notes' : 'Add notes'}
          </button>
        )}
        {!isEditing && notes && (
          <div className="mt-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 pr-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic whitespace-pre-wrap">
              {notes}
            </p>
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className={`h-full flex flex-col bg-white dark:bg-gray-800 ${isMobile ? '' : 'shadow-lg'}`}>
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold">Your Selections</h2>
        {isMobile && (
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {!hasSelections && (
          <p className="text-gray-500 dark:text-gray-400 text-center">
            No items selected yet
          </p>
        )}

        {groupedSelections.flight?.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-500">Flights</h3>
            <div className="space-y-3">
              {groupedSelections.flight.map(selection => (
                <div key={`selection-${selection.id}`}>
                  {renderFlightSelection(selection)}
                </div>
              ))}
            </div>
          </div>
        )}

        {groupedSelections.hotel?.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-500">Hotels</h3>
            <div className="space-y-3">
              {groupedSelections.hotel.map(selection => (
                <div key={`selection-${selection.id}`}>
                  {renderHotelSelection(selection)}
                </div>
              ))}
            </div>
          </div>
        )}

        {groupedSelections.activity?.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-500">Activities</h3>
            <div className="space-y-3">
              {groupedSelections.activity.map(selection => (
                <div key={`selection-${selection.id}`}>
                  {renderActivitySelection(selection)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {hasSelections && (
        <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Total Selections:</span>
              <span>{selections.length}</span>
            </div>
            <div className="flex justify-between items-center font-semibold text-gray-900 dark:text-white">
              <span>Total Price:</span>
              <span>${calculateTotal(selections, hotelDates).toFixed(2)}</span>
            </div>
            <InvoiceGenerator 
              selections={selections} 
              hotelDates={hotelDates} 
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={sidebarRef}
      className={`fixed top-16 right-0 w-80 h-[calc(100vh-4rem)] transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } z-30`}
    >
      {sidebarContent}
    </div>
  );
};

export default SelectionsSidebar;