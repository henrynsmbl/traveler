import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LoadingMessageProps {
  isStreaming?: boolean;
  streamingText?: string;
}

const LoadingMessage: React.FC<LoadingMessageProps> = ({ 
  isStreaming = false, 
  streamingText = '' 
}) => {
  const [dots, setDots] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);

  const loadingMessages = [
    "Searching for the best options...",
    "Analyzing travel data...",
    "Finding personalized recommendations...",
    "Gathering the latest information..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isStreaming) {
      const messageInterval = setInterval(() => {
        setMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 2000);

      return () => clearInterval(messageInterval);
    }
  }, [isStreaming, loadingMessages.length]);

  if (isStreaming && streamingText) {
    return (
      <div className="w-full md:w-[85%] space-y-2 text-gray-900 dark:text-gray-100">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                AI is responding...
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {streamingText}
                </ReactMarkdown>
                <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-[85%] space-y-2 text-gray-900 dark:text-gray-100">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {loadingMessages[messageIndex]}{dots}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingMessage;