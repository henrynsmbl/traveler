'use client';

import { useState, useEffect } from 'react';
import { signInWithGoogle, signInWithEmail, createAccountWithEmail } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import Link from 'next/link';

export default function SignInPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    if (user) {
        return <div />;
    }

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            await signInWithGoogle();
        } catch (error) {
            console.error('Google sign in error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            if (isRegistering) {
                await createAccountWithEmail(email, password);
            } else {
                await signInWithEmail(email, password);
            }
        } catch (error) {
            console.error('Authentication error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-y-auto">
            <div className="py-16 sm:py-20 md:py-24 px-2 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto flex flex-col">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 inline-block text-transparent bg-clip-text">
                            {isRegistering ? 'Create Account' : 'Sign In'}
                        </h1>
                    </div>

                    <div className="relative rounded-3xl backdrop-blur-lg p-8 bg-white/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 shadow-xl">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email address
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                        placeholder="Enter your email"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Password
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                        placeholder="Enter your password"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full rounded-xl px-6 py-3 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-500 text-white transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:from-blue-700 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
                                </button>
                            </div>

                            <div className="text-sm text-center">
                                <button
                                    type="button"
                                    onClick={() => setIsRegistering(!isRegistering)}
                                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    {isRegistering 
                                        ? 'Already have an account? Sign in' 
                                        : "Don't have an account? Register"}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400">
                                        or continue with
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <GoogleSignInButton />
                            </div>
                        </div>

                        <div className="text-center mt-6 text-xs text-gray-500 dark:text-gray-400">
                            By continuing, you agree to our{' '}
                            <Link 
                                href="/terms" 
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-500"
                            >
                                Terms & Conditions
                            </Link>
                            {' '}and{' '}
                            <Link 
                                href="/privacy" 
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-500"
                            >
                                Privacy Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}