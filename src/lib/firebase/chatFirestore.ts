import { 
    collection, 
    doc, 
    getDocs, 
    getDoc,
    setDoc, 
    deleteDoc, 
    updateDoc,
    query, 
    orderBy,
    limit,
    Timestamp,
    where,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import type { ChatSession, Selection, FlightSelectionData, HotelSelectionData } from '@/types/chat';
import type { Message, MessageContent } from '@/types/messages';

// Firestore versions of the types that use Timestamp instead of Date
interface FirestoreMessage extends Omit<Message, 'timestamp'> {
    contents: MessageContent[];
    isUser: boolean;
    timestamp: Timestamp;
}

interface FirestoreSelection {
    id: string;
    type: 'flight' | 'hotel';
    data: FlightSelectionData | HotelSelectionData;
    addedAt: Timestamp;
}

interface FirestoreChatSession {
    id: string;
    title: string;
    messages: FirestoreMessage[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
    selections?: FirestoreSelection[];
}

export const testConnection = async (userId: string) => {
    try {
      // Try to create a test document
      const testDoc = doc(db, 'users', userId);
      await setDoc(testDoc, {
        lastActive: Timestamp.fromDate(new Date()),
        createdAt: Timestamp.fromDate(new Date())
      }, { merge: true });
      console.log('Firebase connection successful!');
      return true;
    } catch (error: any) {
      console.error('Firebase connection test failed:', error);
      return false;
    }
  };

// Helper function to convert Firestore data to application data
const convertFromFirestore = (data: any): ChatSession => {
    return {
        id: data.id,
        title: data.title,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        messages: data.messages.map((msg: any) => ({
            contents: msg.contents,
            isUser: msg.isUser,
            timestamp: msg.timestamp.toDate(),
        })),
        selections: data.selections?.map((selection: any) => ({
            id: selection.id,
            type: selection.type as 'flight' | 'hotel',
            data: selection.data,
            addedAt: selection.addedAt.toDate()
        }))
    };
};

// Helper function to convert application data to Firestore format
const convertToFirestore = (data: Partial<ChatSession>): Partial<FirestoreChatSession> => {
    const firestoreData: Partial<FirestoreChatSession> = {};

    // Handle basic properties
    if (data.id) firestoreData.id = data.id;
    if (data.title) firestoreData.title = data.title;

    // Always set updatedAt to current time
    firestoreData.updatedAt = Timestamp.fromDate(new Date());

    // Convert createdAt if present
    if (data.createdAt) {
        firestoreData.createdAt = Timestamp.fromDate(data.createdAt);
    }

    // Convert messages if present
    if (data.messages) {
        firestoreData.messages = data.messages.map(msg => ({
            contents: msg.contents,
            isUser: msg.isUser,
            timestamp: msg.timestamp ? Timestamp.fromDate(msg.timestamp) : Timestamp.fromDate(new Date())
        }));
    }

    // Convert selections if present
    if (data.selections) {
        firestoreData.selections = data.selections.map(selection => ({
            id: selection.id,
            type: selection.type,
            data: selection.data,
            addedAt: Timestamp.fromDate(selection.addedAt)
        }));
    }

    return firestoreData;
};

// Get all chat sessions for a user
export const getChatSessions = async (userId: string): Promise<ChatSession[]> => {
    try {
        const sessionsRef = collection(db, 'users', userId, 'chatSessions');
        const q = query(
            sessionsRef,
            orderBy('updatedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            ...convertFromFirestore(doc.data()),
            id: doc.id
        }));
    } catch (error: any) {
        console.error('Error fetching chat sessions:', error);
        throw error;
    }
};

// Get a single chat session
export const getChatSession = async (
    userId: string,
    sessionId: string
): Promise<ChatSession | null> => {
    try {
        const sessionRef = doc(db, 'users', userId, 'chatSessions', sessionId);
        const sessionDoc = await getDoc(sessionRef);
        
        if (!sessionDoc.exists()) {
            return null;
        }
        
        return {
            ...convertFromFirestore(sessionDoc.data()),
            id: sessionDoc.id
        };
    } catch (error: any) {
        console.error('Error fetching chat session:', error);
        throw error;
    }
};

// Create a new chat session
export const createChatSession = async (
    userId: string,
    session: ChatSession
): Promise<string> => {
    try {
        const docRef = doc(db, 'users', userId, 'chatSessions', session.id);  // Changed 'chats' to 'chatSessions'
        await setDoc(docRef, {
            ...session,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return session.id;
    } catch (error: any) {
        if (error.code === 'unavailable' || error.code === 'resource-exhausted') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return createChatSession(userId, session);
        }
        console.error('Error creating chat session:', error);
        throw error;
    }
};

// Update an existing chat session
export const updateChatSession = async (
    userId: string,
    sessionId: string,
    updates: Partial<ChatSession>
): Promise<void> => {
    try {
        const sessionRef = doc(db, 'users', userId, 'chatSessions', sessionId);
        const firestoreUpdates = convertToFirestore(updates);
        await updateDoc(sessionRef, firestoreUpdates);
    } catch (error: any) {
        console.error('Error updating chat session:', error);
        throw error;
    }
};

// Delete a chat session
export const deleteChatSession = async (
    userId: string,
    sessionId: string
): Promise<void> => {
    try {
        const sessionRef = doc(db, 'users', userId, 'chatSessions', sessionId);
        await deleteDoc(sessionRef);
    } catch (error: any) {
        console.error('Error deleting chat session:', error);
        throw error;
    }
};

// Save the last active session ID
export const saveLastActiveSession = async (
    userId: string,
    sessionId: string
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            lastActiveSessionId: sessionId,
            lastActiveAt: new Date()
        }, { merge: true });
    } catch (error: any) {
        if (error.code === 'unavailable') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return saveLastActiveSession(userId, sessionId);
        }
        console.error('Error saving last active session:', error);
    }
};

// Get the last active session ID
export const getLastActiveSession = async (
    userId: string
): Promise<string | null> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            return null;
        }
        
        return userDoc.data().lastActiveSessionId || null;
    } catch (error: any) {
        console.error('Error getting last active session:', error);
        throw error;
    }
};

export async function createNewChatSession(userId: string): Promise<ChatSession | null> {
  try {
    // First check if there's already a new/empty chat
    const chatSessionsRef = collection(db, 'chatSessions');
    const q = query(
      chatSessionsRef,
      where('userId', '==', userId),
      where('title', '==', 'New Chat'),
      // Optionally also check for empty messages
      where('messageCount', '==', 0)
    );
    
    const existingNewChats = await getDocs(q);
    
    // If there's already a new chat, return that instead of creating a new one
    if (!existingNewChats.empty) {
      const existingChat = existingNewChats.docs[0];
      return {
        id: existingChat.id,
        title: existingChat.data().title,
        messages: [],
        createdAt: existingChat.data().createdAt.toDate(),
        updatedAt: existingChat.data().updatedAt.toDate()
      };
    }

    // If no new chat exists, create one
    const newSession = {
      title: 'New Chat',
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messageCount: 0
    };

    const docRef = await addDoc(chatSessionsRef, newSession);
    
    return {
      id: docRef.id,
      title: newSession.title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error: any) {
    console.error('Error creating new chat session:', error);
    return null;
  }
}