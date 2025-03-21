'use client'

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
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
  // If we have processed content with references, use dangerouslySetInnerHTML
  if (enableReferences && processedContent) {
    return (
      <div 
        className={`prose dark:prose-invert max-w-none ${className}`}
        dangerouslySetInnerHTML={{ 
          __html: DOMPurify.sanitize(processedContent, {
            ADD_ATTR: ['data-message-ref']
          }) 
        }}
      />
    );
  }
  
  // Otherwise use ReactMarkdown
  return (
    <ReactMarkdown
      className={`prose dark:prose-invert max-w-none ${className}`}
      remarkPlugins={[remarkGfm]}
    >
      {content}
    </ReactMarkdown>
  );
};

export const Citations: React.FC<{ citations: { url: string }[] }> = ({ citations }) => {
  if (!citations || citations.length === 0) return null;
  
  return (
    <div className="mt-2 text-sm">
      <p className="font-medium text-gray-700 dark:text-gray-300">Sources:</p>
      <ul className="list-disc pl-5 space-y-1">
        {citations.map((citation, index) => (
          <li key={index}>
            <a 
              href={citation.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline break-all"
            >
              {citation.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};