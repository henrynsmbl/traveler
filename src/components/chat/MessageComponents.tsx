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
  citations?: Citation[];
}

// Helper function to process citation references in text
const processCitationReferences = (text: string, citations: Citation[] = []) => {
  if (!text || !citations.length) {
    return text;
  }
  
  // Replace citation references like [1], [2], etc. with clickable links
  const result = text.replace(
    /\[(\d+)\]/g,
    (match, citationNum) => {
      const citationIndex = parseInt(citationNum) - 1;
      const citation = citations[citationIndex];
      
      if (citation?.url) {
        const link = `<a href="${citation.url}" target="_blank" rel="noopener noreferrer" class="citation-link text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium">${match}</a>`;
        return link;
      }
      
      return match; // Return original if citation not found
    }
  );
  
  return result;
};

// Helper function to process citation references in markdown text
const preprocessCitationsForMarkdown = (text: string, citations: Citation[] = []) => {
  if (!text || !citations.length) {
    return text;
  }
  
  // Replace citation references like [1], [2], etc. with markdown links
  const result = text.replace(
    /\[(\d+)\]/g,
    (match, citationNum) => {
      const citationIndex = parseInt(citationNum) - 1;
      const citation = citations[citationIndex];
      
      if (citation?.url) {
        // Convert to markdown link format: [text](url)
        const markdownLink = `[${match}](${citation.url})`;
        return markdownLink;
      }
      
      return match; // Return original if citation not found
    }
  );
  
  return result;
};

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ 
  content, 
  className = '',
  processedContent,
  enableReferences = false,
  citations = []
}) => {
  // If we have message references enabled and processedContent is provided, use that
  if (enableReferences && processedContent) {
    // If we also have citations, we need to process both
    const finalContent = citations.length > 0 
      ? processCitationReferences(processedContent, citations)
      : processedContent;
      
    return (
      <div 
        className={`prose dark:prose-invert max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: finalContent }}
      />
    );
  }
  
  // Process citations into markdown links before rendering
  const contentWithCitationLinks = citations.length > 0 
    ? preprocessCitationsForMarkdown(content, citations)
    : content;
  
  // Custom components to style citation links
  const components = {
    a: ({ href, children, ...props }: any) => {
      // Check if this is a citation link (contains [number] pattern)
      const isCitationLink = typeof children === 'string' && /^\[\d+\]$/.test(children);
      
      if (isCitationLink) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="citation-link text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
            {...props}
          >
            {children}
          </a>
        );
      }
      
      // Regular links
      return (
        <a href={href} {...props}>
          {children}
        </a>
      );
    }
  };

  return (
    <div className={`prose dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {contentWithCitationLinks}
      </ReactMarkdown>
    </div>
  );
};

interface CitationsProps {
  citations: Citation[];
  numbered?: boolean;
  onToggle?: (expanded: boolean) => void;
}

export const Citations: React.FC<CitationsProps> = ({ citations, numbered = false, onToggle }) => {
  const [showSources, setShowSources] = useState(false);
  
  const handleToggle = () => {
    const newState = !showSources;
    setShowSources(newState);
    onToggle?.(newState);
  };
  
  if (!citations || citations.length === 0) return null;
  
  return (
    <div className="mt-3">
      <button 
        onClick={handleToggle}
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
          <div className="mt-2 text-sm text-gray-500">
            <ul className="list-none pl-0">
              {citations.map((citation, index) => (
                <li key={index} className="mt-1 flex items-start">
                  {numbered && (
                    <span className="inline-block mr-2 font-medium">[{index + 1}]</span>
                  )}
                  <a 
                    href={citation.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline break-all"
                  >
                    {citation.title || citation.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};