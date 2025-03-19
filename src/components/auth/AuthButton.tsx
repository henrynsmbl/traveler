'use client';

import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';

export const AuthButton = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleClick = () => {
        setIsLoading(true);
        router.push('/signin');
    };

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className="inline-flex items-center px-2.5 py-1 h-7
                     bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                     text-white text-xs font-medium whitespace-nowrap
                     rounded transition-colors duration-150
                     disabled:opacity-70 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                     dark:focus:ring-offset-gray-900"
        >
            {isLoading ? (
                <div className="h-3 w-3 animate-spin rounded-full border-1.5 border-white border-t-transparent" />
            ) : (
                <>
                    <LogIn size={12} className="mr-1" />
                    <span>Sign in</span>
                </>
            )}
        </button>
    );
};