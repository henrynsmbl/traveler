import React from 'react';
import { format, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { ViewProps } from './types';

const YearView: React.FC<ViewProps> = ({ currentDate, events, onDateSelect }) => {
  const months = [];
  
  for (let i = 0; i < 12; i++) {
    months.push(new Date(currentDate.getFullYear(), i, 1));
  }
  
  const checkMonthHasEvents = (month: Date): boolean => {
    const firstDay = startOfMonth(month);
    const lastDay = endOfMonth(month);
    let currentDay = firstDay;
    
    while (currentDay <= lastDay) {
      if ((events[format(currentDay, 'yyyy-MM-dd')] || []).length > 0) {
        return true;
      }
      currentDay = addDays(currentDay, 1);
    }
    
    return false;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="p-3 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-6">{format(currentDate, 'yyyy')}</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-6">
          {months.map((month, index) => {
            const isCurrentMonth = month.getMonth() === new Date().getMonth() && 
                                  month.getFullYear() === new Date().getFullYear();
            
            const hasEvents = checkMonthHasEvents(month);
            
            return (
              <div 
                key={index} 
                className={`border rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 ${
                  isCurrentMonth ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
                } ${
                  hasEvents ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
                onClick={() => onDateSelect(month)}
              >
                <div 
                  className={`p-1 sm:p-2 text-center font-medium text-xs sm:text-sm ${
                    isCurrentMonth ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <span className="hidden sm:inline">{format(month, 'MMMM')}</span>
                  <span className="sm:hidden">{format(month, 'MMM')}</span>
                  {hasEvents && (
                    <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 dark:bg-blue-400 rounded-full ml-1"></span>
                  )}
                </div>
                
                <div className="p-1 sm:p-2 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {format(month, 'yyyy')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default YearView; 