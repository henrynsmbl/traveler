import { NextResponse } from 'next/server'

// Use environment variable for API URL
const API_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "https://8uz1zshh6c.execute-api.us-east-2.amazonaws.com/dev/search"

// Helper function to format chat history with enhanced context tracking
function formatChatHistory(history: any[]): string {
  if (!history?.length) return '';
  
  // Take last 5 messages, with most recent messages having higher weight
  const recentHistory = history.slice(-5);
  
  // Process messages with reference tracking
  const processedMessages = recentHistory.map((msg, index) => {
    // Extract content, handling both direct content and array of contents
    let messageContent = '';
    if (msg.contents && Array.isArray(msg.contents)) {
      messageContent = msg.contents
        .filter((content: any) => !content.type || content.type === 'text')
        .map((content: any) => content.content || '')
        .join('\n');
    } else {
      messageContent = msg.content || '';
    }

    // Process the content based on whether it's a user or assistant message
    if (!msg.isUser) {
      // Split content into lines and process each line for assistant messages
      const lines = messageContent.split('\n');
      const processedLines = lines.map((line, i) => {
        // Check for list items (lines starting with - or • or *)
        if (line.trim().match(/^[-•*]/)) {
          return line.replace(/^[-•*]\s*/, `[Item ${i + 1}] `);
        }
        return line;
      });
      messageContent = processedLines.join('\n');
    }

    return {
      text: `${msg.isUser ? 'User' : 'Assistant'} (Message #${index + 1}): ${messageContent}`,
      messageIndex: index + 1,
      weight: (index + 1) / recentHistory.length // Weight based on recency
    };
  }).reverse(); // Reverse to get chronological order
  
  // Build the context string with message numbers
  const contextString = processedMessages
    .map(msg => msg.text)
    .join('\n\n');

  // Format as expected by the Lambda function with enhanced instructions
  return `Previous conversation with numbered references:
${contextString}

Note: Messages are numbered chronologically (1 being oldest, 5 being most recent). 
List items within assistant responses are marked with [Item X].
Higher relevance scores indicate more recent messages.
When referring to previous information, please use the specific message number or item number.
If a budget is specified, consider it for the entire trip including activities.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prompt, history = [] } = body

    // Format the history with enhanced context
    const chatHistory = formatChatHistory(history)
    
    // Prepare the payload for the external API with specific instructions
    const payload = {
      context: chatHistory ? 
        `Previous conversation:\n${chatHistory}\n\nBe accurate and straightforward. When referencing previous information, explicitly mention the message number (e.g., "As mentioned in Message #2...").` : 
        "Be accurate and straightforward.",
      prompt: prompt
    }

    // Get API key from environment variable
    const apiKey = process.env.API_GATEWAY_KEY || "";

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey, // Add API key for authorization
      },
      body: JSON.stringify({ body: JSON.stringify(payload) })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    try {
      const responseBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body
      
      // Prepare citations
      const citations = Array.isArray(responseBody.citations)
        ? responseBody.citations.map((citation: string) => ({ url: citation }))
        : []

      // Prepare the modelMessage matching the expected frontend structure
      return NextResponse.json({
        contents: [{
          content: responseBody.response || "",
          citations: citations,
          budget: responseBody.budget || "",
          flights: responseBody.flights || null,
          hotels: responseBody.hotels || null,
          activities: responseBody.activities || null
        }],
        isUser: false,
        timestamp: new Date()
      })
    } catch (e) {
      console.error('API Route - Error parsing body:', e)
      throw new Error('Failed to parse API response')
    }
  } catch (error) {
    console.error('API Route - Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}