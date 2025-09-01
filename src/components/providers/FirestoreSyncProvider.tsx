'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types
export interface CompetitorDoc {
  id: string;
  sector: string;
  boxNumber: number;
  boxCode: string;
  fullName: string;
  equipe: string;
  photo: string;
  status: 'active' | 'inactive';
  nbPrisesGlobal?: number;
  poidsTotal?: number;
  grossePrise?: number;
  points?: number;
  coefficientSecteur?: number;
  classementSecteur?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface HourlyEntryDoc {
  id: string;
  sector: string;
  competitorId: string;
  boxNumber: number;
  hour: number;
  fishCount: number;
  totalWeight: number;
  status: 'empty' | 'in_progress' | 'locked_judge' | 'locked_admin' | 'offline_judge' | 'offline_admin' | 'error';
  source: 'Judge' | 'Admin';
  updatedBy?: string;
  timestamp?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface BigCatchDoc {
  id: string;
  sector: string;
  competitorId: string;
  boxNumber: number;
  biggestCatch: number;
  status: 'empty' | 'in_progress' | 'locked_judge' | 'locked_admin' | 'offline_judge' | 'offline_admin' | 'error';
  source: 'Judge' | 'Admin';
  updatedBy?: string;
  timestamp?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface JudgeDoc {
  uid: string;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'judge';
  sector: string | null;
  status: 'active' | 'inactive';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CompetitionSettingsDoc {
  id: string;
  startDateTime: string;
  endDateTime: string;
  status: 'upcoming' | 'active' | 'completed';
  currentHour: number;
  updatedAt?: Timestamp;
}

export interface PublicAppearanceSettingsDoc {
  id: string;
  logos: {
    light: string;
    dark: string;
  };
  sponsors: Array<{
    id: string;
    name: string;
    logo: string;
    tier: 'title' | 'gold' | 'silver' | 'bronze';
  }>;
  socialLinks: {
    youtube: string;
    facebook: string;
    instagram: string;
    website: string;
  };
  footerText: string;
  streamDescription: string;
  streamUrl: string;
  updatedAt?: Timestamp;
}

export interface AuditLogDoc {
  id: string;
  action: string;
  details: string;
  userId?: string;
  username?: string;
  metadata?: any;
  timestamp: Timestamp;
}

// Context type
export interface FirestoreContextType {
  competitors: CompetitorDoc[];
  hourlyEntries: HourlyEntryDoc[];
  bigCatches: BigCatchDoc[];
  judges: JudgeDoc[];
  competitionSettings: CompetitionSettingsDoc | null;
  publicAppearanceSettings: PublicAppearanceSettingsDoc | null;
  auditLogs: AuditLogDoc[];
  saveCompetitor: (data: Omit<CompetitorDoc, 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteCompetitor: (id: string) => Promise<void>;
  saveHourlyEntry: (data: Omit<HourlyEntryDoc, 'createdAt' | 'updatedAt'>) => Promise<void>;
  saveBigCatch: (data: Omit<BigCatchDoc, 'createdAt' | 'updatedAt'>) => Promise<void>;
  saveJudge: (data: Omit<JudgeDoc, 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteJudge: (uid: string) => Promise<void>;
  saveCompetitionSettings: (data: Omit<CompetitionSettingsDoc, 'updatedAt'>) => Promise<void>;
  savePublicAppearanceSettings: (data: Omit<PublicAppearanceSettingsDoc, 'updatedAt'>) => Promise<void>;
  auditLog: (data: Omit<AuditLogDoc, 'id' | 'timestamp'>) => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Create context
const FirestoreContext = createContext<FirestoreContextType | undefined>(undefined);

// Provider component
export function FirestoreSyncProvider({ children }: { children: React.ReactNode }) {
  const [competitors, setCompetitors] = useState<CompetitorDoc[]>([]);
  const [hourlyEntries, setHourlyEntries] = useState<HourlyEntryDoc[]>([]);
  const [bigCatches, setBigCatches] = useState<BigCatchDoc[]>([]);
  const [judges, setJudges] = useState<JudgeDoc[]>([]);
  const [competitionSettings, setCompetitionSettings] = useState<CompetitionSettingsDoc | null>(null);
  const [publicAppearanceSettings, setPublicAppearanceSettings] = useState<PublicAppearanceSettingsDoc | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    try {
      // Subscribe to competitors
      const competitorsQuery = query(
        collection(db, 'competitors'),
        orderBy('boxNumber', 'asc')
      );
      
      const unsubCompetitors = onSnapshot(
        competitorsQuery,
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as CompetitorDoc));
          setCompetitors(data);
        },
        (error) => {
          console.error('Error fetching competitors:', error);
          setError(error.message);
        }
      );
      unsubscribers.push(unsubCompetitors);

      // Subscribe to hourly entries
      const hourlyQuery = query(
        collection(db, 'hourly_entries'),
        orderBy('hour', 'asc')
      );
      
      const unsubHourly = onSnapshot(
        hourlyQuery,
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as HourlyEntryDoc));
          setHourlyEntries(data);
        },
        (error) => {
          console.error('Error fetching hourly entries:', error);
          setError(error.message);
        }
      );
      unsubscribers.push(unsubHourly);

      // Subscribe to big catches
      const bigCatchesQuery = query(
        collection(db, 'big_catches'),
        orderBy('biggestCatch', 'desc')
      );
      
      const unsubBigCatches = onSnapshot(
        bigCatchesQuery,
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as BigCatchDoc));
          setBigCatches(data);
        },
        (error) => {
          console.error('Error fetching big catches:', error);
          setError(error.message);
        }
      );
      unsubscribers.push(unsubBigCatches);

      // Subscribe to judges
      const judgesQuery = query(
        collection(db, 'judges'),
        orderBy('name', 'asc')
      );
      
      const unsubJudges = onSnapshot(
        judgesQuery,
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
          } as JudgeDoc));
          setJudges(data);
        },
        (error) => {
          console.error('Error fetching judges:', error);
          setError(error.message);
        }
      );
      unsubscribers.push(unsubJudges);

      // Subscribe to competition settings
      const unsubSettings = onSnapshot(
        doc(db, 'settings', 'competition'),
        (snapshot) => {
          if (snapshot.exists()) {
            setCompetitionSettings({
              id: snapshot.id,
              ...snapshot.data()
            } as CompetitionSettingsDoc);
          }
        },
        (error) => {
          console.error('Error fetching competition settings:', error);
          setError(error.message);
        }
      );
      unsubscribers.push(unsubSettings);

      // Subscribe to public appearance settings
      const unsubAppearance = onSnapshot(
        doc(db, 'settings', 'public_appearance'),
        (snapshot) => {
          if (snapshot.exists()) {
            setPublicAppearanceSettings({
              id: snapshot.id,
              ...snapshot.data()
            } as PublicAppearanceSettingsDoc);
          }
        },
        (error) => {
          console.error('Error fetching public appearance settings:', error);
          setError(error.message);
        }
      );
      unsubscribers.push(unsubAppearance);

      // Subscribe to audit logs
      const auditQuery = query(
        collection(db, 'audit_logs'),
        orderBy('timestamp', 'desc')
      );
      
      const unsubAudit = onSnapshot(
        auditQuery,
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as AuditLogDoc));
          setAuditLogs(data);
        },
        (error) => {
          console.error('Error fetching audit logs:', error);
          setError(error.message);
        }
      );
      unsubscribers.push(unsubAudit);

      setLoading(false);
    } catch (err) {
      console.error('Error setting up Firestore subscriptions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }

    // Cleanup
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // Save functions
  const saveCompetitor = async (data: Omit<CompetitorDoc, 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = doc(db, 'competitors', data.id);
      await setDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (err) {
      console.error('Error saving competitor:', err);
      throw err;
    }
  };

  const deleteCompetitor = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'competitors', id));
    } catch (err) {
      console.error('Error deleting competitor:', err);
      throw err;
    }
  };

  const saveHourlyEntry = async (data: Omit<HourlyEntryDoc, 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = doc(db, 'hourly_entries', data.id);
      await setDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (err) {
      console.error('Error saving hourly entry:', err);
      throw err;
    }
  };

  const saveBigCatch = async (data: Omit<BigCatchDoc, 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = doc(db, 'big_catches', data.id);
      await setDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (err) {
      console.error('Error saving big catch:', err);
      throw err;
    }
  };

  const saveJudge = async (data: Omit<JudgeDoc, 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = doc(db, 'judges', data.uid);
      await setDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (err) {
      console.error('Error saving judge:', err);
      throw err;
    }
  };

  const deleteJudge = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'judges', uid));
    } catch (err) {
      console.error('Error deleting judge:', err);
      throw err;
    }
  };

  const saveCompetitionSettings = async (data: Omit<CompetitionSettingsDoc, 'updatedAt'>) => {
    try {
      const docRef = doc(db, 'settings', 'competition');
      await setDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (err) {
      console.error('Error saving competition settings:', err);
      throw err;
    }
  };

  const savePublicAppearanceSettings = async (data: Omit<PublicAppearanceSettingsDoc, 'updatedAt'>) => {
    try {
      const docRef = doc(db, 'settings', 'public_appearance');
      await setDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (err) {
      console.error('Error saving public appearance settings:', err);
      throw err;
    }
  };

  const auditLog = async (data: Omit<AuditLogDoc, 'id' | 'timestamp'>) => {
    try {
      const docRef = doc(collection(db, 'audit_logs'));
      await setDoc(docRef, {
        ...data,
        timestamp: Timestamp.now()
      });
    } catch (err) {
      console.error('Error saving audit log:', err);
      throw err;
    }
  };

  const value: FirestoreContextType = {
    competitors,
    hourlyEntries,
    bigCatches,
    judges,
    competitionSettings,
    publicAppearanceSettings,
    auditLogs,
    saveCompetitor,
    deleteCompetitor,
    saveHourlyEntry,
    saveBigCatch,
    saveJudge,
    deleteJudge,
    saveCompetitionSettings,
    savePublicAppearanceSettings,
    auditLog,
    loading,
    error
  };

  return (
    <FirestoreContext.Provider value={value}>
      {children}
    </FirestoreContext.Provider>
  );
}

// Custom hook - CRITICAL: This export is required!
export function useFirestore() {
  const context = useContext(FirestoreContext);
  if (context === undefined) {
    throw new Error('useFirestore must be used within a FirestoreSyncProvider');
  }
  return context;
}

// Export the context for advanced usage
export { FirestoreContext };