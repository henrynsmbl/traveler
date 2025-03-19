// utils/chat.ts
import type { Message, MessageContent } from '@/types/messages';

interface TableData {
  headers: string[];
  rows: any[][];
}

interface FlightContent {
  flightNumber: string;
}

interface HotelContent {
  hotelName: string;
}

// Type guard functions
const isTableData = (content: any): content is TableData => {
  return content && Array.isArray(content.headers) && Array.isArray(content.rows);
};

const isFlightContent = (content: any): content is FlightContent => {
  return content && typeof content.flightNumber === 'string';
};

const isHotelContent = (content: any): content is HotelContent => {
  return content && typeof content.hotelName === 'string';
};

const getTextFromContent = (content: MessageContent): string => {
  // If content is directly a string
  if (typeof content.content === 'string') {
    return content.content;
  }
  
  // Handle structured content types
  const structuredContent = content.content;
  
  // Handle table data
  if (isTableData(structuredContent)) {
    return 'Table: ' + structuredContent.headers.join(', ');
  }
  
  // Handle flight content
  if (isFlightContent(structuredContent)) {
    return `Flight ${structuredContent.flightNumber}`;
  }
  
  // Handle hotel content
  if (isHotelContent(structuredContent)) {
    return structuredContent.hotelName;
  }
  
  return 'New Chat';
};

export const generateChatTitle = (messages: Message[]): string => {
  if (messages.length === 0) return 'New Chat';
  
  // Find first user message
  const firstUserMessage = messages.find(m => m.isUser);
  if (!firstUserMessage?.contents[0]) return 'New Chat';
  
  // Get text representation of the content
  const text = getTextFromContent(firstUserMessage.contents[0]);
  
  // Take first 30 characters
  const title = text.slice(0, 30).trim();
  
  // Add ellipsis if truncated
  return title.length < text.length ? `${title}...` : title;
};