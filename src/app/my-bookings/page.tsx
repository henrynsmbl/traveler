'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthContext'
import { ArrowLeft, Clock, CheckCircle, HelpCircle, XCircle, Calendar, MapPin } from 'lucide-react'
import { getUserBookings, BookingStatus } from '@/lib/firebase/bookings'
import { format } from 'date-fns'
import Link from 'next/link'

export default function MyBookingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.uid) {
        router.push('/')
        return
      }
      
      try {
        setLoading(true)
        const userBookings = await getUserBookings(user.uid)
        setBookings(userBookings)
      } catch (error) {
        console.error('Error fetching bookings:', error)
        setError('Failed to load bookings. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchBookings()
  }, [user, router])

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case 'pending_review':
        return <Clock className="h-5 w-5 text-amber-500" />
      case 'agent_reviewing':
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      case 'questions_pending':
        return <HelpCircle className="h-5 w-5 text-purple-500" />
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'pending_review':
        return 'text-amber-500 bg-amber-100 dark:bg-amber-900/20'
      case 'agent_reviewing':
        return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20'
      case 'questions_pending':
        return 'text-purple-500 bg-purple-100 dark:bg-purple-900/20'
      case 'confirmed':
        return 'text-green-500 bg-green-100 dark:bg-green-900/20'
      case 'completed':
        return 'text-green-500 bg-green-100 dark:bg-green-900/20'
      case 'cancelled':
        return 'text-red-500 bg-red-100 dark:bg-red-900/20'
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-700'
    }
  }

  const getStatusText = (status: BookingStatus) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">No bookings yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't made any bookings yet. Start by creating an itinerary and booking it with our travel agents.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Planning
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/booking/${booking.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-gray-100 dark:border-gray-700"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{booking.itineraryName}</h2>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      <span className="ml-1">{getStatusText(booking.status)}</span>
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Created on {format(booking.createdAt, 'MMM d, yyyy')}</span>
                    </div>
                    
                    {booking.selections && booking.selections.length > 0 && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>
                          {booking.selections.filter((s: { type: string }) => s.type === 'flight').length} Flights, {' '}
                          {booking.selections.filter((s: { type: string }) => s.type === 'hotel').length} Hotels
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      ${booking.totalPrice.toFixed(2)}
                    </div>
                    
                    {booking.status === 'questions_pending' && (
                      <div className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                        Agent has questions
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
} 