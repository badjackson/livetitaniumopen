'use client';

import { ReactNode, useEffect, useState } from 'react';
// import { subscribeHourlyAll, subscribeBigCatchAll } from '@/lib/firestore-entries';

function writeAndDispatch(key: string, value: any) {
  if (typeof window === 'undefined') return;
  const json = JSON.stringify(value);
  localStorage.setItem(key, json);
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: json }));
}

export default function FirestoreSyncProvider({ children }: { children: ReactNode }) {
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Firebase sync temporarily disabled until security rules are configured
  // To enable: Apply the rules from FIREBASE_SECURITY_RULES.md to your Firebase Console
  // Then uncomment the useEffect code below
  
  // useEffect(() => {
  //   const unHourly = subscribeHourlyAll((rows) => {
  //     const hourly: any = {};
  //     for (const r of rows) {
  //       const sector = r.sector; const hour = r.hour; const cId = r.competitorId;
  //       hourly[sector] ??= {};
  //       hourly[sector][hour] ??= {};
  //       hourly[sector][hour][cId] = {
  //         competitorId: cId,
  //         boxNumber: r.boxNumber,
  //         fishCount: r.fishCount,
  //         totalWeight: r.totalWeight,
  //         status: r.status,
  //         source: r.source,
  //         timestamp: r.timestamp?.toDate ? r.timestamp.toDate() : r.timestamp,
  //       };
  //     }
  //     writeAndDispatch('hourlyData', hourly);
  //   });

  //   const unBig = subscribeBigCatchAll((rows) => {
  //     const big: any = {};
  //     for (const r of rows) {
  //       const sector = r.sector; const cId = r.competitorId;
  //       big[sector] ??= {};
  //       big[sector][cId] = {
  //         competitorId: cId,
  //         boxNumber: r.boxNumber,
  //         biggestCatch: r.biggestCatch,
  //         status: r.status,
  //         source: r.source,
  //         timestamp: r.timestamp?.toDate ? r.timestamp.toDate() : r.timestamp,
  //       };
  //     }
  //     writeAndDispatch('grossePriseData', big);
  //   });

  //   return () => { 
  //     try {
  //       if (unHourly) unHourly();
  //       if (unBig) unBig();
  //     } catch (error) {
  //       console.warn('Error during Firebase cleanup:', error);
  //     }
  //   };
  // }, []);

  // Show error notification if Firebase is not accessible
  useEffect(() => {
    if (firebaseError) {
      console.warn('Firebase Sync Provider:', firebaseError);
    }
  }, [firebaseError]);

  return <>{children}</>;
}