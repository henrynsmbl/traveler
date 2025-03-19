'use client';

import { useState } from 'react';
import { useAuth } from './AuthContext';
import Image from 'next/image';

export const GoogleSignInButton = () => {
    const { signIn } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        try {
            setIsLoading(true);
            await signIn();
        } catch (error) {
            console.error('Sign in error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="flex items-center gap-3 px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 
                     transition-colors duration-200 group w-full justify-center"
        >
            <Image
                src="/google.svg"
                alt="Google logo"
                width={20}
                height={20}
                className="w-5 h-5"
            />
            <span className="text-gray-700 dark:text-gray-200 font-medium">
                Continue with Google
            </span>
        </button>
    );
}; 