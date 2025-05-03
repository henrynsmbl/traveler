import React from 'react';
import { format, isSameDay } from 'date-fns';
import { Calendar, Plus } from 'lucide-react';
import { ViewProps } from './types';

const DayView: React.FC<ViewProps> = ({ currentDate, selectedDate, events, onDateSelect }) => {
  const dayEvents = events[format(currentDate, 'yyyy-MM-dd')] || [];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h2>
        
        {dayEvents.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No events scheduled for this day</p>
            <button 
              onClick={() => onDateSelect(currentDate)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Add Note
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {dayEvents.map((event, index) => (
              <div 
                key={index} 
                className={`p-4 border-l-4 rounded-r-lg ${event.color || 'bg-gray-100 border-gray-500'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{event.title}</h3>
                    {event.time && <p className="text-sm text-gray-600 dark:text-gray-400">{event.time}</p>}
                    {event.details && <p className="mt-1 text-gray-700 dark:text-gray-300">{event.details}</p>}
                  </div>
                  
                  {event.type === 'note' && event.id && (
                    <div className="flex gap-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <button 
              onClick={() => onDateSelect(currentDate)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Add Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayView; 