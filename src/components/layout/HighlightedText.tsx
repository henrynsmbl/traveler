import React, { ReactNode } from 'react';

interface HighlightedTextProps {
  children: ReactNode;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ children }) => {
  return (
    <span className="relative inline-block">
      <span className="relative z-10">{children}</span>
      <span className="absolute bottom-0 left-0 w-full h-3 bg-blue-400/50"></span>
    </span>
  );
};

export default HighlightedText;