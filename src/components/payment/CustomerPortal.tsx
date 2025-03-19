'use client'

import React, { useState } from 'react'

export default function CustomerPortal({ sessionId }: { sessionId?: string }) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePortalSession = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      })

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <button
      type="button"
      onClick={handlePortalSession}
      disabled={isLoading}
      className="mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
    >
      {isLoading ? 'Loading...' : 'Manage Billing'}
    </button>
  )
}