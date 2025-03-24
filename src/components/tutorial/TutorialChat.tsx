'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Message } from '@/types/messages';
import type { FlightData } from '@/types/flight';
import RichContent from '../chat/RichContent';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import flightExample from '../../../public/flight_example_result.json';
import hotelExample from '../../../public/hotel_example_result.json';
import React from 'react';
import { MarkdownMessage } from '../chat/MessageComponents';
import ReactMarkdown from 'react-markdown';

const TutorialHighlight = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="relative group mt-6 pt-3 inline-block">
      <div className="absolute -top-6 sm:-top-7 left-1/2 transform -translate-x-1/2 z-10 opacity-90 group-hover:opacity-100 transition-opacity">
        <div className="bg-blue-500 text-white px-2 sm:px-3 py-1 rounded-full shadow-lg flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Add to aitinerary</span>
        </div>
      </div>
      <span className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded cursor-pointer">
        {children}
      </span>
    </span>
  );
};

const tutorialMessages: Array<{ title: string; messages: Message[] }> = [
  {
    title: "Ask anything",
    messages: [
      {
        contents: [{
          type: 'text',
          content: "what is a good place to solo travel?"
        }],
        isUser: true,
        timestamp: new Date()
      },
      {
        contents: [{
          type: 'text',
          content: "**Seoul, South Korea**: Named one of the world's best solo travel destinations, Seoul offers an easy-to-use transport system, friendly locals, and consistently ranks as the safest city in Asia."
        }],
        isUser: false,
        timestamp: new Date()
      }
    ]
  },
  {
    title: "Highlight & save findings",
    messages: [
      {
        contents: [{
          type: 'text',
          content: "what is a good place to solo travel?"
        }],
        isUser: true,
        timestamp: new Date()
      },
      {
        contents: [{
          type: 'text',
          content: "\n\n"
        }],
        isUser: false,
        timestamp: new Date()
      },
      {
        contents: [{
          type: 'text',
          content: "**Seoul, South Korea**: <TutorialHighlight>Named one of the world's best solo travel destinations, Seoul offers an easy-to-use transport system, friendly locals, and consistently ranks as the safest city in Asia.</TutorialHighlight>"
        }],
        isUser: false,
        timestamp: new Date()
      }
    ]
  },
  {
    title: "Search flights instantly",
    messages: [
      {
        contents: [{
          type: 'text',
          content: "show me one way flights from DEN to LHR tomorrow"
        }],
        isUser: true,
        timestamp: new Date()
      },
      {
        contents: [ {
          type: 'flight',
          content: {
            best_flights: flightExample.best_flights as unknown as FlightData[],
            other_flights: flightExample.other_flights as unknown as FlightData[]
          }
        }],
        isUser: false,
        timestamp: new Date()
      }
    ]
  },
  {
    title: "Find perfect hotels",
    messages: [
      {
        contents: [{
          type: 'text',
          content: "show me the best hotels in Roatan tomorrow"
        }],
        isUser: true,
        timestamp: new Date()
      },
      {
        contents: [ {
          type: 'hotel',
          content: {
            properties: hotelExample.properties
          }
        }],
        isUser: false,
        timestamp: new Date()
      }
    ]
  }
];

const processContent = (content: string) => {
  if (typeof content !== 'string') {
    return content;
  }

  // Split by TutorialHighlight tags first
  const parts = content.split(/(<TutorialHighlight>[\s\S]*?<\/TutorialHighlight>)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('<TutorialHighlight>')) {
      // Extract content between TutorialHighlight tags
      const highlightContent = part.replace(/<TutorialHighlight>([\s\S]*?)<\/TutorialHighlight>/, '$1');
      
      // Process bold text
      const boldParts = highlightContent.split(/(\*\*.*?\*\*)/g);
      const processedContent = boldParts.map((boldPart, boldIndex) => {
        if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
          return <strong key={boldIndex}>{boldPart.slice(2, -2)}</strong>;
        }
        return boldPart;
      });
      
      return (
        <TutorialHighlight key={index}>
          {processedContent}
        </TutorialHighlight>
      );
    } else {
      // Process bold text in non-highlighted content
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return boldParts.map((boldPart, boldIndex) => {
        if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
          return <strong key={`${index}-${boldIndex}`}>{boldPart.slice(2, -2)}</strong>;
        }
        return boldPart;
      });
    }
  });
};

export const TutorialChat = () => {
  return (
    <div className="w-full max-w-[100vw] px-2 sm:px-4 mx-auto relative pb-8">
      {/* Desktop Grid Layout - hidden on mobile */}
      <div className="hidden md:grid grid-cols-2 gap-6 lg:gap-8">
        {tutorialMessages.map((conversation, convIndex) => (
          <div 
            key={convIndex}
            className="w-full overflow-hidden bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-sm p-4 lg:p-6 border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 hover:scale-[1.02] hover:bg-white/80 dark:hover:bg-gray-800/80"
          >
            <div className="mb-4">
              <div className="inline-block">
                <h2 className="text-lg lg:text-xl font-semibold truncate bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {conversation.title}
                </h2>
                <div className="mt-1 h-0.5 w-full bg-gradient-to-r from-blue-500 to-blue-500/0"></div>
              </div>
            </div>
            
            <div className="space-y-4 w-full min-h-[250px]">
              {/* Special padding for highlight example */}
              {convIndex === 1 && <div className="h-4"></div>}
              
              {conversation.messages.map((message, index) => (
                <div key={`message-${convIndex}-${index}`} className="px-0.5 w-full">
                  {message.isUser ? (
                    <div className="flex justify-end w-full">
                      <div className="bg-[#4B7BF5] text-white px-3 py-2 rounded-lg max-w-[85%] text-sm break-words">
                        {message.contents[0].content as string}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-800 dark:text-gray-200 text-sm w-full">
                      {message.contents.map((content, contentIndex) => (
                        content.type === 'text' ? (
                          <div key={`text-${contentIndex}`} className="prose dark:prose-invert max-w-none w-full">
                            {typeof content.content === 'string' && content.content.includes('<TutorialHighlight>') ? (
                              <div className="break-words">
                                {processContent(content.content)}
                              </div>
                            ) : (
                              <MarkdownMessage 
                                content={typeof content.content === 'string' ? content.content : JSON.stringify(content.content)}
                                className="break-words"
                              />
                            )}
                          </div>
                        ) : (
                          <div key={`rich-${contentIndex}`} className="transform scale-90 origin-left w-full overflow-hidden">
                            <RichContent
                              content={content}
                              isUser={false}
                              onFlightSelect={() => {}}
                              onHotelSelect={() => {}}
                              selections={[]}
                              hideOtherFlights={true}
                            />
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Scrollable Layout - hidden on desktop */}
      <div className="md:hidden space-y-8">
        {tutorialMessages.map((conversation, convIndex) => (
          <div 
            key={convIndex}
            className="w-full overflow-hidden bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700 transition-all duration-300 active:scale-[0.99] active:bg-white/80 dark:active:bg-gray-800/80"
          >
            <div className="mb-3">
              <div className="inline-block">
                <h2 className="text-base sm:text-lg font-semibold truncate bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {conversation.title}
                </h2>
                <div className="mt-1 h-0.5 w-full bg-gradient-to-r from-blue-500 to-blue-500/0"></div>
              </div>
            </div>
            
            <div className="space-y-3 w-full">
              {convIndex === 1 && <div className="h-4"></div>}
              
              {conversation.messages.map((message, index) => (
                <div key={`message-${convIndex}-${index}`} className="px-0.5 w-full">
                  {message.isUser ? (
                    <div className="flex justify-end w-full">
                      <div className="bg-[#4B7BF5] text-white px-3 py-2 rounded-lg max-w-[85%] text-sm break-words">
                        {message.contents[0].content as string}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-800 dark:text-gray-200 text-sm w-full">
                      {message.contents.map((content, contentIndex) => (
                        content.type === 'text' ? (
                          <div key={`text-${contentIndex}`} className="prose dark:prose-invert max-w-none w-full">
                            {typeof content.content === 'string' && content.content.includes('<TutorialHighlight>') ? (
                              <div className="break-words">
                                {processContent(content.content)}
                              </div>
                            ) : (
                              <MarkdownMessage 
                                content={typeof content.content === 'string' ? content.content : JSON.stringify(content.content)}
                                className="break-words"
                              />
                            )}
                          </div>
                        ) : (
                          <div key={`rich-${contentIndex}`} className="transform scale-90 origin-left w-full overflow-hidden">
                            <RichContent
                              content={content}
                              isUser={false}
                              onFlightSelect={() => {}}
                              onHotelSelect={() => {}}
                              selections={[]}
                              hideOtherFlights={true}
                            />
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};