'use client';

import { useEffect } from 'react';
import { useAuth } from './AuthContext';
import { auth } from '@/lib/firebase/config';

export const AuthDebugger = () => {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    console.log("AuthDebugger - Current auth state:", { 
      user: user ? { 
        uid: user.uid, 
        email: user.email,
        isAnonymous: user.isAnonymous,
        emailVerified: user.emailVerified
      } : null, 
      loading,
      currentUser: auth.currentUser ? {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email
      } : null
    });
    
    // Check localStorage
    try {
      const storedUser = localStorage.getItem('authUser');
      console.log("Stored user in localStorage:", storedUser ? JSON.parse(storedUser) : null);
    } catch (e) {
      console.error("Could not read from localStorage", e);
    }
  }, [user, loading]);
  
  return null; // This component doesn't render anything
}; 