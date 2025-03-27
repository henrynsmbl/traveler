'use client'

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExternalLink, ChevronDown } from 'lucide-react';
import type { FlightData } from '@/types/flight';
import type { HotelData } from '@/types/hotel';
import type { TableData } from './Tables';
import rehypeRaw from 'rehype-raw';
import type { Citation } from '@/types/messages';

export type ContentType = 'text' | 'table' | 'image' | 'video' | 'flight' | 'hotel' | 'markdown';

export type FlightContent = {
  best_flights: FlightData[];
  other_flights: FlightData[];
}

export type HotelContent = {
  properties: HotelData[];
}

export interface MessageContent {
  type: ContentType;
  content: string | TableData | FlightContent | HotelContent | React.ReactNode;
  citations?: Citation[];
}

interface MarkdownMessageProps {
  content: string;
  className?: string;
  processedContent?: string;
  enableReferences?: boolean;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ 
  content, 
  className = '',
  processedContent,
  enableReferences = false
}) => {
  if (enableReferences && processedContent) {
    return (
      <div 
        className={`prose dark:prose-invert max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    );
  }
  
  return (
    <div className={`prose dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

interface CitationsProps {
  citations: Citation[];
}

export const Citations: React.FC<CitationsProps> = ({ citations }) => {
  const [showSources, setShowSources] = useState(false);
  
  if (!citations || citations.length === 0) return null;
  
  return (
    <div className="mt-3">
      <button 
        onClick={() => setShowSources(!showSources)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
        aria-expanded={showSources}
      >
        <ChevronDown 
          className={`h-3.5 w-3.5 transition-transform duration-200 ${showSources ? 'rotate-180' : ''}`} 
        />
        {showSources ? 'Hide sources' : 'View sources'}
      </button>
      
      {showSources && (
        <div className="mt-2 pl-4 border-l border-blue-200 dark:border-blue-800 space-y-2.5">
          {citations.map((citation, idx) => (
            <div key={idx} className="flex flex-col">
              <a 
                href={citation.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                <span className="line-clamp-1">{citation.title || citation.url}</span>
                <ExternalLink className="ml-1.5 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              {citation.snippet && (
                <p className="text-xs text-blue-500/70 dark:text-blue-400/70 mt-1 line-clamp-2">
                  {citation.snippet}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};