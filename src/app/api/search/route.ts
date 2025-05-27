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

// Streaming endpoint
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get('prompt');
  const historyParam = searchParams.get('history');
  const flightParams = searchParams.get('flightParams');
  const hotelParams = searchParams.get('hotelParams');
  const isDirectFlightSearch = searchParams.get('isDirectFlightSearch') === 'true';

  if (!prompt) {
    return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
  }

  try {
    const history = historyParam ? JSON.parse(historyParam) : [];
    const chatHistory = formatChatHistory(history);
    
    const payload = {
      context: chatHistory ? 
        `Previous conversation:\n${chatHistory}\n\nBe accurate and straightforward. When referencing previous information, explicitly mention the message number (e.g., "As mentioned in Message #2...").` : 
        "Be accurate and straightforward.",
      prompt: prompt,
      flightParams: flightParams ? JSON.parse(flightParams) : undefined,
      hotelParams: hotelParams ? JSON.parse(hotelParams) : undefined,
      isDirectFlightSearch: isDirectFlightSearch
    };

    const apiKey = process.env.API_GATEWAY_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Send initial event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', message: 'Starting search...' })}\n\n`));

          // Make the API call
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey 
            },
            body: JSON.stringify({ body: JSON.stringify(payload) })
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const responseBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
          
          // Stream the text response word by word
          if (responseBody.response) {
            const words = responseBody.response.split(' ');
            let currentText = '';
            
            for (let i = 0; i < words.length; i++) {
              currentText += (i > 0 ? ' ' : '') + words[i];
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'text_chunk',
                content: currentText,
                isComplete: i === words.length - 1
              })}\n\n`));
              
              // Add a small delay to simulate real-time streaming
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }

          // Send flight data if available
          if (responseBody.flights) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'flights',
              content: responseBody.flights
            })}\n\n`));
          }

          // Send hotel data if available
          if (responseBody.hotels) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'hotels',
              content: responseBody.hotels
            })}\n\n`));
          }

          // Send citations if available
          if (responseBody.citations?.length > 0) {
            const citations = Array.isArray(responseBody.citations)
              ? responseBody.citations.map((citation: string) => ({ url: citation }))
              : [];
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'citations',
              content: citations
            })}\n\n`));
          }

          // Send completion event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));

        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
          })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Stream setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup stream' },
      { status: 500 }
    );
  }
}

// Keep the original POST endpoint for backwards compatibility
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prompt, history = [], flightParams, hotelParams, isDirectFlightSearch } = body

    console.log("API Route - Request payload:", { 
      prompt, 
      historyLength: history.length,
      flightParams,
      hotelParams,
      isDirectFlightSearch
    });

    // Format the history with enhanced context
    const chatHistory = formatChatHistory(history)
    
    // Prepare the payload for the external API with specific instructions
    const payload = {
      context: chatHistory ? 
        `Previous conversation:\n${chatHistory}\n\nBe accurate and straightforward. When referencing previous information, explicitly mention the message number (e.g., "As mentioned in Message #2...").` : 
        "Be accurate and straightforward.",
      prompt: prompt,
      flightParams: flightParams,
      hotelParams: hotelParams,
      isDirectFlightSearch: isDirectFlightSearch
    }

    // Get API key from environment variable
    const apiKey = process.env.API_GATEWAY_KEY;

    // Check if API key exists
    if (!apiKey) {
      console.error('API key is missing');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    console.log("API Route - Sending request to Lambda");
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey 
      },
      body: JSON.stringify({ body: JSON.stringify(payload) })
    });

    if (!response.ok) {
      console.error(`API Route - HTTP error: ${response.status}`);
      const errorText = await response.text();
      console.error(`API Route - Error response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log("API Route - Lambda response:", data);
    
    try {
      const responseBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
      console.log("API Route - Parsed response body:", responseBody);
      
      // Prepare citations
      const citations = Array.isArray(responseBody.citations)
        ? responseBody.citations.map((citation: string) => ({ url: citation }))
        : [];

      // Check if we have flight data
      if (responseBody.flights) {
        console.log("API Route - Flight data found in response");
      }

      // Prepare the modelMessage matching the expected frontend structure
      const result = {
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
      };
      
      console.log("API Route - Final response structure:", {
        contentLength: result.contents[0].content.length,
        hasFlights: !!result.contents[0].flights,
        hasHotels: !!result.contents[0].hotels
      });
      
      return NextResponse.json(result);
    } catch (e) {
      console.error('API Route - Error parsing body:', e);
      throw new Error('Failed to parse API response');
    }
  } catch (error) {
    console.error('API Route - Error:', error);
    
    // Return a more detailed error response
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : String(error),
        contents: [{
          content: "I'm sorry, but I encountered an error while processing your search request. Please try again with different parameters.",
          type: 'text'
        }],
        isUser: false,
        timestamp: new Date()
      },
      { status: 500 }
    );
  }
}