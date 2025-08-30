'use client';

import { useState, useEffect } from 'react';
import { logoutFromFirebase } from '@/lib/auth';

interface UserSession {
  id: number;
  name: string;
  username: string;
  role: 'admin' | 'judge';
  sector?: string | null;
  loginTime: string;
}

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCurrentUser = () => {
      if (typeof window !== 'undefined') {
        try {
          // Try localStorage first
          const sessionData = localStorage.getItem('currentUserSession');
          if (sessionData) {
            const user = JSON.parse(sessionData);
            setCurrentUser(user);
          } else {
            // Try sessionStorage as backup
            const sessionBackup = sessionStorage.getItem('currentUserSessionBackup');
            if (sessionBackup) {
              const user = JSON.parse(sessionBackup);
              setCurrentUser(user);
              // Restore to localStorage
              localStorage.setItem('currentUserSession', sessionBackup);
            }
          }
        } catch (error) {
          console.error('Error loading current user session:', error);
        }
      }
      setIsLoading(false);
    };

    loadCurrentUser();

    // Listen for session changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUserSession') {
        if (e.newValue) {
          try {
            const user = JSON.parse(e.newValue);
            setCurrentUser(user);
          } catch (error) {
            console.error('Error parsing user session:', error);
          }
        } else {
          setCurrentUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = () => {
    logoutFromFirebase();
    setCurrentUser(null);
  };

  return {
    currentUser,
    isLoading,
    logout,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'admin',
    isJudge: currentUser?.role === 'judge',
    assignedSector: currentUser?.sector
  };
}