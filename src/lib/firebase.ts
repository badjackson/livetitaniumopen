import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAb72OZaFpAZPTcnyYbXE4uYAP03s3QHI0",
  authDomain: "titanium-f7b50.firebaseapp.com",
  projectId: "titanium-f7b50",
  storageBucket: "titanium-f7b50.firebasestorage.app",
  messagingSenderId: "30259124231",
  appId: "1:30259124231:web:ebaad04109b0400f9af2a2",
  measurementId: "G-2HN2C21SLD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;