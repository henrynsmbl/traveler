'use client'

import React, { useState } from 'react';
import { Search, UserRound, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tooltip } from './Tooltip';

interface ModeSelectorProps {
  currentMode: string;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  
  const modes = [
    { id: 'search', label: 'Search', description: "Find flights, hotels, and activities", icon: <Search size={24} /> },
    { id: 'agent', label: 'Travel Agent', description: "Get personalized travel recommendations", icon: <UserRound size={24} /> },
    { id: 'itinerary', label: 'Explore Itineraries', description: "Browse curated travel plans", icon: <FileText size={24} /> }
  ];
  
  // Get current mode label for the tooltip
  const currentModeLabel = modes.find(m => m.id === currentMode)?.label || 'Mode';
  
  const handleModeChange = (mode: string) => {
    setIsOpen(false);
    
    if (mode === currentMode) return;
    
    if (mode === 'search') {
      router.push('/');
    } else if (mode === 'agent') {
      router.push('/agent');
    } else if (mode === 'itinerary') {
      router.push('/explore-itineraries');
    }
  };
  
  return (
    <>
      <div className="fixed bottom-24 right-6 z-50">
        <Tooltip text={`Change Mode (${currentModeLabel})`}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ease-in-out"
            aria-label="Toggle Mode"
          >
            <div className="relative">
              {currentMode === 'search' && <Search size={24} />}
              {currentMode === 'agent' && <UserRound size={24} />}
              {currentMode === 'itinerary' && <FileText size={24} />}
            </div>
          </button>
        </Tooltip>
      </div>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center sm:items-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-sm w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Select Mode
              </h3>
              
              <div className="space-y-2">
                {modes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handleModeChange(mode.id)}
                    className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                      currentMode === mode.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className={`p-2 rounded-full mr-3 ${
                      currentMode === mode.id
                        ? 'bg-blue-200 dark:bg-blue-800'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`}>
                      {mode.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{mode.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {mode.description}
                      </div>
                    </div>
                    {currentMode === mode.id && (
                      <div className="ml-auto w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center mt-6 pb-6">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModeSelector;