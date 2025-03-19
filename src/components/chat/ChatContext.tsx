'use client'

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { ChatSession } from '@/types/chat';
import { useRouter } from 'next/navigation';
import {
  getChatSessions,
  createChatSession,
  updateChatSession,
  deleteChatSession,
  getLastActiveSession,
  saveLastActiveSession
} from '@/lib/firebase/chatFirestore';

const MAX_CHAT_SESSIONS = 10;

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface ChatContextType {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentSession: ChatSession | null;
  setSessions: (sessions: ChatSession[]) => void;
  setCurrentSessionId: (id: string | null) => void;
  handleSessionSelect: (id: string) => void;
  handleDeleteSession: (id: string) => void;
  createNewSession: () => void;
  updateCurrentSession: (updates: Partial<ChatSession>) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const currentSession = sessions.find(session => session.id === currentSessionId) || null;

  // clear on logout
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setCurrentSessionId(null);
    }
  }, [user]);

  // Load chat sessions from Firestore
  useEffect(() => {
    const loadSessions = async () => {
      if (!user) {
        setIsLoading(false);
        setSessions([]);
        setCurrentSessionId(null);
        return;
      }
  
      try {
        setIsLoading(true);
        const fetchedSessions = await getChatSessions(user.uid);
        const messageSessions = fetchedSessions.filter(session => session.messages.length > 0);
        
        // Check for saved session first
        const savedSessionId = localStorage.getItem(`currentSession-${user.uid}`);
        const savedSession = savedSessionId ? messageSessions.find(s => s.id === savedSessionId) : null;
        
        // Create new session only if no saved session exists
        if (!savedSession) {
          const newSession = {
            id: uuidv4(),
            title: 'New Chat',
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await createChatSession(user.uid, newSession);
          setSessions([newSession, ...messageSessions]);
          setCurrentSessionId(newSession.id);
        } else {
          setSessions(messageSessions);
          setCurrentSessionId(savedSession.id);
        }
        
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    loadSessions();
  }, [user]);

  // Save last active session whenever it changes
  useEffect(() => {
    const saveLastActive = async () => {
      if (user && currentSessionId) {
        try {
          await saveLastActiveSession(user.uid, currentSessionId);
        } catch (error) {
          console.error('Error saving last active session:', error);
        }
      }
    };

    saveLastActive();
  }, [currentSessionId, user]);

  useEffect(() => {
    if (user?.uid && currentSession?.id) {
      localStorage.setItem(`currentSession-${user.uid}`, currentSession.id);
    }
  }, [currentSession?.id, user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      const savedSessionId = localStorage.getItem(`currentSession-${user.uid}`);
      if (savedSessionId) {
        const session = sessions.find(s => s.id === savedSessionId);
        if (session) {
          setCurrentSessionId(session.id);
        }
      }
    }
  }, [sessions, user?.uid]);

  const handleSessionSelect = async (id: string) => {
    setCurrentSessionId(id);
    router.push('/');
  };

  const handleDeleteSession = async (id: string) => {
    if (!user) return;

    try {
      await deleteChatSession(user.uid, id);
      setSessions(prev => {
        const filtered = prev.filter(session => session.id !== id);
        if (currentSessionId === id && filtered.length > 0) {
          setCurrentSessionId(filtered[0].id);
        } else if (filtered.length === 0) {
          setCurrentSessionId(null);
        }
        return filtered;
      });
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const createNewSession = async () => {
    if (!user || isLoading) return;
    
    const sessionId = uuidv4();
    const newSession = {
      id: sessionId,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    try {
      await createChatSession(user.uid, newSession);
      setSessions(prevSessions => [newSession, ...prevSessions]);
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const updateCurrentSession = async (updates: Partial<ChatSession>) => {
    if (!user || !currentSessionId) return;
    
    try {
      await updateChatSession(user.uid, currentSessionId, updates);
      setSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === currentSessionId
            ? { ...session, ...updates, updatedAt: new Date() }
            : session
        )
      );
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  return (
    <ChatContext.Provider value={{
      sessions,
      currentSessionId,
      currentSession,
      setSessions,
      setCurrentSessionId,
      handleSessionSelect,
      handleDeleteSession,
      createNewSession,
      updateCurrentSession
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatSessions() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatSessions must be used within a ChatProvider');
  }
  return context;
}