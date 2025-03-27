'use client'

import React, { useMemo, useCallback } from 'react'
import { useState, useRef, useEffect } from 'react'
import { Send, ShoppingCart, Map } from 'lucide-react'
import { AuthButton } from '../components/auth/AuthButton'
import { useAuth } from '../components/auth/AuthContext'
import { useChatSessions } from '../components/chat/ChatContext'
import SelectionsSidebar from '../components/layout/SelectionsSidebar'
import type { Message, MessageContent, ContentType, SearchAPIResponse, FlightContent, HotelContent } from '@/types/messages'
import type { Selection } from '@/types/selections'
import RichContent from '../components/chat/RichContent'
import { generateChatTitle } from '@/utils/chat'
import LoadingMessage from '@/components/layout/LoadingMessage'
import HighlightedText from '@/components/layout/HighlightedText'
import type { DateRange } from "react-day-picker";
import type { ChatSession } from '@/types/chat'
import SelectionPopover from '@/components/chat/SelectionPopover'
import { checkSubscription } from '@/lib/firebase/subscriptionFirestore'
import { useRouter } from 'next/navigation'
import MapComponent from '../components/map/MapComponent'
import { FlightSearchContainer } from '../components/flight/FlightSearch'
import { HotelSearchContainer } from '../components/hotel/HotelSearch'

const WelcomeScreen = () => {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-144px)] space-y-4 group">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 text-center">
        Your destination is <HighlightedText>one search away.</HighlightedText>
      </h1>
      {!user && (
        <div className="mt-8">
          <AuthButton />
        </div>
      )}
    </div>
  );
};

const CartButton: React.FC<{ 
  count: number; 
  onClick: () => void;
}> = ({ count, onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-24 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ease-in-out"
    aria-label="Toggle Selections"
  >
    <div className="relative">
      <ShoppingCart size={24} />
      {count > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </div>
      )}
    </div>
  </button>
);

const MapButton = React.memo(({ onClick, hasContent }: { onClick: () => void; hasContent?: boolean }) => (
  <button
    onClick={onClick}
    className="fixed bottom-40 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ease-in-out"
    aria-label="Toggle Map"
  >
    <div className="relative">
      <Map size={24} />
      {hasContent && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
      )}
    </div>
  </button>
));

const MemoizedMapComponent = React.memo(MapComponent);

async function searchAPI(prompt: string, history: Message[]): Promise<SearchAPIResponse> {
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt,
        history: history.filter(msg => 
          msg.contents.some(content => 
            !content.type || content.type === 'text'
          )
        ).map(msg => ({
          ...msg,
          contents: msg.contents.filter(content => 
            !content.type || content.type === 'text'
          )
        }))
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if the response is empty and provide a fallback
    if (!data.contents?.[0]?.content || data.contents[0].content.trim() === "") {
      console.warn('Empty response from API, using fallback');
      return {
        citations: [],
        response: "I'm sorry, I couldn't generate a response at this time. Please try again or rephrase your question.",
        flights: undefined,
        hotels: undefined
      };
    }
    
    // Extract the relevant fields from the response
    return {
      citations: data.contents?.[0]?.citations || [],
      response: data.contents?.[0]?.content || "",
      flights: data.contents?.[0]?.flights || undefined,
      hotels: data.contents?.[0]?.hotels || undefined
    };

  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Add this helper function at the top level
const isEmptyChat = (session: ChatSession | null) => {
  return session?.title === 'New Chat' && (!session.messages || session.messages.length === 0);
};

export default function Home() {
  const [currentInput, setCurrentInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selections, setSelections] = useState<Selection[]>([])
  const [isSelectionsSidebarOpen, setIsSelectionsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { user } = useAuth()
  const { 
    currentSession,
    createNewSession,
    updateCurrentSession,
    sessions
  } = useChatSessions()

  const [hotelDates, setHotelDates] = useState<{[key: string]: DateRange | undefined}>({});
  const handleUpdateHotelDates = (hotelId: string, dates: DateRange) => {
    setHotelDates(prev => ({
      ...prev,
      [hotelId]: dates
    }));
  };

  const messages = currentSession?.messages || []

  // Add subscription state
  const [hasSubscription, setHasSubscription] = useState(false);

  // Add subscription check
  useEffect(() => {
    const checkUserSubscription = async () => {
      if (user?.uid) {
        const isSubscribed = await checkSubscription(user.uid);
        setHasSubscription(isSubscribed);
      }
    };
    checkUserSubscription();
  }, [user]);

  // clear on logout
  useEffect(() => {
    if (!user) {
      setSelections([]);
      setCurrentInput('');
      setIsLoading(false);
    }
  }, [user]);

  // Add this state to track the latest user message
  const [latestUserMessageRef, setLatestUserMessageRef] = useState<HTMLDivElement | null>(null);

  // Replace the current useEffect for scrolling
  useEffect(() => {
    // When a new user message is added, scroll to that message instead of the bottom
    if (latestUserMessageRef && messages.length > 0 && messages[messages.length - 1].isUser) {
      latestUserMessageRef.scrollIntoView({ behavior: 'smooth' });
    }
    // When an AI response comes in, don't auto-scroll
  }, [messages, latestUserMessageRef]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!hasSubscription) {
      router.push('/subscription');
      return;
    }

    if (!currentInput.trim() || isLoading) return;
    
    if (!currentSession) {
      return
    }

    const userMessage: Message = {
      contents: [{
        type: 'text',
        content: currentInput.trim()
      }],
      isUser: true,
      timestamp: new Date()
    }
    
    const updatedMessages = [...messages, userMessage]
    
    setCurrentInput('')
    setIsLoading(true)
    
    if (inputRef.current) {
      inputRef.current.style.height = '24px'
    }
  
    try {
      // Update messages immediately to show user input
      await updateCurrentSession({ 
        messages: updatedMessages,
        title: generateChatTitle(updatedMessages)
      })

      const apiResponse = await searchAPI(currentInput.trim(), messages)
      
      const newMessages: Message[] = []
  
      // Add text response
      if (apiResponse.response) {
        const textMessage: Message = {
          contents: [{
            type: 'text',
            content: apiResponse.response
          }],
          isUser: false,
          timestamp: new Date()
        }
        newMessages.push(textMessage)
      }
  
      // Add flight data if available
      const flights = apiResponse.flights
      if (flights && (flights.best_flights?.length > 0 || flights.other_flights?.length > 0)) {
        const flightMessage: Message = {
          contents: [{
            type: 'flight',
            content: {
              best_flights: flights.best_flights || [],
              other_flights: flights.other_flights || [],
              search_metadata: flights.search_metadata
            }
          }],
          isUser: false,
          timestamp: new Date()
        }
        newMessages.push(flightMessage)
      }
  
      // Add hotel data if available
      const hotels = apiResponse.hotels
      const hotelProperties = hotels?.properties || []
      if (hotelProperties.length > 0) {
        const hotelMessage: Message = {
          contents: [{
            type: 'hotel',
            content: {
              properties: hotelProperties,
              search_metadata: hotels?.search_metadata
            }
          }],
          isUser: false,
          timestamp: new Date()
        }
        newMessages.push(hotelMessage)
      }
  
      // Add citations if present
      if (apiResponse.citations?.length > 0) {
        const citationMessage: Message = {
          contents: [{
            type: 'text',
            content: "",
            citations: apiResponse.citations
          }],
          isUser: false,
          timestamp: new Date()
        }
        newMessages.push(citationMessage)
      }
  
      // Update session with all messages
      const finalMessages = [...updatedMessages, ...newMessages]
      await updateCurrentSession({ 
        messages: finalMessages,
        title: generateChatTitle(finalMessages)
      })
  
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      const errorMessage: Message = {
        contents: [{
          type: 'text',
          content: "Sorry, I couldn't process your request at this time."
        }],
        isUser: false,
        timestamp: new Date()
      }
      await updateCurrentSession({ 
        messages: [...updatedMessages, errorMessage]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleNewChat = () => {
    // Check if current session is empty
    if (isEmptyChat(currentSession)) {
      return; // Don't create a new chat if current one is empty
    }

    // Check if there's any empty chat in sessions
    const existingEmptyChat = sessions.find(session => isEmptyChat(session));
    if (existingEmptyChat) {
      // Switch to existing empty chat instead of creating new one
      updateCurrentSession(existingEmptyChat);
      return;
    }

    // Only create new chat if no empty chats exist
    createNewSession();
  };

  // key generation functions
  const generateMessageKey = (message: Message, index: number): string => {
    const timestamp = message.timestamp ? message.timestamp.getTime() : Date.now();
    return `${message.isUser ? 'user' : 'assistant'}-${timestamp}-${index}`;
  };
  
  const generateContentKey = (content: MessageContent, messageIndex: number, contentIndex: number): string => {
    const typeString = content.type || 'text';
    const timestamp = Date.now();
    return `${typeString}-${messageIndex}-${contentIndex}-${timestamp}`;
  };

  const handleAddTextSelection = useCallback((text: string) => {
    const newSelection: Selection = {
      id: crypto.randomUUID(),
      type: 'activity',
      data: {
        description: text,
        addedAt: new Date()
      }
    };
    setSelections(prev => [...prev, newSelection]);
  }, []);

  const handleFlightSelect = useCallback((flight: any) => {
    // Check if flight is already selected by comparing flight numbers
    const isDuplicate = selections.some(s => 
      s.type === 'flight' && 
      s.data.flights.every((f: { flight_number: string }, i: number) => 
        f.flight_number === flight.flights[i]?.flight_number
      )
    );

    if (isDuplicate) {
      // Don't add if already selected
      return;
    }

    const newId = `flight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSelections(prev => [...prev, {
      id: newId,
      type: 'flight',
      data: flight,
      addedAt: new Date()
    }]);
  }, [selections]);

  const handleHotelSelect = useCallback((hotel: any) => {
    // Check if hotel is already selected
    const isAlreadySelected = selections.some(s => 
      s.type === 'hotel' && 
      s.data.name === hotel.name
    );

    if (isAlreadySelected) {
      // Don't add if already selected
      return;
    }

    const newId = `hotel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSelections(prev => [...prev, {
      id: newId,
      type: 'hotel',
      data: hotel,
      addedAt: new Date()
    }]);
  }, [selections]);

  // Add these memoized values
  const memoizedMessages = useMemo(() => messages, [messages]);

  const memoizedSelections = useMemo(() => selections, [selections]);

  // Inside the Home component, add these memoized handlers
  const memoizedHandlers = useMemo(() => ({
    handleFlightSelect,
    handleHotelSelect,
    handleAddTextSelection,
    handleUpdate: (messageIndex: number, contentIndex: number) => (newContent: MessageContent) => {
      const updatedMessages = [...messages];
      updatedMessages[messageIndex].contents[contentIndex] = newContent;
      updateCurrentSession({ messages: updatedMessages });
    }
  }), [messages, updateCurrentSession]); // Add other dependencies if needed

  // Update the renderRichContent callback
  const renderRichContent = useCallback((content: MessageContent, messageIndex: number, contentIndex: number, isUser: boolean) => (
  <RichContent 
    key={`${messageIndex}-${contentIndex}-${content.type}`}
    content={content}
    isUser={isUser}
    selections={memoizedSelections}
    onFlightSelect={memoizedHandlers.handleFlightSelect}
    onHotelSelect={memoizedHandlers.handleHotelSelect}
    onUpdate={memoizedHandlers.handleUpdate(messageIndex, contentIndex)}
  />
), [memoizedSelections, memoizedHandlers]);

  const router = useRouter();
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isFlightSearchOpen, setIsFlightSearchOpen] = useState(false);
  const [isHotelSearchOpen, setIsHotelSearchOpen] = useState(false);

  // Update the hotel data memoization to include all hotel messages
  const memoizedHotelData = useMemo(() => {
    // Get all hotel messages, sorted by timestamp
    const hotelMessages = messages
      .filter(m => m.contents.some(c => c.type === 'hotel'))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Get the most recent hotel message
    const latestHotelMessage = hotelMessages[0];
    
    if (!latestHotelMessage) return null;

    const hotelContent = latestHotelMessage.contents.find(c => 
      c.type === 'hotel'
    )?.content as HotelContent;

    return hotelContent;
  }, [messages]);

  // Update the hasContent check to use the memoized data
  const hasMapContent = useMemo(() => 
    memoizedHotelData?.properties?.some(hotel => hotel.gps_coordinates),
    [memoizedHotelData]
  );

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 relative">
      <div className="flex h-[calc(100vh-64px)] pt-16">
        <div className={`flex-1 transition-margin duration-200 ease-in-out
            ${isSidebarOpen ? 'md:ml-64' : 'ml-0'} relative`}>
          
          {user && currentSession && (
            <>
              <div className="max-w-5xl mx-auto px-4 pt-2">
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setIsFlightSearchOpen(!isFlightSearchOpen)}
                    className={`
                      px-5 py-2.5 text-sm font-medium
                      transition-colors duration-200
                      ${isFlightSearchOpen 
                        ? 'text-blue-700 dark:text-blue-300' 
                        : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'}
                    `}
                  >
                    {isFlightSearchOpen ? 'Close Flight Search' : 'Search Flights'}
                  </button>
                  
                  <button
                    onClick={() => setIsHotelSearchOpen(!isHotelSearchOpen)}
                    className={`
                      px-5 py-2.5 text-sm font-medium
                      transition-colors duration-200
                      ${isHotelSearchOpen 
                        ? 'text-blue-700 dark:text-blue-300' 
                        : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'}
                    `}
                  >
                    {isHotelSearchOpen ? 'Close Hotel Search' : 'Search Hotels'}
                  </button>
                </div>
              </div>
              
              {isFlightSearchOpen && (
                <div className="fixed inset-0 z-40 bg-white dark:bg-gray-900 overflow-auto pt-16">
                  <div className="max-w-5xl mx-auto p-4">
                    <FlightSearchContainer 
                      isOpen={isFlightSearchOpen}
                      setIsOpen={setIsFlightSearchOpen}
                    />
                  </div>
                </div>
              )}
              
              {isHotelSearchOpen && (
                <div className="fixed inset-0 z-40 bg-white dark:bg-gray-900 overflow-auto pt-16">
                  <div className="max-w-5xl mx-auto p-4">
                    <HotelSearchContainer 
                      isOpen={isHotelSearchOpen}
                      setIsOpen={setIsHotelSearchOpen}
                    />
                  </div>
                </div>
              )}
            </>
          )}
          
          <main className={`h-full pb-24 ${currentSession && messages.length > 0 ? 'overflow-y-auto scrollbar-gutter-stable' : ''}`}>
            {!user ? (
              <WelcomeScreen />
            ) : !currentSession || messages.length === 0 ? (
              <WelcomeScreen />
            ) : (
              <div className="max-w-5xl mx-auto space-y-6 p-4">
                <div className="relative flex-1 overflow-auto">
                  {messages.map((message, index) => (
                    <div
                      key={generateMessageKey(message, index)}
                      className={`${message.isUser ? 'flex justify-end' : 'w-full'} mb-4`}
                      ref={node => {
                        // If this is the latest user message, store a reference to it
                        if (message.isUser && index === messages.length - 1) {
                          setLatestUserMessageRef(node);
                        }
                      }}
                    >
                      <div
                        className={`${
                          message.isUser
                            ? 'max-w-[85%] md:max-w-[75%] rounded-lg p-3 bg-blue-500 text-white'
                            : 'w-full md:w-[85%] space-y-2 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {message.contents.map((content, contentIndex) => 
                          renderRichContent(content, index, contentIndex, message.isUser)
                        )}
                      </div>
                    </div>
                  ))}
                  <SelectionPopover onAddSelection={handleAddTextSelection} />
                </div>
                {isLoading && <LoadingMessage />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </main>

          {user && (
            <>
              {!isSelectionsSidebarOpen && !isFlightSearchOpen && (
                <>
                  <MapButton 
                    onClick={() => setIsMapOpen(true)} 
                    hasContent={hasMapContent}
                  />
                  <CartButton 
                    count={selections.length}
                    onClick={() => setIsSelectionsSidebarOpen(!isSelectionsSidebarOpen)}
                  />
                </>
              )}
              
              <footer className={`fixed bottom-0 border-t border-gray-200 dark:border-gray-700 
                bg-white dark:bg-gray-800 p-4 transition-all duration-200 ease-in-out w-full
                right-0 ${isSidebarOpen ? 'md:left-64' : 'left-0'}`}>
                <div className="max-w-2xl mx-auto relative">
                  {!hasSubscription ? (
                    <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
                      <a 
                        href="/subscription" 
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        Start Planning
                      </a>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleNewChat}
                        className="absolute -top-12 left-1/2 transform -translate-x-1/2 
                                  bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                                  text-gray-600 dark:text-gray-300 px-4 py-2 rounded-full
                                  border border-gray-300 dark:border-gray-600 shadow-sm
                                  transition-colors duration-200 text-sm font-medium"
                      >
                        New Chat
                      </button>
                      
                      <form onSubmit={handleSubmit}>
                        <div className="flex items-end bg-white dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-600 pr-3 pl-4 py-2">
                          <textarea
                            ref={inputRef}
                            value={currentInput}
                            onChange={(e) => {
                              const textarea = e.target;
                              const lines = textarea.value.split('\n');
                              if (lines.length > 3 && e.target.value.length > currentInput.length) {
                                return;
                              }
                              textarea.style.height = 'inherit';
                              const newHeight = Math.min(textarea.scrollHeight, 24 * 3);
                              textarea.style.height = `${newHeight}px`;
                              setCurrentInput(textarea.value);
                            }}
                            onKeyDown={handleKeyPress}
                            autoFocus
                            rows={1}
                            className="flex-1 resize-none bg-transparent border-0 focus:ring-0 outline-none
                                    dark:text-white min-h-[24px] py-0 overflow-y-auto scrollbar-none"
                            style={{
                              maxHeight: '72px'
                            }}
                            placeholder="Type a message..."
                          />
                          <button
                            type="submit"
                            disabled={isLoading || !currentInput.trim()}
                            className="ml-2 p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300
                                    disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                          >
                            {isLoading ? (
                              <div className="w-5 h-5 border-t-2 border-blue-600 dark:border-blue-400 rounded-full animate-spin" />
                            ) : (
                              <Send size={20} />
                            )}
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              </footer>
            </>
          )}
        </div>

        <SelectionsSidebar
          isOpen={isSelectionsSidebarOpen}
          onOpen={() => setIsSelectionsSidebarOpen(true)}
          onClose={() => setIsSelectionsSidebarOpen(false)}
          selections={selections}
          onRemoveSelection={(id) => setSelections(prev => prev.filter(s => s.id !== id))}
          onUpdateSelection={(id, updatedSelection) => 
            setSelections(prev => prev.map(s => s.id === id ? updatedSelection : s))
          }
          isMobile={isMobile}
          hotelDates={hotelDates}
          onUpdateHotelDates={handleUpdateHotelDates}
        />
      </div>

      {user && isMapOpen && (
        <MemoizedMapComponent
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          selections={selections}
          hotelData={memoizedHotelData || undefined}
        />
      )}
    </div>
  )
}