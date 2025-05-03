import React from 'react';
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';
import { Plus } from 'lucide-react';
import { ViewProps } from './types';

const WeekView: React.FC<ViewProps> = ({ currentDate, selectedDate, events, onDateSelect }) => {
  const startDate = startOfWeek(currentDate);
  const endDate = endOfWeek(currentDate);
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const day = addDays(startDate, i);
    days.push(day);
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="p-3 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-6">
          {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
        </h2>
        
        <div className="grid grid-cols-7 gap-1 sm:gap-4">
          {days.map((day, index) => {
            const dayEvents = events[format(day, 'yyyy-MM-dd')] || [];
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const hasEvents = dayEvents.length > 0;
            
            return (
              <div 
                key={index} 
                className={`border rounded-lg overflow-hidden ${
                  isToday ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
                } ${
                  isSelected ? 'ring-1 sm:ring-2 ring-blue-500' : ''
                } ${
                  hasEvents ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div 
                  className={`p-1 sm:p-2 text-center font-medium ${
                    isToday ? 'bg-blue-500 text-white' : hasEvents ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <div className="text-xs sm:text-sm">{format(day, 'E')}</div>
                  <div className={`${isToday ? 'text-white' : hasEvents ? 'text-blue-800 dark:text-blue-200' : 'text-gray-600 dark:text-gray-400'} font-semibold text-xs sm:text-base`}>
                    {format(day, 'd')}
                    {hasEvents && (
                      <span className="relative inline-flex w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full ml-0.5 sm:ml-1 -top-1 sm:-top-2"></span>
                    )}
                  </div>
                </div>
                
                <div 
                  className="min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 cursor-pointer"
                  onClick={() => onDateSelect(day)}
                >
                  {dayEvents.length > 0 ? (
                    <div className="space-y-0.5 sm:space-y-1">
                      {dayEvents.slice(0, 2).map((event, idx) => (
                        <div 
                          key={idx} 
                          className={`p-0.5 sm:p-1 text-[9px] sm:text-xs rounded truncate ${event.color || 'bg-gray-100'}`}
                          title={event.title}
                        >
                          {event.time && <span className="font-medium mr-1 hidden sm:inline">{event.time}</span>}
                          <span className="truncate block">{event.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[8px] sm:text-xs text-center text-gray-500 dark:text-gray-400">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                      <Plus size={12} className="opacity-50 sm:hidden" />
                      <Plus size={16} className="opacity-50 hidden sm:block" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekView; 