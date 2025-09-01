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
  where,
  getDocs,
  updateDoc,
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
  // Champs calculés
  nbPrisesGlobal?: number;       // Somme fishCount H1-H7
   poidsTotalGlobal?: number;     // Somme totalWeight H1-H7
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
biggestCatch: number;
  boxNumber: number;
  grossePrise: number;
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
  saveCompetitor: (data: Omit<CompetitorDoc, 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteCompetitor: (id: string) => Promise<void>;
  saveHourlyEntry: (data: Omit<HourlyEntryDoc, 'createdAt' | 'updatedAt'>) => Promise<void>;
  saveBigCatch: (data: Omit<any, 'createdAt' | 'updatedAt'>) => Promise<void>;
  saveJudge: (data: Omit<JudgeDoc, 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteJudge: (uid: string) => Promise<void>;
  saveCompetitionSettings: (data: Omit<CompetitionSettingsDoc, 'updatedAt'>) => Promise<void>;
  savePublicAppearanceSettings: (data: Omit<PublicAppearanceSettingsDoc, 'updatedAt'>) => Promise<void>;
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
          console.log('Hourly entries loaded from Firebase:', data.length);
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
          console.log('Big catches loaded from Firebase:', data.length);
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
        doc(db, 'competitionSettings', 'main'),
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
        doc(db, 'publicAppearanceSettings', 'main'),
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
      console.log('Saving hourly entry to Firebase:', data);
      const docRef = doc(db, 'hourly_entries', data.id);
      await setDoc(docRef, {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true });
      console.log('Hourly entry saved successfully to Firebase');
      
      // Auto-calculate competitor totals after saving hourly entry
      await recalculateCompetitorTotals(data.competitorId);
    } catch (err) {
      console.error('Error saving hourly entry:', err);
      throw err;
    }
  };

  const saveBigCatch = async (data: Omit<any, 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Saving big catch to Firebase:', data);
      const docRef = doc(db, 'big_catches', data.id);
      await setDoc(docRef, {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true });
      console.log('Big catch saved successfully to Firebase');
      
      // Auto-calculate competitor totals after saving big catch
      await recalculateCompetitorTotals(data.competitorId);
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
      const docRef = doc(db, 'competitionSettings', 'main');
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
      const docRef = doc(db, 'publicAppearanceSettings', 'main');
      await setDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (err) {
      console.error('Error saving public appearance settings:', err);
      throw err;
    }
  };

  // Auto-calculation function
  const recalculateCompetitorTotals = async (competitorId: string) => {
    try {
      // Get competitor info first
      const competitorDoc = competitors.find(c => c.id === competitorId);
      if (!competitorDoc) return;
      
      const sector = competitorDoc.sector;
      
      // Get all hourly entries for this competitor
      const hourlyEntriesSnapshot = await getDocs(
        query(collection(db, 'hourly_entries'), where('competitorId', '==', competitorId))
      );
      
      // Calculate totals
      let nbPrisesGlobal = 0;
      let poidsTotalGlobal = 0;
      
      hourlyEntriesSnapshot.docs.forEach(doc => {
        const entry = doc.data();
        if (['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status)) {
          nbPrisesGlobal += entry.fishCount || 0;
          poidsTotalGlobal += entry.totalWeight || 0;
        }
      });
      
      // Get grosse prise
      const bigCatchSnapshot = await getDocs(
        query(collection(db, 'big_catches'), where('competitorId', '==', competitorId))
      );
      
      let grossePrise = 0;
      if (!bigCatchSnapshot.empty) {
        const bigCatchData = bigCatchSnapshot.docs[0].data();
        if (['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(bigCatchData.status)) {
          grossePrise = bigCatchData.grossePrise || 0;
        }
      }
      
      // Calculate points
      const points = (nbPrisesGlobal * 50) + poidsTotalGlobal;
      
      // Calculate coefficientSecteur
      // First, get all competitors in the same sector to calculate sector total
      const sectorCompetitorsSnapshot = await getDocs(
        query(collection(db, 'competitors'), where('sector', '==', sector))
      );
      
      let sectorTotalNbPrises = 0;
      
      // Calculate sector total from all competitors in this sector
      for (const sectorCompDoc of sectorCompetitorsSnapshot.docs) {
        const sectorCompId = sectorCompDoc.id;
        
        // Get hourly entries for this sector competitor
        const sectorHourlySnapshot = await getDocs(
          query(collection(db, 'hourly_entries'), where('competitorId', '==', sectorCompId))
        );
        
        let compNbPrises = 0;
        sectorHourlySnapshot.docs.forEach(doc => {
          const entry = doc.data();
          if (['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status)) {
            compNbPrises += entry.fishCount || 0;
          }
        });
        
        sectorTotalNbPrises += compNbPrises;
      }
      
      // Calculate coefficient: (Points × Nb Prises global) / Total Nb Prises global Secteur
      let coefficientSecteur = 0;
      if (sectorTotalNbPrises > 0) {
        coefficientSecteur = (points * nbPrisesGlobal) / sectorTotalNbPrises;
      }
      
      // Update competitor document with coefficient
      await updateDoc(doc(db, 'competitors', competitorId), {
        nbPrisesGlobal,
        poidsTotalGlobal,
        grossePrise,
        points,
        coefficientSecteur,
        updatedAt: Timestamp.now()
      });
      
      console.log(`Auto-calculated totals for ${competitorId}:`, {
        nbPrisesGlobal,
        poidsTotalGlobal,
        grossePrise,
        points,
        coefficientSecteur
      });
      
      // Also recalculate coefficients for all other competitors in the same sector
      // since the sector total has changed
      setTimeout(async () => {
        try {
          for (const sectorCompDoc of sectorCompetitorsSnapshot.docs) {
            const otherCompId = sectorCompDoc.id;
            if (otherCompId !== competitorId) {
              await recalculateCompetitorCoefficient(otherCompId, sector, sectorTotalNbPrises);
            }
          }
        } catch (error) {
          console.error('Error recalculating sector coefficients:', error);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error auto-calculating competitor totals:', error);
    }
  };

  // Helper function to recalculate coefficient for a specific competitor
  const recalculateCompetitorCoefficient = async (competitorId: string, sector: string, sectorTotalNbPrises: number) => {
    try {
      // Get competitor's current data
      const competitorSnapshot = await getDocs(
        query(collection(db, 'competitors'), where('__name__', '==', competitorId))
      );
      
      if (competitorSnapshot.empty) return;
      
      const competitorData = competitorSnapshot.docs[0].data();
      const points = competitorData.points || 0;
      const nbPrisesGlobal = competitorData.nbPrisesGlobal || 0;
      
      // Calculate new coefficient
      let coefficientSecteur = 0;
      if (sectorTotalNbPrises > 0) {
        coefficientSecteur = (points * nbPrisesGlobal) / sectorTotalNbPrises;
      }
      
      // Update only the coefficient
      await updateDoc(doc(db, 'competitors', competitorId), {
        coefficientSecteur,
        updatedAt: Timestamp.now()
      });
      
      console.log(`Updated coefficient for ${competitorId}: ${coefficientSecteur}`);
    } catch (error) {
      console.error(`Error updating coefficient for ${competitorId}:`, error);
    }
  };

  const value: FirestoreContextType = {
    competitors,
    hourlyEntries,
    bigCatches,
    judges,
    competitionSettings,
    publicAppearanceSettings,
    saveCompetitor,
    deleteCompetitor,
    saveHourlyEntry,
    saveBigCatch,
    saveJudge,
    deleteJudge,
    saveCompetitionSettings,
    savePublicAppearanceSettings,
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