'use client'

import { useState } from 'react'
import Navbar from './Navbar'
import { useChatSessions } from '../chat/ChatContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { sessions, currentSessionId, handleSessionSelect, handleDeleteSession } = useChatSessions()

  return (
    <>
      <Navbar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onDeleteSession={handleDeleteSession}
      />
      <main className="h-[calc(100vh-4rem)]">
        {children}
      </main>
    </>
  )
}