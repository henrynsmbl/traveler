'use client'

import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { FlightData } from '@/types/flight';
import type { HotelData } from '@/types/hotel';
import type { TableData } from './Tables';
import rehypeRaw from 'rehype-raw';

export type ContentType = 'text' | 'table' | 'image' | 'video' | 'flight' | 'hotel' | 'markdown';

export type FlightContent = {
  best_flights: FlightData[];
  other_flights: FlightData[];
}

export type HotelContent = {
  properties: HotelData[];
}

export interface Citation {
  url: string;
}

export interface MessageContent {
  type: ContentType;
  content: string | TableData | FlightContent | HotelContent | React.ReactNode;
  citations?: Citation[];
}

interface MarkdownMessageProps {
  content: string | React.ReactNode;
  className?: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, className = '' }) => {
  if (typeof content !== 'string') {
    return <div className={className}>{content}</div>;
  }
  
  return (
    <ReactMarkdown 
      className={`prose dark:prose-invert max-w-none ${className}`}
      components={{
        a: ({ node, ...props }) => (
          <a target="_blank" rel="noopener noreferrer" {...props} />
        ),
      }}
      rehypePlugins={[rehypeRaw]}
    >
      {content}
    </ReactMarkdown>
  );
};

export const Citations: React.FC<{ citations: Citation[] }> = ({ citations }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-4 text-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
      >
        <ExternalLink size={16} />
        {isExpanded ? 'Hide Sources' : 'View Sources'}
      </button>
      
      {isExpanded && (
        <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
          {citations.map((citation, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-gray-500 dark:text-gray-400">[{index + 1}]</span>
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {citation.url}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};