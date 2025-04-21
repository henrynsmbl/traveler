import { useAuth } from '@/components/auth/AuthContext';
import { ADMIN_EMAILS } from '@/lib/constants';
import { useEffect, useState } from 'react';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      setIsAdmin(ADMIN_EMAILS.includes(user.email));
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  }, [user]);

  return { isAdmin, loading };
} 