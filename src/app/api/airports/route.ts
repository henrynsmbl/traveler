import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the Airport interface here for the server component
interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
}

export async function GET(request: Request) {
  try {
    // Get query parameter for search
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    
    // Parse the airports file
    const filePath = path.join(process.cwd(), 'src/components/flight/airports.txt');
    const text = fs.readFileSync(filePath, 'utf8');
    
    const airports: Airport[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Split the CSV line, handling commas within quotes
      const parts = line.split(',');
      if (parts.length < 6) continue;
      
      // Extract the relevant fields
      const name = parts[1].replace(/"/g, '');
      const city = parts[2].replace(/"/g, '');
      const country = parts[3].replace(/"/g, '');
      const iata = parts[4].replace(/"/g, '');
      
      // Only include entries with valid IATA codes (3 letters)
      if (iata && iata.length === 3) {
        airports.push({
          code: iata,
          name,
          city,
          country
        });
      }
    }
    
    // Filter airports based on the query
    let filteredAirports: Airport[] = airports;
    
    if (query) {
      // First, find exact code matches
      const exactCodeMatches = airports.filter(airport => 
        airport.code.toLowerCase() === query
      );
      
      // Then find codes that start with the query
      const codeStartsWithMatches = airports.filter(airport => 
        airport.code.toLowerCase().startsWith(query) && 
        airport.code.toLowerCase() !== query
      );
      
      // Then find city matches
      const cityMatches = airports.filter(airport => 
        airport.city.toLowerCase().includes(query) && 
        !airport.code.toLowerCase().startsWith(query)
      );
      
      // Then find any other matches (name, country)
      const otherMatches = airports.filter(airport => 
        !airport.code.toLowerCase().startsWith(query) && 
        !airport.city.toLowerCase().includes(query) &&
        (airport.name.toLowerCase().includes(query) || 
         airport.country.toLowerCase().includes(query))
      );
      
      // Combine all matches in priority order
      filteredAirports = [
        ...exactCodeMatches,
        ...codeStartsWithMatches,
        ...cityMatches,
        ...otherMatches
      ].slice(0, 10); // Limit to 10 results
    } else {
      // Return just a few major airports if no query
      filteredAirports = airports.slice(0, 20);
    }
    
    return NextResponse.json(filteredAirports);
  } catch (error) {
    console.error('Error loading airports:', error);
    return NextResponse.json({ error: 'Failed to load airports' }, { status: 500 });
  }
} 