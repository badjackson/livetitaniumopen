'use client';

import { ReactNode, createContext, useContext, useEffect } from 'react';

interface FirebaseContextType {
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

  return (
    <FirebaseContext.Provider value={{ 
      isOnline: typeof window !== 'undefined' ? navigator.onLine : true
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}