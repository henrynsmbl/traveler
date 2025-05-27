'use client'

import React, { useMemo, useCallback } from 'react'
import { useState, useRef, useEffect } from 'react'
import { Send, ShoppingCart, Map, Search, UserRound, FileText } from 'lucide-react'
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
import { saveSelections, getSelections, updateHotelDates } from '@/lib/firebase/selections'

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

// Add this tooltip component
const Tooltip: React.FC<{
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

const CartButton: React.FC<{ 
  count: number; 
  onClick: () => void;
}> = ({ count, onClick }) => (
  <div className="fixed bottom-24 right-6 z-50">
    <Tooltip text="View Selections">
      <button
        onClick={onClick}
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ease-in-out"
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
    </Tooltip>
  </div>
);

const MapButton = React.memo(({ onClick, hasContent }: { onClick: () => void; hasContent?: boolean }) => (
  <div className="fixed bottom-40 right-6 z-50">
    <Tooltip text="View Map">
      <button
        onClick={onClick}
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ease-in-out"
        aria-label="Toggle Map"
      >
        <div className="relative">
          <Map size={24} />
          {hasContent && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
          )}
        </div>
      </button>
    </Tooltip>
  </div>
));

const MemoizedMapComponent = React.memo(MapComponent);

async function searchAPI(prompt: string, history: Message[]): Promise<SearchAPIResponse> {
  try {
    console.log("searchAPI - Sending request with prompt:", prompt);
    
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
      console.error(`searchAPI - HTTP error: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("searchAPI - API response:", data);
    
    // Check if the response is empty and provide a fallback
    if (!data.contents?.[0]?.content && !data.contents?.[0]?.flights) {
      console.warn('Empty response from API, using fallback');
      return {
        citations: [],
        response: "I'm sorry, I couldn't generate a response at this time. Please try again or rephrase your question.",
        flights: undefined,
        hotels: undefined
      };
    }
    
    // Log the extracted flight data if present
    if (data.contents?.[0]?.flights) {
      console.log("searchAPI - Flight data found:", data.contents[0].flights);
    }
    
    // Extract the relevant fields from the response
    return {
      citations: data.contents?.[0]?.citations || [],
      response: data.contents?.[0]?.content || "Here are your search results.",
      flights: data.contents?.[0]?.flights || undefined,
      hotels: data.contents?.[0]?.hotels || undefined
    };

  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// New streaming search function
async function streamingSearchAPI(
  prompt: string, 
  history: Message[], 
  onTextChunk: (text: string) => void,
  onFlights: (flights: any) => void,
  onHotels: (hotels: any) => void,
  onCitations: (citations: any[]) => void,
  onComplete: () => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    console.log("streamingSearchAPI - Starting streaming request with prompt:", prompt);
    
    const filteredHistory = history.filter(msg => 
      msg.contents.some(content => 
        !content.type || content.type === 'text'
      )
    ).map(msg => ({
      ...msg,
      contents: msg.contents.filter(content => 
        !content.type || content.type === 'text'
      )
    }));

    // Construct the URL with query parameters
    const url = new URL('/api/search', window.location.origin);
    url.searchParams.set('prompt', prompt);
    url.searchParams.set('history', JSON.stringify(filteredHistory));

    const eventSource = new EventSource(url.toString());
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Streaming event received:", data);
        
        switch (data.type) {
          case 'start':
            console.log("Stream started:", data.message);
            break;
            
          case 'text_chunk':
            onTextChunk(data.content);
            break;
            
          case 'flights':
            onFlights(data.content);
            break;
            
          case 'hotels':
            onHotels(data.content);
            break;
            
          case 'citations':
            onCitations(data.content);
            break;
            
          case 'complete':
            console.log("Stream completed");
            eventSource.close();
            onComplete();
            break;
            
          case 'error':
            console.error("Stream error:", data.message);
            eventSource.close();
            onError(data.message);
            break;
        }
      } catch (parseError) {
        console.error("Error parsing streaming event:", parseError);
        eventSource.close();
        onError("Error parsing response");
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      eventSource.close();
      onError("Connection error occurred");
    };

    // Increase timeout to 60 seconds and add better error handling
    const timeoutId = setTimeout(() => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        console.log("EventSource timeout reached, closing connection");
        eventSource.close();
        onError("Request timed out - please try again");
      }
    }, 60000); // Increased from 30 seconds to 60 seconds

    // Clean up timeout when connection closes naturally
    const originalClose = eventSource.close.bind(eventSource);
    eventSource.close = () => {
      clearTimeout(timeoutId);
      originalClose();
    };

  } catch (error) {
    console.error('Streaming API call failed:', error);
    onError(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

// Add this helper function at the top level
const isEmptyChat = (session: ChatSession | null) => {
  return session?.title === 'New Chat' && (!session.messages || session.messages.length === 0);
};

// Update the ModeSelector component to include a tooltip
const ModeSelector: React.FC<{
  currentMode: string;
  onModeChange: (mode: string) => void;
}> = ({ currentMode, onModeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const modes = [
    { id: 'search', label: 'Search', description: "Find flights, hotels, and activities" },
    { id: 'agent', label: 'Travel Agent', description: "Get personalized travel recommendations" },
    { id: 'itinerary', label: 'Explore Itineraries', description: "Browse curated travel plans" }
  ];
  
  // Get current mode label for the tooltip
  const currentModeLabel = modes.find(m => m.id === currentMode)?.label || 'Mode';
  
  return (
    <>
      <div className="fixed bottom-56 right-6 z-50">
        <Tooltip text={`Change Mode (${currentModeLabel})`}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ease-in-out"
            aria-label="Toggle Mode"
          >
            <div className="relative">
              {currentMode === 'search' && <Search size={24} />}
              {currentMode === 'agent' && <UserRound size={24} />}
              {currentMode === 'itinerary' && <FileText size={24} />}
            </div>
          </button>
        </Tooltip>
      </div>
      
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 text-center mb-6">Select Mode</h3>
            
            <div className="flex flex-col md:flex-row gap-4 relative">
              {modes.map((mode, index) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    onModeChange(mode.id);
                    setIsOpen(false);
                  }}
                  className={`flex-1 p-4 rounded-lg flex flex-col items-center text-center transition-all duration-200 ${
                    currentMode === mode.id 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className={`p-3 rounded-full mb-2 ${
                    currentMode === mode.id
                      ? 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {mode.id === 'search' && <Search size={24} />}
                    {mode.id === 'agent' && <UserRound size={24} />}
                    {mode.id === 'itinerary' && <FileText size={24} />}
                  </div>
                  <div className="font-medium text-lg">{mode.label}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {mode.description}
                  </div>
                </button>
              ))}
              
              {/* Slider bar */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 mx-4 md:mx-8"></div>
              <div 
                className="absolute bottom-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300"
                style={{
                  left: `calc(${modes.findIndex(m => m.id === currentMode) * (100 / modes.length)}% + ${8 / modes.length}%)`,
                  width: `calc(${100 / modes.length}% - ${16 / modes.length}%)`,
                }}
              ></div>
            </div>
            
            <div className="flex justify-center mt-6">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default function Home() {
  const [currentInput, setCurrentInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [useStreaming, setUseStreaming] = useState(true) // User preference for streaming
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selections, setSelections] = useState<Selection[]>([])
  const [isSelectionsSidebarOpen, setIsSelectionsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [pendingUserMessage, setPendingUserMessage] = useState<Message | null>(null)
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
  const handleUpdateHotelDates = async (hotelId: string, dates: DateRange) => {
    setHotelDates(prev => ({
      ...prev,
      [hotelId]: dates
    }));
    
    if (user?.uid && dates.from && dates.to) {
      await updateHotelDates(user.uid, hotelId, {
        from: dates.from,
        to: dates.to
      });
    }
  };

  const messages = currentSession?.messages || []
  
  // Combine real messages with pending message for display
  const displayMessages = useMemo(() => {
    const allMessages = [...messages];
    if (pendingUserMessage) {
      allMessages.push(pendingUserMessage);
    }
    return allMessages;
  }, [messages, pendingUserMessage]);

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

  // Load selections from Firebase when user logs in
  useEffect(() => {
    const loadSelections = async () => {
      if (user?.uid) {
        try {
          const { selections: savedSelections, hotelDates: savedHotelDates } = await getSelections(user.uid);
          setSelections(savedSelections);
          setHotelDates(savedHotelDates);
        } catch (error) {
          console.error('Error loading selections:', error);
        }
      }
    };
    loadSelections();
  }, [user]);

  // Auto-save selections to Firebase whenever they change
  useEffect(() => {
    const saveSelectionsToFirebase = async () => {
      if (user?.uid) {
        try {
          await saveSelections(user.uid, selections, hotelDates);
        } catch (error) {
          console.error('Error saving selections:', error);
        }
      }
    };
    
    // Debounce the save operation
    const timeoutId = setTimeout(saveSelectionsToFirebase, 1000);
    return () => clearTimeout(timeoutId);
  }, [selections, hotelDates, user]);

  // clear on logout
  useEffect(() => {
    if (!user) {
      setSelections([]);
      setCurrentInput('');
      setIsLoading(false);
    }
  }, [user]);

  // Simple scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end',
        inline: 'nearest'
      });
    }
  }, []);

  // Scroll when messages change
  useEffect(() => {
    if (displayMessages.length > 0) {
      scrollToBottom();
    }
  }, [displayMessages, scrollToBottom]);

  // Scroll when streaming text updates
  useEffect(() => {
    if (isStreaming && streamingText) {
      scrollToBottom();
    }
  }, [streamingText, isStreaming, scrollToBottom]);

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
    
    const inputText = currentInput.trim()
    
    // Immediately show user message locally to prevent lag
    setPendingUserMessage(userMessage)
    setCurrentInput('')
    setIsLoading(true)
    
    if (inputRef.current) {
      inputRef.current.style.height = '24px'
    }

    const updatedMessages = [...messages, userMessage]

    try {
      // Update messages in background
      const updatePromise = updateCurrentSession({ 
        messages: updatedMessages,
        title: generateChatTitle(updatedMessages)
      });

      // Clear pending message once we start the API call
      setPendingUserMessage(null);

      // Try streaming if enabled and supported
      if (useStreaming && typeof EventSource !== 'undefined') {
        console.log('Attempting to use streaming API');
        setIsStreaming(true)
        setStreamingText('')

        // Set up streaming handlers
        let streamingTextContent = '';
        let collectedFlights: any = null;
        let collectedHotels: any = null;
        let collectedCitations: any[] = [];
        let streamingFailed = false;

        const onTextChunk = async (text: string) => {
          streamingTextContent = text;
          setStreamingText(text);
          // Scroll immediately on each chunk
          setTimeout(() => scrollToBottom(), 0);
        };

        const onFlights = async (flights: any) => {
          collectedFlights = flights;
        };

        const onHotels = async (hotels: any) => {
          collectedHotels = hotels;
        };

        const onCitations = async (citations: any[]) => {
          collectedCitations = citations;
        };

        const onComplete = async () => {
          setIsStreaming(false);
          setStreamingText('');
          
          const finalMessages: Message[] = [...updatedMessages];
          
          // Add the completed text message
          if (streamingTextContent) {
            finalMessages.push({
              contents: [{
                type: 'text',
                content: streamingTextContent,
                citations: collectedCitations || []
              }],
              isUser: false,
              timestamp: new Date()
            });
          }

          // Add flight data if available
          if (collectedFlights && (collectedFlights.best_flights?.length > 0 || collectedFlights.other_flights?.length > 0)) {
            const flightMessage: Message = {
              contents: [{
                type: 'flight',
                content: {
                  best_flights: collectedFlights.best_flights || [],
                  other_flights: collectedFlights.other_flights || [],
                  search_metadata: collectedFlights.search_metadata
                }
              }],
              isUser: false,
              timestamp: new Date()
            };
            finalMessages.push(flightMessage);
          }

          // Add hotel data if available
          if (collectedHotels?.properties?.length > 0) {
            const hotelMessage: Message = {
              contents: [{
                type: 'hotel',
                content: {
                  properties: collectedHotels.properties,
                  search_metadata: collectedHotels.search_metadata
                }
              }],
              isUser: false,
              timestamp: new Date()
            };
            finalMessages.push(hotelMessage);
          }

          // Final update with all collected data
          await updateCurrentSession({ 
            messages: finalMessages,
            title: generateChatTitle(finalMessages)
          });
          
          setIsLoading(false);
          // Final scroll when everything is done
          setTimeout(() => scrollToBottom(), 300);
        };

        const onError = async (error: string) => {
          console.log('Streaming error, falling back to regular API:', error);
          streamingFailed = true;
          setIsStreaming(false);
          setStreamingText('');
          
          // Don't show the error to the user, just fall back silently
          // The regular API will be attempted automatically
        };

        // Wait for the session update to complete before starting streaming
        await updatePromise;

        try {
          // Attempt streaming
          await streamingSearchAPI(
            inputText,
            messages,
            onTextChunk,
            onFlights,
            onHotels,
            onCitations,
            onComplete,
            onError
          );

          // If streaming completed successfully, we're done
          if (!streamingFailed) {
            return;
          }
        } catch (streamError) {
          console.log('Streaming failed, falling back to regular API');
          setIsStreaming(false);
          setStreamingText('');
        }
      }

      // Fallback to regular API (or if streaming is disabled)
      console.log('Using regular API');
      
      // Ensure session is updated before API call
      await updatePromise;
      
      const apiResponse = await searchAPI(inputText, messages)
      
      const newMessages: Message[] = []

      // Add text response
      if (apiResponse.response) {
        const textMessage: Message = {
          contents: [{
            type: 'text',
            content: apiResponse.response,
            citations: apiResponse.citations || []
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

      // Update session with all messages
      const finalMessages = [...updatedMessages, ...newMessages]
      await updateCurrentSession({ 
        messages: finalMessages,
        title: generateChatTitle(finalMessages)
      })

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setIsStreaming(false);
      setStreamingText('');
      setPendingUserMessage(null);
      
      const errorMessage: Message = {
        contents: [{
          type: 'text',
          content: "Sorry, I couldn't process your request at this time."
        }],
        isUser: false,
        timestamp: new Date()
      };
      await updateCurrentSession({ 
        messages: [...updatedMessages, errorMessage]
      });
    } finally {
      setIsLoading(false);
      // Final scroll when everything is done
      setTimeout(() => scrollToBottom(), 300);
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
    const isPending = message === pendingUserMessage;
    return `${message.isUser ? 'user' : 'assistant'}-${timestamp}-${index}${isPending ? '-pending' : ''}`;
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
    onScrollRequest={() => scrollToBottom()}
  />
), [memoizedSelections, memoizedHandlers, scrollToBottom]);

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

  // Add this new state for the current mode
  const [currentMode, setCurrentMode] = useState('search');

  // Handle mode changes
  const handleModeChange = (mode: string) => {
    if (mode === 'agent') {
      // Navigate to agent page
      router.push('/agent');
    } else if (mode === 'itinerary') {
      // Navigate to explore itineraries page
      router.push('/explore-itineraries');
    } else {
      // Set mode to search (default)
      setCurrentMode(mode);
      
      // Clear messages if switching back to search mode from another mode
      if (currentMode !== 'search' && mode === 'search') {
        // Create a new empty session
        createNewSession();
      }
    }
  };

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
                  {displayMessages.map((message, index) => {
                    const isPending = message === pendingUserMessage;
                    return (
                      <div
                        key={generateMessageKey(message, index)}
                        className={`${message.isUser ? 'flex justify-end' : 'w-full'} mb-4`}
                        data-message-type={message.isUser ? 'user' : 'assistant'}
                      >
                        <div
                          className={`${
                            message.isUser
                              ? `max-w-[85%] md:max-w-[75%] rounded-lg p-3 bg-blue-500 text-white ${
                                  isPending ? 'opacity-75 animate-pulse' : ''
                                }`
                              : 'w-full md:w-[85%] space-y-2 text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {message.contents.map((content, contentIndex) => 
                            renderRichContent(content, index, contentIndex, message.isUser)
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <SelectionPopover onAddSelection={handleAddTextSelection} />
                </div>
                {(isLoading || isStreaming) && (
                  <LoadingMessage 
                    isStreaming={isStreaming} 
                    streamingText={streamingText}
                  />
                )}
                <div ref={messagesEndRef} className="h-8" />
              </div>
            )}
          </main>

          {user && (
            <>
              {!isSelectionsSidebarOpen && !isFlightSearchOpen && !isHotelSearchOpen && (
                <>
                  <ModeSelector 
                    currentMode={currentMode}
                    onModeChange={handleModeChange}
                  />
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

                      {/* Streaming toggle */}
                      <button
                        onClick={() => setUseStreaming(!useStreaming)}
                        className="absolute -top-12 right-0 
                                  bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                                  text-gray-600 dark:text-gray-300 px-3 py-2 rounded-full
                                  border border-gray-300 dark:border-gray-600 shadow-sm
                                  transition-colors duration-200 text-xs font-medium flex items-center gap-2"
                        title={useStreaming ? 'Disable real-time streaming' : 'Enable real-time streaming'}
                      >
                        <div className={`w-2 h-2 rounded-full ${useStreaming ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        {useStreaming ? 'Live' : 'Standard'}
                      </button>
                      
                      <form onSubmit={handleSubmit}>
                        <div 
                          className={`flex items-end bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 pr-3 pl-4 py-2 transition-all duration-200 ${
                            currentInput.split('\n').length > 1 || currentInput.length > 50 
                              ? 'rounded-xl' // Less rounded when expanded
                              : 'rounded-full' // Fully rounded when empty/short
                          }`}
                        >
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