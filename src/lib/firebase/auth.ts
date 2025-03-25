import { 
  GoogleAuthProvider, 
  signInWithPopup,
  getRedirectResult,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
  User,
  getAuth,
  signInWithRedirect,
  sendEmailVerification,
  sendPasswordResetEmail as sendPasswordReset 
} from 'firebase/auth';
import { auth } from './config';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './config';


export const signInWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    // Add these parameters to make it more browser-friendly
    provider.setCustomParameters({
      prompt: 'select_account',
      login_hint: '',  // Let user choose account every time
      auth_type: 'reauthenticate'
    });
    
    // Try popup first, fall back to redirect on mobile
    try {
      const result = await signInWithPopup(auth, provider);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          createdAt: new Date(),
          lastActive: new Date(),
          selections: [],
          hotelDates: {},
          subscription: {
            status: 'inactive'
          }
        });
      }
      return result.user;
    } catch (popupError: any) {
      // If popup blocked or fails, use redirect
      if (popupError.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, provider);
      }
      throw popupError;
    }
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const handleRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          createdAt: new Date(),
          lastActive: new Date(),
          selections: [],
          hotelDates: {},
          subscription: {
            status: 'inactive'
          }
        });
      }
      return result.user;
    }
    return null;
  } catch (error) {
    console.error('Error handling redirect result:', error);
    throw error;
  }
};

export const createAccountWithEmail = async (email: string, password: string) => {
  try {
    // First check if user exists but doesn't have a Firestore document
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      // If user exists but no document, create it
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          createdAt: new Date(),
          lastActive: new Date(),
          selections: [],
          hotelDates: {},
          subscription: {
            status: 'inactive'
          }
        });
      }
      return userCredential;
    } catch (signInError) {
      // If sign in fails, try creating new account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create initial user document
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        createdAt: new Date(),
        lastActive: new Date(),
        emailVerified: false,
        selections: [],
        hotelDates: {},
        subscription: {
          status: 'inactive'
        }
      });
      
      // Send verification email
      await sendEmailVerification(userCredential.user);
      
      return userCredential;
    }
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<User | null> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Check if email is verified
    if (!userCredential.user.emailVerified) {
      throw { code: 'auth/email-not-verified', message: 'Please verify your email before signing in.' };
    }
    
    return userCredential.user;
  } catch (error) {
    console.warn('Sign in error (handled):', error);
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // This will reload the user to get the latest emailVerified status
    const reloadUser = async (currentUser: User) => {
      try {
        await currentUser.reload();
        setUser({ ...currentUser });
      } catch (error) {
        console.warn('Error reloading user:', error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Reload user to get fresh emailVerified status
        reloadUser(currentUser);
        
        // Set up a periodic check for email verification
        const checkVerificationInterval = setInterval(() => {
          reloadUser(currentUser);
        }, 10000); // Check every 10 seconds
        
        return () => {
          clearInterval(checkVerificationInterval);
          unsubscribe();
        };
      } else {
        setUser(null);
      }
    });
    
    return unsubscribe;
  }, []);

  return { user };
};

// Add a function to resend verification email
export const resendVerificationEmail = async (user: User): Promise<void> => {
  try {
    await sendEmailVerification(user);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string) => {
  const auth = getAuth();
  await sendPasswordReset(auth, email);
};