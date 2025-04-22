'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Calendar, Clock, Plane, Hotel, Utensils, Camera, Compass, Sun, Umbrella, Mountain, Waves, Coffee, Music, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import ModeSelector from '@/components/layout/ModeSelector'
import { useAuth } from '@/components/auth/AuthContext'

// Define the itinerary type
interface ItineraryDay {
  title: string;
  activities: {
    time?: string;
    title: string;
    description: string;
    icon: React.ReactNode;
  }[];
}

interface CuratedItinerary {
  id: string;
  title: string;
  location: string;
  duration: string;
  description: string;
  image: string;
  tags: string[];
  days: ItineraryDay[];
}

// Sample itineraries data
const CURATED_ITINERARIES: CuratedItinerary[] = [
  {
    id: 'japan-highlights',
    title: 'Japan Highlights',
    location: 'Tokyo, Kyoto, Osaka',
    duration: '7 days',
    description: 'Experience the perfect blend of ancient traditions and modern wonders in Japan.',
    image: '/images/japan.jpg',
    tags: ['Culture', 'Food', 'History'],
    days: [
      {
        title: 'Day 1: Tokyo Exploration',
        activities: [
          { time: 'Morning', title: 'Meiji Shrine', description: 'Visit the serene Meiji Shrine surrounded by a lush forest.', icon: <Sun size={16} /> },
          { time: 'Afternoon', title: 'Shibuya Crossing', description: 'Experience the famous Shibuya Crossing and surrounding shopping district.', icon: <Compass size={16} /> },
          { time: 'Evening', title: 'Tokyo Tower', description: 'Enjoy panoramic night views from Tokyo Tower.', icon: <Star size={16} /> }
        ]
      },
      {
        title: 'Day 2: Cultural Tokyo',
        activities: [
          { time: 'Morning', title: 'Asakusa & Senso-ji Temple', description: 'Explore Tokyo\'s oldest temple and traditional shopping street.', icon: <Camera size={16} /> },
          { time: 'Afternoon', title: 'Ueno Park', description: 'Visit museums and enjoy the spacious park.', icon: <Sun size={16} /> },
          { time: 'Evening', title: 'Akihabara', description: 'Discover the electronics and anime district.', icon: <Music size={16} /> }
        ]
      },
      {
        title: 'Day 3: Kyoto Arrival',
        activities: [
          { time: 'Morning', title: 'Bullet Train to Kyoto', description: 'Experience Japan\'s high-speed rail system.', icon: <Plane size={16} /> },
          { time: 'Afternoon', title: 'Kinkaku-ji (Golden Pavilion)', description: 'Visit the famous Zen Buddhist temple covered in gold leaf.', icon: <Camera size={16} /> },
          { time: 'Evening', title: 'Gion District', description: 'Stroll through the historic geisha district.', icon: <Compass size={16} /> }
        ]
      }
    ]
  },
  {
    id: 'italy-romance',
    title: 'Italian Romance',
    location: 'Rome, Florence, Venice',
    duration: '10 days',
    description: 'Fall in love with Italy\'s art, history, and cuisine in this romantic journey.',
    image: '/images/italy.jpg',
    tags: ['Romance', 'Food', 'Art'],
    days: [
      {
        title: 'Day 1: Rome - Eternal City',
        activities: [
          { time: 'Morning', title: 'Colosseum & Roman Forum', description: 'Step back in time at these ancient Roman sites.', icon: <Camera size={16} /> },
          { time: 'Afternoon', title: 'Spanish Steps & Trevi Fountain', description: 'Visit these iconic Roman landmarks.', icon: <Compass size={16} /> },
          { time: 'Evening', title: 'Trastevere Dinner', description: 'Enjoy authentic Roman cuisine in this charming district.', icon: <Utensils size={16} /> }
        ]
      },
      {
        title: 'Day 2: Vatican City',
        activities: [
          { time: 'Morning', title: 'Vatican Museums & Sistine Chapel', description: 'Marvel at Michelangelo\'s masterpiece and the museum collections.', icon: <Camera size={16} /> },
          { time: 'Afternoon', title: 'St. Peter\'s Basilica', description: 'Explore one of the world\'s largest churches.', icon: <Compass size={16} /> },
          { time: 'Evening', title: 'Piazza Navona', description: 'Dine near this beautiful baroque square.', icon: <Coffee size={16} /> }
        ]
      }
    ]
  },
  {
    id: 'tropical-thailand',
    title: 'Tropical Thailand',
    location: 'Bangkok, Chiang Mai, Phuket',
    duration: '8 days',
    description: 'Experience Thailand\'s vibrant cities, ancient temples, and paradise beaches.',
    image: '/images/thailand.jpg',
    tags: ['Beaches', 'Culture', 'Adventure'],
    days: [
      {
        title: 'Day 1: Bangkok Highlights',
        activities: [
          { time: 'Morning', title: 'Grand Palace & Wat Phra Kaew', description: 'Visit the royal palace complex and Temple of the Emerald Buddha.', icon: <Camera size={16} /> },
          { time: 'Afternoon', title: 'Wat Arun', description: 'Explore the Temple of Dawn on the Chao Phraya River.', icon: <Sun size={16} /> },
          { time: 'Evening', title: 'Khao San Road', description: 'Experience Bangkok\'s famous backpacker street.', icon: <Music size={16} /> }
        ]
      },
      {
        title: 'Day 2: Bangkok to Chiang Mai',
        activities: [
          { time: 'Morning', title: 'Flight to Chiang Mai', description: 'Short domestic flight to Northern Thailand.', icon: <Plane size={16} /> },
          { time: 'Afternoon', title: 'Old City Temples', description: 'Visit Wat Phra Singh and Wat Chedi Luang.', icon: <Compass size={16} /> },
          { time: 'Evening', title: 'Night Bazaar', description: 'Shop and eat at the famous night market.', icon: <Star size={16} /> }
        ]
      }
    ]
  },
  {
    id: 'new-york-city',
    title: 'New York City Adventure',
    location: 'Manhattan, Brooklyn',
    duration: '5 days',
    description: 'Experience the energy and diversity of the Big Apple.',
    image: '/images/nyc.jpg',
    tags: ['Urban', 'Culture', 'Food'],
    days: [
      {
        title: 'Day 1: Manhattan Classics',
        activities: [
          { time: 'Morning', title: 'Central Park', description: 'Start with a stroll through NYC\'s iconic green space.', icon: <Sun size={16} /> },
          { time: 'Afternoon', title: 'Metropolitan Museum of Art', description: 'Explore one of the world\'s greatest art collections.', icon: <Camera size={16} /> },
          { time: 'Evening', title: 'Times Square', description: 'Experience the bright lights of this famous intersection.', icon: <Star size={16} /> }
        ]
      },
      {
        title: 'Day 2: Downtown Exploration',
        activities: [
          { time: 'Morning', title: 'Statue of Liberty & Ellis Island', description: 'Take the ferry to these historic landmarks.', icon: <Compass size={16} /> },
          { time: 'Afternoon', title: 'Wall Street & 9/11 Memorial', description: 'Visit the financial district and poignant memorial.', icon: <MapPin size={16} /> },
          { time: 'Evening', title: 'Brooklyn Bridge', description: 'Walk across the iconic bridge at sunset.', icon: <Camera size={16} /> }
        ]
      }
    ]
  },
  {
    id: 'costa-rica-adventure',
    title: 'Costa Rica Adventure',
    location: 'San José, Arenal, Manuel Antonio',
    duration: '9 days',
    description: 'Discover the natural wonders and wildlife of this Central American paradise.',
    image: '/images/costa-rica.jpg',
    tags: ['Nature', 'Adventure', 'Wildlife'],
    days: [
      {
        title: 'Day 1: San José & La Paz Waterfall Gardens',
        activities: [
          { time: 'Morning', title: 'San José City Tour', description: 'Visit the National Theater and other landmarks.', icon: <Compass size={16} /> },
          { time: 'Afternoon', title: 'La Paz Waterfall Gardens', description: 'See butterflies, hummingbirds, and stunning waterfalls.', icon: <Mountain size={16} /> },
          { time: 'Evening', title: 'Traditional Costa Rican Dinner', description: 'Enjoy local cuisine in the capital.', icon: <Utensils size={16} /> }
        ]
      },
      {
        title: 'Day 2: Arenal Volcano',
        activities: [
          { time: 'Morning', title: 'Drive to Arenal', description: 'Scenic journey to the volcano region.', icon: <Mountain size={16} /> },
          { time: 'Afternoon', title: 'Hanging Bridges', description: 'Walk through the rainforest canopy.', icon: <Camera size={16} /> },
          { time: 'Evening', title: 'Hot Springs', description: 'Relax in natural volcanic hot springs.', icon: <Umbrella size={16} /> }
        ]
      }
    ]
  }
];

// Placeholder image component with fallback
const ItineraryImage = ({ src, alt }: { src: string; alt: string }) => {
  // Use a placeholder if the image doesn't exist
  const imageSrc = src.startsWith('/images') 
    ? 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    : src;
    
  return (
    <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
      <img 
        src={imageSrc}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
      />
    </div>
  );
};

// Tag component
const Tag = ({ text }: { text: string }) => (
  <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
    {text}
  </span>
);

// Itinerary card component
const ItineraryCard = ({ 
  itinerary, 
  onViewDetails 
}: { 
  itinerary: CuratedItinerary;
  onViewDetails: (itinerary: CuratedItinerary) => void;
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      <ItineraryImage src={itinerary.image} alt={itinerary.title} />
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{itinerary.title}</h3>
        </div>
        
        <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-3">
          <MapPin size={16} className="mr-1" />
          <span>{itinerary.location}</span>
          <span className="mx-2">•</span>
          <Calendar size={16} className="mr-1" />
          <span>{itinerary.duration}</span>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          {itinerary.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {itinerary.tags.map(tag => (
            <Tag key={tag} text={tag} />
          ))}
        </div>
        
        <button
          onClick={() => onViewDetails(itinerary)}
          className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline focus:outline-none"
        >
          View itinerary details
        </button>
      </div>
    </div>
  );
};

// Full itinerary details component
const ItineraryDetails = ({ 
  itinerary, 
  onBack 
}: { 
  itinerary: CuratedItinerary;
  onBack: () => void;
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="relative w-full h-64 md:h-80">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10" />
        <img 
          src={itinerary.image.startsWith('/images') 
            ? 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
            : itinerary.image}
          alt={itinerary.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
          <button 
            onClick={onBack}
            className="mb-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">{itinerary.title}</h1>
          <div className="flex items-center text-white/90 text-sm mb-3">
            <MapPin size={16} className="mr-1" />
            <span>{itinerary.location}</span>
            <span className="mx-2">•</span>
            <Calendar size={16} className="mr-1" />
            <span>{itinerary.duration}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {itinerary.tags.map(tag => (
              <span key={tag} className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Overview</h2>
          <p className="text-gray-600 dark:text-gray-400">{itinerary.description}</p>
        </div>
        
        <div className="space-y-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Daily Itinerary</h2>
          
          {/* Generate all days based on the duration */}
          {Array.from({ length: parseInt(itinerary.duration.split(' ')[0]) }, (_, i) => {
            // Use existing day data if available, otherwise generate placeholder data
            const existingDay = itinerary.days[i];
            
            if (existingDay) {
              return (
                <div key={i} className="border-l-2 border-blue-500 pl-4 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Day {i + 1}: {existingDay.title.replace(/^Day \d+:\s*/, '')}
                  </h3>
                  
                  <div className="space-y-6">
                    {existingDay.activities.map((activity, actIndex) => (
                      <div key={actIndex} className="flex">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-4 h-fit">
                          {activity.icon}
                        </div>
                        <div>
                          <div className="flex items-center mb-1">
                            {activity.time && (
                              <span className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded mr-2">
                                {activity.time}
                              </span>
                            )}
                            <h4 className="font-medium text-gray-900 dark:text-white text-lg">
                              {activity.title}
                            </h4>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            } else {
              // Generate placeholder content for missing days
              const icons = [<Sun size={16} />, <Camera size={16} />, <Utensils size={16} />, <Compass size={16} />];
              const times = ['Morning', 'Afternoon', 'Evening'];
              
              // Generate day title based on itinerary
              let dayTitle = '';
              if (itinerary.id === 'japan-highlights') {
                const locations = ['Tokyo', 'Kyoto', 'Osaka', 'Hiroshima', 'Nara', 'Hakone', 'Tokyo'];
                dayTitle = locations[Math.min(i, locations.length - 1)];
              } else if (itinerary.id === 'italy-romance') {
                const locations = ['Rome', 'Vatican City', 'Florence', 'Tuscany', 'Venice', 'Amalfi Coast', 'Cinque Terre', 'Milan', 'Lake Como', 'Rome'];
                dayTitle = locations[Math.min(i, locations.length - 1)];
              } else if (itinerary.id === 'tropical-thailand') {
                const locations = ['Bangkok', 'Chiang Mai', 'Chiang Rai', 'Phuket', 'Phi Phi Islands', 'Krabi', 'Koh Samui', 'Bangkok'];
                dayTitle = locations[Math.min(i, locations.length - 1)];
              } else if (itinerary.id === 'new-york-city') {
                const locations = ['Manhattan', 'Downtown', 'Midtown', 'Upper East Side', 'Brooklyn'];
                dayTitle = locations[Math.min(i, locations.length - 1)];
              } else if (itinerary.id === 'costa-rica-adventure') {
                const locations = ['San José', 'Arenal', 'Monteverde', 'Manuel Antonio', 'Tortuguero', 'Puerto Viejo', 'Tamarindo', 'Montezuma', 'San José'];
                dayTitle = locations[Math.min(i, locations.length - 1)];
              }
              
              return (
                <div key={i} className="border-l-2 border-blue-500 pl-4 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Day {i + 1}: {dayTitle} Exploration
                  </h3>
                  
                  <div className="space-y-6">
                    {times.map((time, timeIndex) => (
                      <div key={timeIndex} className="flex">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-4 h-fit">
                          {icons[timeIndex % icons.length]}
                        </div>
                        <div>
                          <div className="flex items-center mb-1">
                            <span className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded mr-2">
                              {time}
                            </span>
                            <h4 className="font-medium text-gray-900 dark:text-white text-lg">
                              {time === 'Morning' ? `${dayTitle} Sightseeing` : 
                               time === 'Afternoon' ? 'Local Experience' : 
                               'Authentic Dining'}
                            </h4>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">
                            {time === 'Morning' ? `Explore the highlights of ${dayTitle} with a guided tour of the main attractions.` : 
                             time === 'Afternoon' ? 'Immerse yourself in the local culture with authentic experiences and activities.' : 
                             'Enjoy the local cuisine at a recommended restaurant with authentic dishes.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
};

export default function ExploreItinerariesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedItinerary, setSelectedItinerary] = useState<CuratedItinerary | null>(null);
  
  const handleViewDetails = (itinerary: CuratedItinerary) => {
    setSelectedItinerary(itinerary);
    window.scrollTo(0, 0);
  };
  
  const handleBack = () => {
    setSelectedItinerary(null);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      {!selectedItinerary ? (
        <>
          <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-16 z-10">
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.push('/')}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Explore Curated Itineraries</h1>
              </div>
            </div>
          </header>
          
          <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
              <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
                Browse our collection of expertly crafted travel itineraries. Find inspiration for your next adventure or use one as a template for your own trip.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CURATED_ITINERARIES.map(itinerary => (
                <ItineraryCard 
                  key={itinerary.id} 
                  itinerary={itinerary} 
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          </main>
        </>
      ) : (
        <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <ItineraryDetails 
            itinerary={selectedItinerary} 
            onBack={handleBack} 
          />
        </main>
      )}
      
      {user && <ModeSelector currentMode="itinerary" />}
    </div>
  );
} 