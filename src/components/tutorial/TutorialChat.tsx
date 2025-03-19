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

const TutorialHighlight = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="relative group">
      <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 z-10 hidden group-hover:block">
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
  const parts = content.split(/(<TutorialHighlight>.*?<\/TutorialHighlight>)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('<TutorialHighlight>')) {
      // Extract content between TutorialHighlight tags
      const highlightContent = part.replace(/<TutorialHighlight>(.*?)<\/TutorialHighlight>/, '$1');
      
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextConversation = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % tutorialMessages.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextConversation, 7000);
    if (isPaused) {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isPaused, nextConversation]);

  return (
    <div className="w-full max-w-[100vw] px-2 sm:px-4 sm:w-[92%] max-w-2xl mx-auto relative pb-8 group">
      <div className="overflow-hidden rounded-lg">
        <div 
          className="transition-transform duration-1000 ease-in-out flex w-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {tutorialMessages.map((conversation, convIndex) => (
            <div 
              key={convIndex}
              className="w-full flex-shrink-0 flex-grow-0 overflow-hidden"
              style={{ width: '100%', minWidth: '100%', maxWidth: '100%' }}
            >
              <div className="mb-2 sm:mb-6">
                <div className="inline-block">
                  <h2 className="text-base sm:text-lg md:text-2xl font-semibold truncate">
                    {tutorialMessages[convIndex].title}
                  </h2>
                  <div className="mt-1 sm:mt-2 h-0.5 sm:h-1 w-full bg-gradient-to-r from-blue-500 to-blue-500/0"></div>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-6 w-full">
                {tutorialMessages[convIndex].messages.map((message, index) => (
                  <div key={`message-${convIndex}-${index}`} className="px-0.5 sm:px-2 w-full">
                    {message.isUser ? (
                      <div key={`user-${index}`} className="flex justify-end w-full">
                        <div className="bg-[#4B7BF5] text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg max-w-[85%] text-sm sm:text-base break-words">
                          {message.contents[0].content as string}
                        </div>
                      </div>
                    ) : (
                      <div key={`assistant-${index}`} className="text-gray-800 dark:text-gray-200 text-sm sm:text-base w-full">
                        {message.contents.map((content, contentIndex) => (
                          content.type === 'text' ? (
                            <div key={`text-${contentIndex}`} className="prose dark:prose-invert max-w-none w-full">
                              <MarkdownMessage 
                                content={processContent(content.content as string)}
                                className={`${message.isUser ? 'text-white' : ''} break-words`}
                              />
                            </div>
                          ) : (
                            <div key={`rich-${contentIndex}`} className="transform scale-[0.85] sm:scale-90 md:scale-95 origin-left w-full overflow-hidden">
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

      {/* Progress Indicators */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex justify-center gap-1.5">
        {tutorialMessages.map((_, idx) => (
          <button
            key={`indicator-${idx}`}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentIndex 
                ? 'bg-blue-600 w-4' 
                : 'bg-gray-300 dark:bg-gray-700 w-1.5'
            }`}
          />
        ))}
      </div>
    </div>
  );
};