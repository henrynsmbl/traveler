import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, addDays, isSameDay, isSameMonth } from 'date-fns';
import { ViewProps } from './types';

const MonthView: React.FC<ViewProps> = ({ currentDate, selectedDate, events, onDateSelect }) => {
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const startDate = startOfWeek(firstDayOfMonth);
  
  const days = [];
  let day = startDate;
  
  // Generate 6 weeks (42 days) to ensure we cover the month
  for (let i = 0; i < 42; i++) {
    days.push(day);
    day = addDays(day, 1);
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="p-3 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-6">{format(currentDate, 'MMMM yyyy')}</h2>
        
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, index) => (
            <div key={index} className="text-center font-medium text-gray-500 dark:text-gray-400 text-xs sm:text-sm p-1 sm:p-2">
              {dayName}
            </div>
          ))}
          
          {days.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const dayEvents = events[format(day, 'yyyy-MM-dd')] || [];
            const hasEvents = dayEvents.length > 0;
            
            return (
              <div 
                key={index} 
                className={`border rounded-lg overflow-hidden ${
                  !isCurrentMonth ? 'opacity-40' : ''
                } ${
                  isToday ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
                } ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                } ${
                  hasEvents && isCurrentMonth ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => onDateSelect(day)}
              >
                <div 
                  className={`p-0.5 sm:p-1 text-center text-xs sm:text-sm ${
                    isToday ? 'bg-blue-500 text-white' : hasEvents ? 'font-semibold' : ''
                  }`}
                >
                  {format(day, 'd')}
                </div>
                
                <div className="min-h-[20px] sm:min-h-[40px] p-0.5 sm:p-1 hidden sm:block">
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5">
                      {/* Left column */}
                      <div className="w-1/2 space-y-1">
                        {dayEvents.slice(0, 3).map((event, idx) => (
                          <div 
                            key={`left-${idx}`} 
                            className={`h-1 sm:h-2 rounded-full ${
                              event.type === 'flight' ? 'bg-blue-500' :
                              event.type === 'hotel' ? 'bg-purple-500' :
                              'bg-amber-500'
                            }`}
                            title={event.title}
                          />
                        ))}
                      </div>
                      
                      {/* Right column - only show on larger screens */}
                      <div className="w-1/2 space-y-1 hidden sm:block">
                        {dayEvents.slice(3, 6).map((event, idx) => (
                          <div 
                            key={`right-${idx}`} 
                            className={`h-1 sm:h-2 rounded-full ${
                              event.type === 'flight' ? 'bg-blue-500' :
                              event.type === 'hotel' ? 'bg-purple-500' :
                              'bg-amber-500'
                            }`}
                            title={event.title}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {dayEvents.length > 6 && (
                    <div className="text-[8px] sm:text-[10px] text-center text-gray-500 mt-0.5">
                      +{dayEvents.length - 6}
                    </div>
                  )}
                </div>
                {/* Mobile indicator - just show a dot if there are events */}
                <div className="sm:hidden flex justify-center pb-0.5">
                  {hasEvents && (
                    <div className="h-1 w-1 rounded-full bg-blue-500"></div>
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

export default MonthView; 