'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, ArrowLeft, Edit, Check, X, Search, UserRound, FileText } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { saveItinerary } from '@/lib/firebase/itineraries'
import LoadingMessage from '@/components/layout/LoadingMessage'
import HighlightedText from '@/components/layout/HighlightedText'

const WelcomeScreen = () => {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-144px)] space-y-4 group">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 text-center">
        Connect with a <HighlightedText>travel agent</HighlightedText> directly.
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-400 max-w-md">
        Describe your travel plans, ask questions, or request assistance. 
        A travel agent will review your message and get back to you soon.
      </p>
    </div>
  );
};

const SuccessMessage = ({ messageId }: { messageId: string }) => {
  const router = useRouter();
  
  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mt-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Message Sent!</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Your message has been saved to your itineraries. One of our travel agents will review it and get back to you soon!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <button
            onClick={() => router.push('/my-itineraries')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View My Itineraries
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
};

// New component for message preview
const MessagePreview = ({ 
  message, 
  onEdit, 
  onSend, 
  onCancel 
}: { 
  message: string, 
  onEdit: () => void, 
  onSend: () => void, 
  onCancel: () => void 
}) => {
  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Review Your Message</h2>
        <button 
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
        <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{message}</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <button
          onClick={onEdit}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
        >
          <Edit size={16} />
          Edit Message
        </button>
        <button
          onClick={onSend}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
        >
          <Send size={16} />
          Send to Agent
        </button>
      </div>
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

// Update the ModeSelector component to include a tooltip
const ModeSelector: React.FC<{
  currentMode: string;
}> = ({ currentMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  
  const modes = [
    { id: 'search', label: 'Search', description: "Find flights, hotels, and activities" },
    { id: 'agent', label: 'Travel Agent', description: "Get personalized travel recommendations" },
    { id: 'itinerary', label: 'Explore Itineraries', description: "Browse curated travel plans" }
  ];
  
  // Get current mode label for the tooltip
  const currentModeLabel = modes.find(m => m.id === currentMode)?.label || 'Mode';
  
  const handleModeChange = (mode: string) => {
    if (mode === 'search') {
      router.push('/');
    } else if (mode === 'itinerary') {
      router.push('/explore-itineraries');
    } else if (mode === 'agent') {
      router.push('/agent');
    }
  };
  
  return (
    <>
      <div className="fixed bottom-24 right-6 z-50">
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
                    handleModeChange(mode.id);
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

export default function AgentPage() {
  const [currentInput, setCurrentInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessageId, setSuccessMessageId] = useState<string | null>(null)
  const [previewMessage, setPreviewMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { user } = useAuth()
  const router = useRouter()

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!currentInput.trim() || isLoading) return;
    if (!user) {
      router.push('/');
      return;
    }
    
    // Set the preview message instead of sending immediately
    setPreviewMessage(currentInput.trim());
  };
  
  const handleSendToAgent = async () => {
    if (!previewMessage || !user) return;
    
    setIsLoading(true);
    
    try {
      // Create a unique ID for this message
      const messageId = uuidv4();
      
      // Create an activity selection from the user's message
      const activitySelection = {
        id: uuidv4(),
        type: 'activity' as const,
        data: {
          description: 'Travel Agent Request',
          notes: previewMessage,
          addedAt: new Date()
        },
        addedAt: new Date()
      };
      
      // Save to itineraries with a special tag for agent requests
      await saveItinerary(
        user.uid,
        `Agent Request - ${new Date().toLocaleDateString()}`,
        'This request was sent directly to a travel agent.',
        [activitySelection],
        {}
      );
      
      // Show success message
      setSuccessMessageId(messageId);
      setCurrentInput('');
      setPreviewMessage(null);
      
    } catch (error) {
      console.error('Error sending message to agent:', error);
      alert('There was an error sending your message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditMessage = () => {
    // Return to editing mode with the current message
    if (previewMessage) {
      setCurrentInput(previewMessage);
      setPreviewMessage(null);
    }
  };
  
  const handleCancelPreview = () => {
    // Cancel the preview without clearing the input
    setPreviewMessage(null);
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 relative">
      <div className="flex h-[calc(100vh-64px)] pt-16">
        <div className="flex-1 relative">
          <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-16 z-10">
            <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.push('/')}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Travel Agent</h1>
              </div>
            </div>
          </header>
          
          <main className="h-full pb-24 overflow-y-auto scrollbar-gutter-stable">
            {!user ? (
              <WelcomeScreen />
            ) : successMessageId ? (
              <SuccessMessage messageId={successMessageId} />
            ) : previewMessage ? (
              <MessagePreview 
                message={previewMessage}
                onEdit={handleEditMessage}
                onSend={handleSendToAgent}
                onCancel={handleCancelPreview}
              />
            ) : (
              <div className="max-w-2xl mx-auto space-y-6 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">How can we help with your travel plans?</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    This will send a message directly to one of our real travel agents.
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Describe your ideal trip, ask specific questions, or request assistance, and we will get back to you with curated responses. 
                  </p>

                </div>
                {isLoading && <LoadingMessage />}
              </div>
            )}
          </main>

          {user && !successMessageId && !previewMessage && (
            <ModeSelector currentMode="agent" />
          )}

          {user && !successMessageId && !previewMessage && (
            <footer className="fixed bottom-0 border-t border-gray-200 dark:border-gray-700 
              bg-white dark:bg-gray-800 p-4 transition-all duration-200 ease-in-out w-full
              right-0 left-0">
              <div className="max-w-2xl mx-auto relative">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
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
                        if (lines.length > 12 && e.target.value.length > currentInput.length) {
                          return;
                        }
                        textarea.style.height = 'inherit';
                        const newHeight = Math.min(textarea.scrollHeight, 24 * 12);
                        textarea.style.height = `${newHeight}px`;
                        setCurrentInput(textarea.value);
                      }}
                      onKeyDown={handleKeyPress}
                      autoFocus
                      rows={1}
                      className="flex-1 resize-none bg-transparent border-0 focus:ring-0 outline-none
                              dark:text-white min-h-[24px] py-0 overflow-y-auto scrollbar-none"
                      style={{
                        maxHeight: '288px'
                      }}
                      placeholder="Describe your travel plans or ask a question..."
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
              </div>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
} 