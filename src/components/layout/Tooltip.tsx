import React from 'react';

export const Tooltip: React.FC<{
  text: string;
  children: React.ReactNode;
}> = ({ text, children }) => {
  return (
    <div className="group relative">
      {children}
      <div className="absolute bottom-full mb-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
          {text}
        </div>
        <div className="w-2 h-2 bg-gray-800 transform rotate-45 absolute -bottom-1 right-3"></div>
      </div>
    </div>
  );
}; 