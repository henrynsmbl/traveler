'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { format } from 'date-fns';
import { getAllBookings, Booking, BookingStatus, updateBookingStatus } from '@/lib/firebase/bookings';
import { Clock, CheckCircle, HelpCircle, XCircle, Search, Filter, ChevronDown } from 'lucide-react';
import { ADMIN_EMAILS } from '@/lib/constants';
import { useAdmin } from '@/hooks/useAdmin';
import { RequireAdmin } from '@/components/auth/RequireAdmin';

export default function AdminBookingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      router.push('/');
    }
  }, [isAdmin, adminLoading, user, router]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!isAdmin) return;

      try {
        const fetchedBookings = await getAllBookings();
        setBookings(fetchedBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    if (isAdmin) {
      fetchBookings();
    }
  }, [isAdmin]);

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus, updatedAt: new Date() } 
          : booking
      ));
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    }
  };

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case 'pending_review':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'agent_reviewing':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'questions_pending':
        return <HelpCircle className="h-5 w-5 text-purple-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'pending_review':
        return 'text-amber-500 bg-amber-100 dark:bg-amber-900/20';
      case 'agent_reviewing':
        return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
      case 'questions_pending':
        return 'text-purple-500 bg-purple-100 dark:bg-purple-900/20';
      case 'confirmed':
        return 'text-green-500 bg-green-100 dark:bg-green-900/20';
      case 'completed':
        return 'text-green-500 bg-green-100 dark:bg-green-900/20';
      case 'cancelled':
        return 'text-red-500 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-700';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.itineraryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (!user || adminLoading) {
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

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-16 z-10">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Booking Management</h1>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or itinerary..."
                  className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'all')}
                  className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="agent_reviewing">Agent Reviewing</option>
                  <option value="questions_pending">Questions Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Bookings ({filteredBookings.length})</h2>
            </div>
            
            {filteredBookings.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No bookings found matching your criteria.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            <span className="ml-1">{booking.status.replace('_', ' ').toUpperCase()}</span>
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {format(booking.createdAt, 'MMM d, yyyy')}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-medium">{booking.itineraryName}</h3>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p>{booking.userName} ({booking.userEmail})</p>
                          <p>${booking.totalPrice.toFixed(2)} • {booking.selections.length} items</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                        
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking.id, e.target.value as BookingStatus)}
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
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </RequireAdmin>
  );
} 