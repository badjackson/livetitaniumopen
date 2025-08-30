import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
} from 'firebase/firestore';

// Check if all required environment variables are present
const requiredEnvVars = [
  'NEXT_PUBLIC_FB_API_KEY',
  'NEXT_PUBLIC_FB_AUTH_DOMAIN', 
  'NEXT_PUBLIC_FB_PROJECT_ID',
  'NEXT_PUBLIC_FB_STORAGE_BUCKET',
  'NEXT_PUBLIC_FB_MSG_SENDER_ID',
  'NEXT_PUBLIC_FB_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

// Log missing variables for debugging
if (missingVars.length > 0) {
  console.warn('Missing Firebase environment variables:', missingVars);
}

// Validate configuration
const apiKey = process.env.NEXT_PUBLIC_FB_API_KEY;
const projectId = process.env.NEXT_PUBLIC_FB_PROJECT_ID;

if (apiKey && !apiKey.startsWith('AIza')) {
  console.error('Invalid Firebase API key format. API key should start with "AIza"');
}

if (projectId && (projectId === 'your_project_id' || projectId.includes('placeholder'))) {
  console.error('Firebase project ID appears to be a placeholder. Please update with your actual project ID.');
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FB_MSG_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID!,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with error handling
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});