import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBx1234567890abcdefghijk",
  authDomain: "titanium-open-2024.firebaseapp.com",
  projectId: "titanium-open-2024",
  storageBucket: "titanium-open-2024.appspot.com",
  messagingSenderId: "987654321",
  appId: "1:987654321:web:abc123def456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;