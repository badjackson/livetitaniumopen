import { db } from './firebase';
import {
  doc, setDoc, serverTimestamp, onSnapshot,
  collection
} from 'firebase/firestore';

// Error handling wrapper
async function handleFirestoreOperation<T>(operation: () => Promise<T>): Promise<T | null> {
  try {
    return await operation();
  } catch (error: any) {
    console.error('Firestore operation failed:', error);
    if (error.code === 'permission-denied') {
      console.warn('Firebase Security Rules need to be updated. Check the console for required rules.');
    }
    return null;
  }
}

export async function upsertHourlyEntry(p: {
  sector: string; hour: number; competitorId: string;
  boxNumber: number; fishCount: number; totalWeight: number;
  status: string; source: 'Judge'|'Admin'; updatedBy: string;
}) {
  const id = `${p.sector}-${p.hour}-${p.competitorId}`;
  return await handleFirestoreOperation(async () => {
    await setDoc(doc(db, 'hourly_entries', id), { ...p, timestamp: serverTimestamp() }, { merge: true });
  });
}

export function subscribeHourlyAll(cb: (rows: any[]) => void) {
  return onSnapshot(
    collection(db, 'hourly_entries'), 
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    error => {
      console.error('Error subscribing to hourly entries:', error);
      if (error.code === 'permission-denied') {
        console.warn('Firebase Security Rules need to be updated for hourly_entries collection.');
      }
      if (error.code === 'permission-denied') {
        console.warn('Firebase Security Rules need to be updated for hourly_entries collection.');
      }
    }
  );
}

export async function upsertBigCatch(p: {
  sector: string; competitorId: string; boxNumber: number;
  biggestCatch: number; status: string; source: 'Judge'|'Admin'; updatedBy: string;
}) {
  const id = `${p.sector}-${p.competitorId}`;
  return await handleFirestoreOperation(async () => {
    await setDoc(doc(db, 'big_catches', id), { ...p, timestamp: serverTimestamp() }, { merge: true });
  });
}

export function subscribeBigCatchAll(cb: (rows: any[]) => void) {
  return onSnapshot(
    collection(db, 'big_catches'), 
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    error => {
      console.error('Error subscribing to big catches:', error);
      if (error.code === 'permission-denied') {
        console.warn('Firebase Security Rules need to be updated for big_catches collection.');
      }
      if (error.code === 'permission-denied') {
        console.warn('Firebase Security Rules need to be updated for big_catches collection.');
      }
    }
  );
}