'use client';

import { ReactNode, createContext, useContext, useEffect } from 'react';
import { DataMigrationService, OfflineSyncService } from '@/lib/dataSync';

interface FirebaseContextType {
  migrateData: () => Promise<void>;
  isOnline: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

interface Props {
  children: ReactNode;
}

export function FirebaseProvider({ children }: Props) {
  const migrateData = async () => {
    await DataMigrationService.migrateAllData();
  };

  useEffect(() => {
    // Setup offline sync
    const cleanup = OfflineSyncService.setupOfflineSync();
    
    return cleanup;
  }, []);

  return (
    <FirebaseContext.Provider value={{ 
      migrateData,
      isOnline: typeof window !== 'undefined' ? navigator.onLine : true
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}