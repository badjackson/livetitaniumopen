'use client';

import { 
  CompetitorService, 
  HourlyDataService, 
  GrossePriseService, 
  JudgeService,
  UserService,
  CompetitionSettingsService,
  type CompetitorDoc,
  type HourlyDataDoc,
  type GrossePriseDoc,
  type JudgeDoc,
  type UserDoc,
  type CompetitionSettingsDoc
} from '@/lib/firestore';
import { serverTimestamp } from 'firebase/firestore';

// Migration utility to sync localStorage data to Firebase
export class DataMigrationService {
  // Migrate competitors from localStorage to Firebase
  static async migrateCompetitors() {
    if (typeof window === 'undefined') return;

    try {
      const localCompetitors = localStorage.getItem('competitors');
      if (!localCompetitors) return;

      const competitors = JSON.parse(localCompetitors);
      console.log('Migrating competitors to Firebase:', competitors.length);

      for (const comp of competitors) {
        const competitorDoc: Omit<CompetitorDoc, 'lastUpdate'> = {
          id: comp.id,
          sector: comp.sector,
          boxNumber: comp.boxNumber,
          boxCode: comp.boxCode,
          fullName: comp.fullName,
          equipe: comp.equipe,
          photo: comp.photo || '',
          source: 'Admin',
          status: comp.status || 'active'
        };

        await CompetitorService.saveCompetitor(competitorDoc);
      }

      console.log('✅ Competitors migration completed');
    } catch (error) {
      console.error('❌ Error migrating competitors:', error);
    }
  }

  // Migrate hourly data from localStorage to Firebase
  static async migrateHourlyData() {
    if (typeof window === 'undefined') return;

    try {
      const localHourlyData = localStorage.getItem('hourlyData');
      if (!localHourlyData) return;

      const hourlyData = JSON.parse(localHourlyData);
      console.log('Migrating hourly data to Firebase...');

      for (const sector of Object.keys(hourlyData)) {
        for (const hour of Object.keys(hourlyData[sector] || {})) {
          for (const competitorId of Object.keys(hourlyData[sector][hour] || {})) {
            const entry = hourlyData[sector][hour][competitorId];
            
            const hourlyDoc: Omit<HourlyDataDoc, 'lastUpdate'> = {
              id: `${sector}_${hour}_${competitorId}`,
              competitorId: entry.competitorId,
              sector: sector,
              hour: parseInt(hour),
              boxNumber: entry.boxNumber,
              fishCount: entry.fishCount,
              totalWeight: entry.totalWeight,
              status: entry.status,
              timestamp: entry.timestamp ? new Date(entry.timestamp) as any : serverTimestamp(),
              source: entry.source || 'Judge',
              syncRetries: entry.syncRetries || 0,
              errorMessage: entry.errorMessage
            };

            await HourlyDataService.saveHourlyEntry(hourlyDoc);
          }
        }
      }

      console.log('✅ Hourly data migration completed');
    } catch (error) {
      console.error('❌ Error migrating hourly data:', error);
    }
  }

  // Migrate grosse prise data from localStorage to Firebase
  static async migrateGrossePriseData() {
    if (typeof window === 'undefined') return;

    try {
      const localGrossePriseData = localStorage.getItem('grossePriseData');
      if (!localGrossePriseData) return;

      const grossePriseData = JSON.parse(localGrossePriseData);
      console.log('Migrating grosse prise data to Firebase...');

      for (const sector of Object.keys(grossePriseData)) {
        for (const competitorId of Object.keys(grossePriseData[sector] || {})) {
          const entry = grossePriseData[sector][competitorId];
          
          const grossePriseDoc: Omit<GrossePriseDoc, 'lastUpdate'> = {
            id: `${sector}_${competitorId}`,
            competitorId: entry.competitorId,
            sector: sector,
            boxNumber: entry.boxNumber,
            biggestCatch: entry.biggestCatch,
            status: entry.status,
            timestamp: entry.timestamp ? new Date(entry.timestamp) as any : serverTimestamp(),
            source: entry.source || 'Judge',
            syncRetries: entry.syncRetries || 0,
            errorMessage: entry.errorMessage
          };

          await GrossePriseService.saveGrossePriseEntry(grossePriseDoc);
        }
      }

      console.log('✅ Grosse prise data migration completed');
    } catch (error) {
      console.error('❌ Error migrating grosse prise data:', error);
    }
  }

  // Migrate judges from localStorage to Firebase
  static async migrateJudges() {
    if (typeof window === 'undefined') return;

    try {
      const localJudges = localStorage.getItem('judges');
      if (!localJudges) return;

      const judges = JSON.parse(localJudges);
      console.log('Migrating judges to Firebase:', judges.length);

      for (const judge of judges) {
        const judgeDoc: Omit<JudgeDoc, 'lastUpdate'> = {
          id: judge.id,
          fullName: judge.fullName,
          sector: judge.sector,
          username: judge.username,
          password: judge.password,
          lastLogin: judge.lastLogin ? new Date(judge.lastLogin) as any : undefined,
          status: judge.status || 'active'
        };

        await JudgeService.saveJudge(judgeDoc);
      }

      console.log('✅ Judges migration completed');
    } catch (error) {
      console.error('❌ Error migrating judges:', error);
    }
  }

  // Migrate users from localStorage to Firebase
  static async migrateUsers() {
    if (typeof window === 'undefined') return;

    try {
      const localUsers = localStorage.getItem('adminUsers');
      if (!localUsers) return;

      const users = JSON.parse(localUsers);
      console.log('Migrating users to Firebase:', users.length);

      for (const user of users) {
        const userDoc: Omit<UserDoc, 'lastUpdate'> = {
          id: user.id.toString(),
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status || 'active',
          password: user.password,
          lastLogin: user.lastLogin ? new Date(user.lastLogin) as any : undefined,
          createdAt: user.createdAt ? new Date(user.createdAt) as any : serverTimestamp()
        };

        await UserService.saveUser(userDoc);
      }

      console.log('✅ Users migration completed');
    } catch (error) {
      console.error('❌ Error migrating users:', error);
    }
  }

  // Migrate competition settings from localStorage to Firebase
  static async migrateCompetitionSettings() {
    if (typeof window === 'undefined') return;

    try {
      const localSettings = localStorage.getItem('competitionSettings');
      if (!localSettings) return;

      const settings = JSON.parse(localSettings);
      console.log('Migrating competition settings to Firebase...');

      const settingsDoc: Omit<CompetitionSettingsDoc, 'lastUpdate'> = {
        id: 'main',
        startDateTime: settings.startDateTime,
        endDateTime: settings.endDateTime,
        soundEnabled: settings.soundEnabled || true
      };

      await CompetitionSettingsService.saveSettings(settingsDoc);

      console.log('✅ Competition settings migration completed');
    } catch (error) {
      console.error('❌ Error migrating competition settings:', error);
    }
  }

  // Run full migration
  static async migrateAllData() {
    console.log('🚀 Starting data migration to Firebase...');
    
    await this.migrateCompetitors();
    await this.migrateJudges();
    await this.migrateUsers();
    await this.migrateCompetitionSettings();
    await this.migrateHourlyData();
    await this.migrateGrossePriseData();
    
    console.log('✅ All data migration completed!');
  }
}

// Offline sync utility
export class OfflineSyncService {
  private static OFFLINE_QUEUE_KEY = 'firebaseOfflineQueue';

  // Add operation to offline queue
  static addToOfflineQueue(operation: {
    type: 'create' | 'update' | 'delete';
    collection: string;
    docId: string;
    data?: any;
    timestamp: number;
  }) {
    if (typeof window === 'undefined') return;

    try {
      const queue = JSON.parse(localStorage.getItem(this.OFFLINE_QUEUE_KEY) || '[]');
      queue.push(operation);
      localStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding to offline queue:', error);
    }
  }

  // Process offline queue when back online
  static async processOfflineQueue() {
    if (typeof window === 'undefined') return;

    try {
      const queue = JSON.parse(localStorage.getItem(this.OFFLINE_QUEUE_KEY) || '[]');
      if (queue.length === 0) return;

      console.log(`Processing ${queue.length} offline operations...`);

      for (const operation of queue) {
        try {
          switch (operation.type) {
            case 'create':
            case 'update':
              await FirestoreService.setDocument(operation.collection, operation.docId, operation.data);
              break;
            case 'delete':
              await FirestoreService.deleteDocument(operation.collection, operation.docId);
              break;
          }
        } catch (error) {
          console.error('Error processing offline operation:', error);
          // Keep failed operations in queue for retry
          continue;
        }
      }

      // Clear processed queue
      localStorage.removeItem(this.OFFLINE_QUEUE_KEY);
      console.log('✅ Offline queue processed successfully');
    } catch (error) {
      console.error('❌ Error processing offline queue:', error);
    }
  }

  // Check if device is online and process queue
  static setupOfflineSync() {
    if (typeof window === 'undefined') return;

    // Process queue when coming back online
    const handleOnline = () => {
      console.log('🌐 Back online - processing offline queue...');
      this.processOfflineQueue();
    };

    window.addEventListener('online', handleOnline);

    // Process queue on initial load if online
    if (navigator.onLine) {
      this.processOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }
}