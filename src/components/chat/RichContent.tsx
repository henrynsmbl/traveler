'use client'

import React from 'react';
import { StaticTable, EditableTable } from './Tables';
import FlightDisplay from '../flight/FlightDisplay';
import HotelDisplay from '../hotel/HotelDisplay';
import { MarkdownMessage, Citations } from './MessageComponents';
import type { MessageContent, FlightContent, HotelContent } from '../../types/messages';
import type { FlightData } from '@/types/flight';
import type { HotelData } from '@/types/hotel';
import type { Selection } from '@/types/selections';
import type { TableData } from './Tables';

interface RichContentProps {
  content: MessageContent;
  isUser?: boolean;
  onUpdate?: (newContent: MessageContent) => void;
  onFlightSelect: (flight: FlightData) => void;
  onHotelSelect: (hotel: HotelData) => void;
  selections: Selection[];
  hideOtherFlights?: boolean;
}

const MemoizedHotelDisplay = React.memo(HotelDisplay);

const RichContent: React.FC<RichContentProps> = React.memo(({ 
    content, 
    isUser = false,
    onUpdate,
    onFlightSelect,
    onHotelSelect,
    selections,
    hideOtherFlights
  }) => {
    switch (content.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <MarkdownMessage content={content.content as string} 
            className={isUser ? 'text-white' : ''} />
            {content.citations && <Citations citations={content.citations} />}
          </div>
        );
      
      case 'table':
        const tableData = content.content as TableData
        return (
          <div className="my-2">
            {tableData.editable ? (
              <EditableTable 
                data={tableData} 
                onSave={(newData) => {
                  if (onUpdate) {
                    onUpdate({
                      type: 'table',
                      content: newData
                    })
                  }
                }} 
              />
            ) : (
              <StaticTable data={tableData} />
            )}
          </div>
        )
      
      case 'image':
        return (
          <div className="my-2">
            <img
              src={content.content as string}
              alt="Message content"
              className="max-w-full rounded-lg"
              loading="lazy"
            />
          </div>
        )
      
      case 'video':
        return (
          <div className="my-2">
            <video
              controls
              className="max-w-full rounded-lg"
            >
              <source src={content.content as string} />
              Your browser does not support the video tag.
            </video>
          </div>
        )
      
      case 'flight':
        const flightContent = content.content as FlightContent
        return (
          <div className="my-2">
            <FlightDisplay 
              flightData={flightContent}
              selections={selections}
              onFlightSelect={onFlightSelect}
              hideOtherFlights={hideOtherFlights}
            />
          </div>
        )
  
      case 'hotel':
        const hotelContent = content.content as HotelContent;
        return (
          <MemoizedHotelDisplay
            hotelData={hotelContent}
            selections={selections}
            onHotelSelect={onHotelSelect}
          />
        )
      
      default:
        return null
    }
  }, (prevProps, nextProps) => {
    // Quick equality checks first
    if (prevProps.isUser !== nextProps.isUser) return false;
    if (prevProps.content.type !== nextProps.content.type) return false;
    if (prevProps.hideOtherFlights !== nextProps.hideOtherFlights) return false;
    
    // Only do deep comparison if content or selections changed
    const contentChanged = prevProps.content !== nextProps.content;
    const selectionsChanged = prevProps.selections !== nextProps.selections;
    
    if (!contentChanged && !selectionsChanged) return true;
    
    // Only do expensive JSON.stringify if necessary
    if (contentChanged || selectionsChanged) {
      return prevProps.content === nextProps.content && 
             prevProps.selections === nextProps.selections;
    }
    
    return true;
  });

export default React.memo(RichContent);