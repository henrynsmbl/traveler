'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Clock, MessageSquare, Send, CheckCircle, AlertCircle, HelpCircle, XCircle, Plane, Hotel, Bookmark } from 'lucide-react';
import { getBooking, Booking, BookingStatus, updateBookingStatus, addBookingComment } from '@/lib/firebase/bookings';
import Link from 'next/link';
import type { FlightSelection, HotelSelection, ActivitySelection } from '@/types/selections';
import { ADMIN_EMAILS } from '@/lib/constants';
import { formatDate, formatDuration } from '@/lib/utils';
import { useAdmin } from '@/hooks/useAdmin';
import { RequireAdmin } from '@/components/auth/RequireAdmin';

// This is a simplified admin check - in a real app, you'd use proper role-based auth

const getStatusDetails = (status: BookingStatus) => {
  switch (status) {
    case 'pending_review':
      return {
        label: 'Pending Agent Review',
        description: 'This booking is waiting for your review.',
        icon: <Clock className="h-6 w-6 text-amber-500" />,
        color: 'text-amber-500',
        bgColor: 'bg-amber-100 dark:bg-amber-900/20'
      };
    case 'agent_reviewing':
      return {
        label: 'Agent Reviewing',
        description: 'You are currently reviewing this booking.',
        icon: <CheckCircle className="h-6 w-6 text-blue-500" />,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20'
      };
    case 'questions_pending':
      return {
        label: 'Questions Pending',
        description: 'You have asked questions that are waiting for customer response.',
        icon: <HelpCircle className="h-6 w-6 text-purple-500" />,
        color: 'text-purple-500',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20'
      };
    case 'confirmed':
      return {
        label: 'Booking Confirmed',
        description: 'This booking has been confirmed.',
        icon: <CheckCircle className="h-6 w-6 text-green-500" />,
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/20'
      };
    case 'completed':
      return {
        label: 'Booking Completed',
        description: 'This booking has been completed.',
        icon: <CheckCircle className="h-6 w-6 text-green-500" />,
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/20'
      };
    case 'cancelled':
      return {
        label: 'Booking Cancelled',
        description: 'This booking has been cancelled.',
        icon: <XCircle className="h-6 w-6 text-red-500" />,
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/20'
      };
    default:
      return {
        label: 'Unknown Status',
        description: 'The status of this booking is unknown.',
        icon: <AlertCircle className="h-6 w-6 text-gray-500" />,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-800'
      };
  }
};

export default function AdminBookingDetailPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const { isAdmin, loading: adminLoading } = useAdmin();
  
  // Unwrap params if it's a Promise
  const bookingId = params instanceof Promise ? React.use(params).id : params.id;

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      router.push('/');
    }
  }, [isAdmin, adminLoading, user, router]);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!isAdmin) return;

      try {
        setLoading(true);
        const fetchedBooking = await getBooking(bookingId);
        
        if (!fetchedBooking) {
          setError('Booking not found');
          return;
        }
        
        setBooking(fetchedBooking);
      } catch (error) {
        console.error('Error fetching booking:', error);
        setError('Failed to load booking');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchBooking();
    }
  }, [bookingId, isAdmin]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !booking || !newComment.trim()) {
      return;
    }
    
    try {
      setIsSubmittingComment(true);
      
      await addBookingComment(
        booking.id,
        user.uid,
        user.displayName || 'Travel Agent',
        true, // is an agent
        newComment.trim()
      );
      
      // Refresh booking data to get the new comment
      const updatedBooking = await getBooking(booking.id);
      if (updatedBooking) {
        setBooking(updatedBooking);
      }
      
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: BookingStatus) => {
    if (!booking) return;
    
    try {
      setIsChangingStatus(true);
      await updateBookingStatus(booking.id, newStatus);
      
      // Refresh booking data
      const updatedBooking = await getBooking(booking.id);
      if (updatedBooking) {
        setBooking(updatedBooking);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsChangingStatus(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">You do not have permission to access this page.</p>
        <button 
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Failed to load booking'}</p>
        <button 
          onClick={() => router.push('/admin/bookings')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Bookings
        </button>
      </div>
    );
  }

  const statusDetails = getStatusDetails(booking.status);
  
  // Group selections by type
  const flightSelections = booking.selections.filter(s => s.type === 'flight') as FlightSelection[];
  const hotelSelections = booking.selections.filter(s => s.type === 'hotel') as HotelSelection[];
  const activitySelections = booking.selections.filter(s => s.type === 'activity') as ActivitySelection[];

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-16 z-10">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.push('/admin/bookings')}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Booking: {booking.itineraryName}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Created on {format(booking.createdAt, 'MMMM d, yyyy')} by {booking.userName}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={booking.status}
                  onChange={(e) => handleStatusChange(e.target.value as BookingStatus)}
                  disabled={isChangingStatus}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="pending_review">Pending Review</option>
                  <option value="agent_reviewing">Agent Reviewing</option>
                  <option value="questions_pending">Questions Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Column */}
            <section className="lg:col-span-2 space-y-6">
              {/* Status Section */}
              <div className={`p-6 rounded-xl shadow-sm ${statusDetails.bgColor}`}>
                <div className="flex items-center gap-4">
                  {statusDetails.icon}
                  <div>
                    <h2 className={`text-xl font-semibold ${statusDetails.color}`}>
                      {statusDetails.label}
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300">
                      {statusDetails.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold">Customer Information</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h3>
                      <p className="mt-1 text-gray-900 dark:text-white">{booking.userName}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
                      <p className="mt-1 text-gray-900 dark:text-white">{booking.userEmail}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Booking ID</h3>
                      <p className="mt-1 text-gray-900 dark:text-white font-mono">{booking.id}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Price</h3>
                      <p className="mt-1 text-gray-900 dark:text-white">${booking.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itinerary Details */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold">Itinerary Details</h2>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {/* Flights */}
                  {flightSelections.length > 0 && (
                    <div className="p-6">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Plane className="h-5 w-5 text-blue-500" />
                        Flights
                      </h3>
                      <div className="space-y-4">
                        {flightSelections.map((flight) => (
                          <div key={flight.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">
                                  {flight.data.flights[0].departure_airport.id} → {flight.data.flights[0].arrival_airport.id}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatDate(flight.data.flights[0].departure_airport.time)}
                                </p>
                              </div>
                              <p className="text-green-600 dark:text-green-400 font-medium">
                                ${flight.data.price.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <p>Airline: {flight.data.flights[0].airline.name}</p>
                              <p>Duration: {formatDuration(flight.data.flights[0].duration)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Hotels */}
                  {hotelSelections.length > 0 && (
                    <div className="p-6">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Hotel className="h-5 w-5 text-green-500" />
                        Hotels
                      </h3>
                      <div className="space-y-4">
                        {hotelSelections.map((hotel) => {
                          const dates = booking.hotelDates[hotel.id];
                          const nights = dates?.from && dates?.to 
                            ? Math.ceil((dates.to.getTime() - dates.from.getTime()) / (1000 * 60 * 60 * 24))
                            : 1;
                          
                          return (
                            <div key={hotel.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium">{hotel.data.name}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {hotel.data.location}
                                  </p>
                                </div>
                                <p className="text-green-600 dark:text-green-400 font-medium">
                                  {hotel.data.rate_per_night?.lowest} x {nights} night{nights !== 1 ? 's' : ''}
                                </p>
                              </div>
                              {dates?.from && dates?.to && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                  <p>Check-in: {format(dates.from, 'MMM d, yyyy')}</p>
                                  <p>Check-out: {format(dates.to, 'MMM d, yyyy')}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Activities */}
                  {activitySelections.length > 0 && (
                    <div className="p-6">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Bookmark className="h-5 w-5 text-amber-500" />
                        Activities & Notes
                      </h3>
                      <div className="space-y-4">
                        {activitySelections.map((activity) => (
                          <div key={activity.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <p className="font-medium mb-2">{activity.data.description}</p>
                            {activity.data.notes && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mt-2">
                                <p className="italic whitespace-pre-wrap">{activity.data.notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  <h2 className="text-xl font-semibold">Communication</h2>
                </div>
                
                <div className="p-6">
                  {booking.comments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        No messages yet. Send a message to the customer.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 mb-6">
                      {booking.comments.map((comment) => (
                        <div 
                          key={comment.id}
                          className={`p-4 rounded-lg ${
                            comment.isAgent 
                              ? 'bg-blue-50 dark:bg-blue-900/20 mr-8' 
                              : 'bg-gray-100 dark:bg-gray-700 ml-8'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`font-medium ${comment.isAgent ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                              {comment.isAgent ? 'You (Agent)' : booking.userName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {format(comment.timestamp, 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Comment Form */}
                  <form onSubmit={handleSubmitComment} className="mt-6">
                    <div className="mb-4">
                      <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Send a Message to Customer
                      </label>
                      <textarea
                        id="comment"
                        rows={4}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type your message here..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        disabled={booking.status === 'cancelled' || booking.status === 'completed'}
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingComment || !newComment.trim() || booking.status === 'cancelled' || booking.status === 'completed'}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSubmittingComment ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            Send Message
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>

            {/* Sidebar */}
            <section className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden sticky top-24">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold">Quick Actions</h2>
                </div>
                <div className="p-6 space-y-4">
                  <button
                    onClick={() => handleStatusChange('agent_reviewing')}
                    disabled={booking.status === 'agent_reviewing' || isChangingStatus}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Mark as Reviewing
                  </button>
                  
                  <button
                    onClick={() => handleStatusChange('questions_pending')}
                    disabled={booking.status === 'questions_pending' || isChangingStatus}
                    className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Ask Questions
                  </button>
                  
                  <button
                    onClick={() => handleStatusChange('confirmed')}
                    disabled={booking.status === 'confirmed' || isChangingStatus}
                    className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Booking
                  </button>
                  
                  <button
                    onClick={() => handleStatusChange('completed')}
                    disabled={booking.status === 'completed' || isChangingStatus}
                    className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Mark as Completed
                  </button>
                  
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={booking.status === 'cancelled' || isChangingStatus}
                    className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel Booking
                  </button>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Email the customer directly:
                    </p>
                    <a
                      href={`mailto:${booking.userEmail}?subject=Your Travel Booking: ${booking.itineraryName}`}
                      className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors text-center block"
                    >
                      Send Email
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </RequireAdmin>
  );
} 