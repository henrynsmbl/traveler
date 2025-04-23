'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Trash2, Edit, Eye, Search, BookOpen, ChevronRight, Plane, Hotel, Bookmark } from 'lucide-react';
import { getItineraries, deleteItinerary, SavedItinerary } from '@/lib/firebase/itineraries';
import Link from 'next/link';
import type { Selection, FlightSelection, HotelSelection, ActivitySelection } from '@/types/selections';

export default function MyItinerariesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [itineraries, setItineraries] = useState<SavedItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItinerary, setSelectedItinerary] = useState<SavedItinerary | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchItineraries = async () => {
      if (!user?.uid) {
        router.push('/');
        return;
      }

      try {
        setLoading(true);
        const fetchedItineraries = await getItineraries(user.uid);
        setItineraries(fetchedItineraries);
        
        // Select the first itinerary by default if available
        if (fetchedItineraries.length > 0 && !selectedItinerary) {
          setSelectedItinerary(fetchedItineraries[0]);
        }
      } catch (error) {
        console.error('Error fetching itineraries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItineraries();
  }, [user, router, selectedItinerary]);

  const handleDeleteItinerary = async (itineraryId: string) => {
    try {
      setDeleteLoading(true);
      await deleteItinerary(itineraryId);
      
      // If the deleted itinerary was selected, clear the selection
      if (selectedItinerary?.id === itineraryId) {
        setSelectedItinerary(null);
      }
      
      setItineraries(itineraries.filter(itinerary => itinerary.id !== itineraryId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting itinerary:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewItinerary = (itinerary: SavedItinerary) => {
    setSelectedItinerary(itinerary);
  };

  const filteredItineraries = itineraries.filter(itinerary => 
    itinerary.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (itinerary.description && itinerary.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (itineraries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        {/* Header - Adjust positioning to account for navbar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-16 z-10">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Saved Itineraries</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-4">No Saved Itineraries</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't saved any itineraries yet. Plan a trip and save your itinerary to see it here.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Planning
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      {/* Header - Adjust positioning to account for navbar */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Saved Itineraries</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {sidebarOpen ? <ChevronRight size={20} /> : <BookOpen size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main content with sidebar - Add pt-6 for spacing from header */}
      <div className="max-w-7xl mx-auto px-4 py-8 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className={`md:w-80 flex-shrink-0 ${sidebarOpen ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search itineraries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[calc(100vh-250px)] overflow-y-auto">
                  {filteredItineraries.map((itinerary) => (
                    <li key={itinerary.id}>
                      <button
                        onClick={() => handleViewItinerary(itinerary)}
                        className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedItinerary?.id === itinerary.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">{itinerary.name}</h3>
                        {itinerary.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {itinerary.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar size={12} />
                          <span>{format(itinerary.createdAt, 'MMM d, yyyy')}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => router.push('/')}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  Create New Itinerary
                </button>
              </div>
            </div>
          </aside>

          {/* Main content area */}
          <div className="flex-grow">
            {selectedItinerary ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedItinerary.name}</h2>
                    {selectedItinerary.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedItinerary.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/itinerary/${selectedItinerary.id}`}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                      title="View full itinerary"
                    >
                      <Eye size={20} />
                    </Link>
                    {deleteConfirm === selectedItinerary.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:underline px-2 py-1"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteItinerary(selectedItinerary.id)}
                          disabled={deleteLoading}
                          className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full disabled:opacity-50"
                        >
                          {deleteLoading ? (
                            <div className="animate-spin h-5 w-5 border border-red-600 dark:border-red-400 border-t-transparent rounded-full"></div>
                          ) : (
                            <Trash2 size={20} />
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(selectedItinerary.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                        title="Delete itinerary"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Itinerary Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Flights</h3>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedItinerary.selections.filter(s => s.type === 'flight').length}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Hotels</h3>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedItinerary.selections.filter(s => s.type === 'hotel').length}
                      </p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Activities</h3>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {selectedItinerary.selections.filter(s => s.type === 'activity').length}
                      </p>
                    </div>
                  </div>
                  
                  {/* Preview of itinerary items */}
                  <div className="space-y-4">
                    {selectedItinerary.selections.length === 0 ? (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        This itinerary is empty. View the full page to add items.
                      </p>
                    ) : (
                      <>
                        {selectedItinerary.selections.slice(0, 3).map((selection) => (
                          <div 
                            key={selection.id}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {selection.type === 'flight' && <Plane className="h-4 w-4 text-blue-500" />}
                              {selection.type === 'hotel' && <Hotel className="h-4 w-4 text-green-500" />}
                              {selection.type === 'activity' && <Bookmark className="h-4 w-4 text-amber-500" />}
                              <span className="capitalize text-sm font-medium">{selection.type}</span>
                            </div>
                            
                            {selection.type === 'flight' && (
                              <p className="text-gray-700 dark:text-gray-300">
                                {(selection as FlightSelection).data.flights[0].departure_airport.id} → {(selection as FlightSelection).data.flights[0].arrival_airport.id}
                              </p>
                            )}
                            
                            {selection.type === 'hotel' && (
                              <p className="text-gray-700 dark:text-gray-300">
                                {(selection as HotelSelection).data.name}
                              </p>
                            )}
                            
                            {selection.type === 'activity' && (
                              <p className="text-gray-700 dark:text-gray-300">
                                {(selection as ActivitySelection).data.description}
                              </p>
                            )}
                          </div>
                        ))}
                        
                        {selectedItinerary.selections.length > 3 && (
                          <div className="text-center mt-4">
                            <Link
                              href={`/itinerary/${selectedItinerary.id}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View {selectedItinerary.selections.length - 3} more items →
                            </Link>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  <div className="mt-6 flex justify-center">
                    <Link
                      href={`/itinerary/${selectedItinerary.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Full Itinerary
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                <h2 className="text-xl font-semibold mb-4">Select an Itinerary</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Choose an itinerary from the sidebar to view its details.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 