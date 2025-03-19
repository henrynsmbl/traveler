import React, { useState } from 'react';
import { Link } from 'lucide-react';

interface Citation {
  url: string;
}

interface CitationsButtonProps {
  citations: Citation[];
}

const CitationsButton: React.FC<CitationsButtonProps> = ({ citations }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!citations?.length) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
      >
        <Link size={16} />
        <span>{citations.length} Citation{citations.length !== 1 ? 's' : ''}</span>
      </button>
      
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 min-w-[200px] z-10">
          <ul className="space-y-2">
            {citations.map((citation, index) => (
              <li key={index}>
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm block"
                >
                  {citation.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CitationsButton;