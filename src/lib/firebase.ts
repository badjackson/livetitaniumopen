import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY || "AIzaSyAb72OZaFpAZPTcnyYbXE4uYAP03s3QHI0",
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN || "titanium-f7b50.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID || "titanium-f7b50",
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET || "titanium-f7b50.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FB_MSG_SENDER_ID || "30259124231",
  appId: process.env.NEXT_PUBLIC_FB_APP_ID || "1:30259124231:web:ebaad04109b0400f9af2a2",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with error handling
try {
  export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch (error) {
  console.warn('Firestore initialization failed, using fallback:', error);
  // Fallback for development
  export const db = initializeFirestore(app, {});
}