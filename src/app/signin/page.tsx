'use client';

import { useState, useEffect } from 'react';
import { signInWithGoogle, signInWithEmail, createAccountWithEmail, resendVerificationEmail, sendPasswordResetEmail } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import Link from 'next/link';
import { getAuth } from 'firebase/auth';

export default function SignInPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [verificationSent, setVerificationSent] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const router = useRouter();
    const { user } = useAuth();
    const auth = getAuth();

    useEffect(() => {
        // If user exists and is verified, redirect to home
        if (user && user.emailVerified) {
            router.push('/');
        } 
        // If user exists but is not verified, show verification message
        else if (user && !user.emailVerified) {
            setCurrentUser(user);
            setErrorMessage('Please verify your email before signing in');
        }
    }, [user, router]);

    // Add a new useEffect to check for verification status changes
    useEffect(() => {
        if (!user) return;
        
        // Set up an interval to check if the user's email has been verified
        const checkVerificationStatus = setInterval(() => {
            if (user) {
                user.reload().then(() => {
                    if (user.emailVerified) {
                        clearInterval(checkVerificationStatus);
                        router.push('/');
                    }
                }).catch(error => {
                    console.error("Error checking verification status:", error);
                });
            }
        }, 3000); // Check every 3 seconds
        
        // Clean up the interval when component unmounts
        return () => clearInterval(checkVerificationStatus);
    }, [user, router]);

    if (user && user.emailVerified) {
        return <div />;
    }

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            setErrorMessage('');
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
            setErrorMessage('');
            setVerificationSent(false);
            
            if (isRegistering) {
                const result = await createAccountWithEmail(email, password);
                setCurrentUser(result.user);
                setVerificationSent(true);
            } else {
                await signInWithEmail(email, password);
            }
        } catch (error: any) {
            // Silently handle the error - no console.error here
            // Extract and display user-friendly error message
            if (error.code === 'auth/wrong-password' || 
                error.code === 'auth/user-not-found' || 
                error.code === 'auth/invalid-credential') {
                setErrorMessage('Invalid email or password');
            } else if (error.code === 'auth/email-already-in-use') {
                setErrorMessage('Email already in use');
            } else if (error.code === 'auth/weak-password') {
                setErrorMessage('Password is too weak');
            } else if (error.code === 'auth/invalid-email') {
                setErrorMessage('Invalid email format');
            } else if (error.code === 'auth/email-not-verified') {
                setErrorMessage('Please verify your email before signing in');
                // Try to get the current user to allow resending verification
                const currentUser = auth.currentUser;
                if (currentUser) {
                    setCurrentUser(currentUser);
                }
            } else {
                setErrorMessage('An error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async () => {
        try {
            setIsLoading(true);
            if (currentUser) {
                await resendVerificationEmail(currentUser);
                setVerificationSent(true);
            }
        } catch (error) {
            setErrorMessage('Failed to resend verification email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            setErrorMessage('Please enter your email address to reset your password');
            return;
        }
        
        try {
            setIsLoading(true);
            setErrorMessage('');
            await sendPasswordResetEmail(email);
            setResetEmailSent(true);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                setErrorMessage('No account found with this email address');
            } else if (error.code === 'auth/invalid-email') {
                setErrorMessage('Invalid email format');
            } else {
                setErrorMessage('Failed to send password reset email. Please try again.');
            }
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
                        {verificationSent && (
                            <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm">
                                <p className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Verification email sent! Please check your inbox and verify your email before signing in.
                                </p>
                            </div>
                        )}
                        
                        {resetEmailSent && (
                            <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm">
                                <p className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Password reset email sent! Please check your inbox for instructions.
                                </p>
                            </div>
                        )}
                        
                        {errorMessage && !verificationSent && !resetEmailSent && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                                <p className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errorMessage}
                                    {errorMessage === 'Please verify your email before signing in' && (
                                        <button 
                                            onClick={handleResendVerification}
                                            className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                                            disabled={isLoading}
                                        >
                                            Resend verification
                                        </button>
                                    )}
                                </p>
                            </div>
                        )}
                        
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

                            <div className="flex flex-col text-sm">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRegistering(!isRegistering);
                                        setErrorMessage('');
                                        setVerificationSent(false);
                                        setResetEmailSent(false);
                                    }}
                                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 mb-2"
                                >
                                    {isRegistering 
                                        ? 'Already have an account? Sign in' 
                                        : "Don't have an account? Register"}
                                </button>
                                
                                {!isRegistering && (
                                    <button
                                        type="button"
                                        onClick={handlePasswordReset}
                                        disabled={isLoading}
                                        className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        Forgot password?
                                    </button>
                                )}
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