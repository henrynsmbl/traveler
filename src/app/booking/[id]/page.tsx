'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Clock, MessageSquare, Send, CheckCircle, AlertCircle, HelpCircle, XCircle } from 'lucide-react';
import { getBooking, Booking, BookingStatus, addBookingComment } from '@/lib/firebase/bookings';
import Link from 'next/link';

const getStatusDetails = (status: BookingStatus) => {
  switch (status) {
    case 'pending_review':
      return {
        label: 'Pending Agent Review',
        description: 'Your booking has been submitted and is waiting for review by our travel agent.',
        icon: <Clock className="h-6 w-6 text-amber-500" />,
        color: 'text-amber-500',
        bgColor: 'bg-amber-100 dark:bg-amber-900/20'
      };
    case 'agent_reviewing':
      return {
        label: 'Agent Reviewing',
        description: 'Our travel agent is currently reviewing your booking.',
        icon: <CheckCircle className="h-6 w-6 text-blue-500" />,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20'
      };
    case 'questions_pending':
      return {
        label: 'Questions Pending',
        description: 'Our travel agent has some questions about your booking. Please check the comments section.',
        icon: <HelpCircle className="h-6 w-6 text-purple-500" />,
        color: 'text-purple-500',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20'
      };
    case 'confirmed':
      return {
        label: 'Booking Confirmed',
        description: 'Your booking has been confirmed by our travel agent.',
        icon: <CheckCircle className="h-6 w-6 text-green-500" />,
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/20'
      };
    case 'completed':
      return {
        label: 'Booking Completed',
        description: 'Your booking has been completed. Email confirmations will be sent shortly. Enjoy your trip!',
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

export default function BookingStatusPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const bookingId = params instanceof Promise ? React.use(params).id : params.id;

  useEffect(() => {
    const fetchBooking = async () => {
      if (!user?.uid) {
        router.push('/');
        return;
      }

      try {
        setLoading(true);
        const fetchedBooking = await getBooking(bookingId);
        
        if (!fetchedBooking) {
          setError('Booking not found');
          return;
        }
        
        if (fetchedBooking.userId !== user.uid) {
          setError('You do not have permission to view this booking');
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

    fetchBooking();
  }, [bookingId, user, router]);

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
        user.displayName || 'User',
        false, // not an agent
        newComment.trim()
      );
      
      // Refresh booking data to get the new comment
      const updatedBooking = await getBooking(booking.id);
      if (updatedBooking) {
        setBooking(updatedBooking);
      }
      
      // Clear the comment input
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Failed to load booking'}</p>
        <button 
          onClick={() => router.push('/account')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Account
        </button>
      </div>
    );
  }

  const statusDetails = getStatusDetails(booking.status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      {/* Header - Adjust positioning to account for navbar */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/account')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Booking: {booking.itineraryName}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Created on {format(booking.createdAt, 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - Add pt-6 for spacing from header */}
      <main className="max-w-7xl mx-auto px-4 py-8 pt-6 sm:px-6 lg:px-8">
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

            {/* Comments Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">Communication</h2>
              </div>
              
              <div className="p-6">
                <div className="h-96 overflow-y-auto mb-6 pr-2">
                  {booking.comments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        No messages yet. Your travel agent will respond shortly.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
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
                              {comment.isAgent ? 'Travel Agent' : 'You'}
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
                </div>
                
                {/* Comment Form */}
                <form onSubmit={handleSubmitComment} className="mt-6">
                  <div 
                    className={`flex items-end bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 pr-3 pl-4 py-2 transition-all duration-200 ${
                      newComment.split('\n').length > 1 || newComment.length > 50 
                        ? 'rounded-xl' // Less rounded when expanded
                        : 'rounded-full' // Fully rounded when empty/short
                    }`}
                  >
                    <textarea
                      id="comment"
                      value={newComment}
                      onChange={(e) => {
                        const textarea = e.target;
                        textarea.style.height = 'inherit';
                        const newHeight = Math.min(textarea.scrollHeight, 24 * 3);
                        textarea.style.height = `${newHeight}px`;
                        setNewComment(textarea.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (newComment.trim() && !isSubmittingComment && booking.status !== 'cancelled') {
                            handleSubmitComment(e);
                          }
                        }
                      }}
                      autoFocus
                      rows={1}
                      placeholder="Type a message..."
                      className="flex-1 resize-none bg-transparent border-0 focus:ring-0 outline-none
                              dark:text-white min-h-[24px] py-0 overflow-y-auto scrollbar-none"
                      style={{
                        maxHeight: '72px'
                      }}
                      disabled={booking.status === 'cancelled'}
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingComment || !newComment.trim() || booking.status === 'cancelled'}
                      className="ml-2 p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300
                              disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                    >
                      {isSubmittingComment ? (
                        <div className="w-5 h-5 border-t-2 border-blue-600 dark:border-blue-400 rounded-full animate-spin" />
                      ) : (
                        <Send size={20} />
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>

          {/* Sidebar - Summary */}
          <section className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden sticky top-24">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold">Booking Summary</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-700 dark:text-gray-300">Booking ID:</span>
                  <span className="text-right font-mono text-sm">{booking.id.slice(0, 8)}</span>
                  
                  <span className="text-gray-700 dark:text-gray-300">Status:</span>
                  <span className={`text-right ${statusDetails.color}`}>{statusDetails.label}</span>
                  
                  <span className="text-gray-700 dark:text-gray-300">Created:</span>
                  <span className="text-right">{format(booking.createdAt, 'MMM d, yyyy')}</span>
                  
                  <span className="text-gray-700 dark:text-gray-300">Last Updated:</span>
                  <span className="text-right">{format(booking.updatedAt, 'MMM d, yyyy')}</span>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Total:</span>
                    <span>${booking.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                
                <Link
                  href={booking.itineraryId ? `/itinerary/${booking.itineraryId}` : '/itinerary'}
                  className="w-full mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center block"
                >
                  View Itinerary Details
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
} 