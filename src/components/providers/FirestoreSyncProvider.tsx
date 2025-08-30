'use client';

import { useEffect, ReactNode } from 'react';
import { subscribeHourlyAll, subscribeBigCatchAll } from '@/lib/firestore-entries';

function writeAndDispatch(key: string, value: any) {
  if (typeof window === 'undefined') return;
  const json = JSON.stringify(value);
  localStorage.setItem(key, json);
  // synthetic storage event so existing listeners react immediately
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: json }));
}

export default function FirestoreSyncProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let unHourly: (() => void) | undefined;
    let unBig: (() => void) | undefined;

    try {
      unHourly = subscribeHourlyAll(
        (rows) => {
          const hourly: any = {};
          for (const r of rows) {
            const sector = r.sector;
            const hour = r.hour;
            const cId = r.competitorId;
            if (!sector || !hour || !cId) continue;
            hourly[sector] ??= {};
            hourly[sector][hour] ??= {};
            hourly[sector][hour][cId] = {
              competitorId: cId,
              boxNumber: r.boxNumber,
              fishCount: r.fishCount,
              totalWeight: r.totalWeight,
              status: r.status,
              source: r.source,
              timestamp: r.timestamp?.toDate ? r.timestamp.toDate() : r.timestamp,
            };
          }
          writeAndDispatch('hourlyData', hourly);
        },
        (err) => {
          console.warn('Firestore hourly_entries subscribe error:', err?.code || err?.message || err);
        }
      );

      unBig = subscribeBigCatchAll(
        (rows) => {
          const big: any = {};
          for (const r of rows) {
            const sector = r.sector;
            const cId = r.competitorId;
            if (!sector || !cId) continue;
            big[sector] ??= {};
            big[sector][cId] = {
              competitorId: cId,
              boxNumber: r.boxNumber,
              biggestCatch: r.biggestCatch,
              status: r.status,
              source: r.source,
              timestamp: r.timestamp?.toDate ? r.timestamp.toDate() : r.timestamp,
            };
          }
          writeAndDispatch('grossePriseData', big);
        },
        (err) => {
          console.warn('Firestore big_catches subscribe error:', err?.code || err?.message || err);
        }
      );
    } catch (e) {
      console.warn('Firestore sync init failed:', e);
    }

    return () => {
      try { unHourly && unHourly(); } catch {}
      try { unBig && unBig(); } catch {}
    };
  }, []);

  return <>{children}</>;
}