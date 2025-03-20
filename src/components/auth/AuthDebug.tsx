'use client';

import { useAuth } from './AuthContext';
import { useEffect } from 'react';

export const AuthDebug = () => {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    console.log('AuthDebug - Current auth state:', { user, loading });
  }, [user, loading]);
  
  return null; // This component doesn't render anything
}; 