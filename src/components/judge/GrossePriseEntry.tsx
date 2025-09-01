'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from '@/components/providers/TranslationProvider';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { 
  Save, 
  Check, 
  Trophy, 
  Scale, 
  Users, 
  Wifi, 
  WifiOff, 
  Loader2, 
  X, 
  RefreshCw, 
  MapPin, 
  Info,
  Edit,
  Lock,
  CloudOff,
  AlertTriangle,
  Search,
  Filter,
  SkipForward,
  Plus,
  Minus,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatWeight, formatNumber, formatTime } from '@/lib/utils';
import { upsertBigCatch } from '@/lib/firestore-entries';

interface Competitor {
  id: string;
  boxNumber: number;
  boxCode: string;
  name: string;
  equipe: string;
  sector: string;
}

interface GrossePriseEntry {
  competitorId: string;
  boxNumber: number;
  biggestCatch: number;
  status: 'empty' | 'in_progress' | 'locked_judge' | 'locked_admin' | 'offline_judge' | 'offline_admin' | 'error';
  timestamp?: Date;
  syncRetries?: number;
  errorMessage?: string;
}

// Mock competitors data - Sector A (20 competitors)
const getCompetitorsForSector = (sector: string): Competitor[] => {
  if (typeof window !== 'undefined') {
    try {
      const savedCompetitors = localStorage.getItem('competitors');
      if (savedCompetitors) {
        const allCompetitors = JSON.parse(savedCompetitors);
        return allCompetitors
          .filter((comp: any) => comp.sector === sector)
          .map((comp: any) => ({
            id: comp.id,
            boxNumber: comp.boxNumber,
            boxCode: comp.boxCode,
            name: comp.fullName,
            equipe: comp.equipe,
            sector: comp.sector
          }));
      }
      
    } catch (error) {
      console.error('Error loading competitors:', error);
    }
  }
  
  // Fallback - empty array
  return [];
};

export default function GrossePriseEntry() {
  const t = useTranslations('judge');
  const { currentUser } = useCurrentUser();
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  
  const [entries, setEntries] = useState<{ [competitorId: string]: GrossePriseEntry }>({});

  // Editor state
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string | null>(null);
  const [biggestCatch, setBiggestCatch] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isOnlineSimulation, setIsOnlineSimulation] = useState(true);

  // Get judge's assigned sector
  const judgeSector = currentUser?.sector;

  // Dynamic competitors based on judge's assigned sector
  const [mockCompetitors, setMockCompetitors] = useState<Competitor[]>([]);
  
  // Load competitors on mount and listen for changes
  useEffect(() => {
    const loadCompetitors = () => {
      if (!judgeSector) return;
      const competitors = getCompetitorsForSector(judgeSector);
      setMockCompetitors(competitors);
    };
    
    loadCompetitors();
    
    // Listen for storage changes for live updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'competitors') {
        loadCompetitors();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [judgeSector]);

  // Load persisted data on mount
  useEffect(() => {
    const loadPersistedData = () => {
      if (!judgeSector) return;
      if (typeof window !== 'undefined') {
        try {
          // Try to load from localStorage first
          const allGrossePriseData = JSON.parse(localStorage.getItem('grossePriseData') || '{}');
          
          // If localStorage is empty, try sessionStorage backup
          let dataToUse = allGrossePriseData;
          if (Object.keys(allGrossePriseData).length === 0) {
            const backupData = sessionStorage.getItem('grossePriseDataBackup');
            if (backupData) {
              dataToUse = JSON.parse(backupData);
              // Restore to localStorage
              localStorage.setItem('grossePriseData', JSON.stringify(dataToUse));
            }
          }
          
          const sectorData = allGrossePriseData[judgeSector] || {};
          
          // Check for individual entry backups if main data is missing
          if (Object.keys(sectorData).length === 0) {
            mockCompetitors.forEach(comp => {
              const entryKey = `grossePrise_${judgeSector}_${comp.id}`;
              const savedEntry = localStorage.getItem(entryKey);
              if (savedEntry) {
                try {
                  sectorData[comp.id] = JSON.parse(savedEntry);
                } catch (error) {
                  console.error('Error parsing individual grosse prise entry:', error);
                }
              }
            });
          }
          
          const processedEntries: { [key: string]: GrossePriseEntry } = {};
          Object.entries(sectorData).forEach(([competitorId, entry]: [string, any]) => {
            processedEntries[competitorId] = {
              ...entry,
              timestamp: entry.timestamp ? new Date(entry.timestamp) : undefined
            };
          });
          
          setEntries(processedEntries);
        } catch (error) {
          console.error('Failed to load persisted grosse prise data:', error);
          
          // Try to recover from sessionStorage
          try {
            const fallbackData = sessionStorage.getItem('grossePriseDataBackup');
            if (fallbackData) {
              const parsedData = JSON.parse(fallbackData);
              localStorage.setItem('grossePriseData', fallbackData);
              // Reload with recovered data
              loadPersistedData();
            }
          } catch (recoveryError) {
            console.error('Failed to recover grosse prise from backup:', recoveryError);
          }
        }
      }
    };
    
    // Load persisted data after competitors are loaded
    if (mockCompetitors.length > 0) {
      loadPersistedData();
    }
  }, [mockCompetitors, judgeSector]);

  // Listen for real-time updates from Admin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'grossePriseData') {
          if (!e.newValue || e.newValue === 'null') {
            // Data was reset - clear all entries
            setEntries({});
            setSelectedCompetitorId(null);
            setBiggestCatch('');
            setErrors({});
            
            // Show reset notification
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg text-sm z-50 shadow-lg';
            notification.textContent = 'Données de grosse prise réinitialisées par l\'admin';
            document.body.appendChild(notification);
            
            setTimeout(() => {
              if (document.body.contains(notification)) {
                document.body.removeChild(notification);
              }
            }, 5000);
            
            return;
          }
          
          try {
            const allGrossePriseData = JSON.parse(e.newValue);
            const sectorData = allGrossePriseData[judgeSector] || {};
            
            const processedEntries: { [key: string]: GrossePriseEntry } = {};
            Object.entries(sectorData).forEach(([competitorId, entry]: [string, any]) => {
              processedEntries[competitorId] = {
                ...entry,
                timestamp: entry.timestamp ? new Date(entry.timestamp) : undefined
              };
            });
            
            setEntries(processedEntries);
          } catch (error) {
            console.error('Failed to sync real-time grosse prise data:', error);
          }
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [judgeSector]);

  // Get selected competitor and entry
  const selectedCompetitor = selectedCompetitorId 
    ? mockCompetitors.find(c => c.id === selectedCompetitorId)
    : null;
  
  const selectedEntry = selectedCompetitorId 
    ? entries[selectedCompetitorId]
    : null;

  // Filter competitors based on search and incomplete filter
  const filteredCompetitors = useMemo(() => {
    if (!judgeSector) return [];
    let filtered = mockCompetitors;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(comp => 
        comp.name.toLowerCase().includes(query) ||
        comp.equipe.toLowerCase().includes(query) ||
        comp.boxCode.toLowerCase().includes(query)
      );
    }
    
    if (showIncompleteOnly) {
      filtered = filtered.filter(comp => {
        const entry = entries[comp.id];
        return !entry || !['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status);
      });
    }
    
    return filtered;
  }, [mockCompetitors, searchQuery, showIncompleteOnly, entries]);

  // Online/offline detection
  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);
    setIsOnlineSimulation(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Auto-sync when coming back online
    const handleOnlineSync = () => {
      setIsOnline(true);
      setIsOnlineSimulation(true);
      
      // Try to sync any offline entries
      if (typeof window !== 'undefined') {
        try {
          const allGrossePriseData = JSON.parse(localStorage.getItem('grossePriseData') || '{}');
          const sectorData = allGrossePriseData[judgeSector] || {};
          
          // Update any offline entries to online status
          Object.keys(sectorData).forEach(competitorId => {
            const entry = sectorData[competitorId];
            if (entry.status === 'offline_judge') {
              entry.status = 'locked_judge';
              entry.timestamp = new Date();
            }
          });
          
          if (Object.keys(sectorData).length > 0) {
            allGrossePriseData[judgeSector] = sectorData;
            localStorage.setItem('grossePriseData', JSON.stringify(allGrossePriseData));
            
            // Trigger update
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'grossePriseData',
              newValue: JSON.stringify(allGrossePriseData)
            }));
          }
        } catch (error) {
          console.error('Error syncing offline grosse prise entries:', error);
        }
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnlineSync);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnlineSync);
    };
  }, [judgeSector]);

  // Load entry data when competitor is selected
  useEffect(() => {
    if (selectedCompetitorId) {
      const entry = entries[selectedCompetitorId];
      if (entry && entry.status !== 'empty') {
        setBiggestCatch(entry.biggestCatch.toString());
      } else {
        setBiggestCatch('');
      }
      setErrors({});
    }
  }, [selectedCompetitorId, entries]);

  // Get entry status for competitor
  const getEntryStatus = (competitorId: string): GrossePriseEntry['status'] => {
    const entry = entries[competitorId];
    return entry?.status || 'empty';
  };

  // Get action icon and tooltip
  const getActionIcon = (status: GrossePriseEntry['status']) => {
    switch (status) {
      case 'locked_judge':
        return { icon: Lock, tooltip: 'Verrouillé (Juge) - lecture seule', color: 'text-green-600' };
      case 'locked_admin':
        return { icon: Lock, tooltip: 'Verrouillé (Admin) - lecture seule', color: 'text-orange-600' };
      case 'offline_judge':
      case 'offline_admin':
        return { icon: CloudOff, tooltip: 'Hors ligne (en attente)', color: 'text-amber-600' };
      case 'error':
        return { icon: AlertTriangle, tooltip: 'Corriger et sauvegarder', color: 'text-red-600' };
      case 'in_progress':
        return { icon: Edit, tooltip: 'Continuer', color: 'text-blue-600' };
      default:
        return { icon: Edit, tooltip: 'Saisir la grosse prise', color: 'text-gray-600' };
    }
  };

  // Get row styling based on status
  const getRowStyling = (status: GrossePriseEntry['status']) => {
    switch (status) {
      case 'locked_judge':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'locked_admin':
        return 'bg-orange-50 dark:bg-orange-900/20';
      case 'offline_judge':
      case 'offline_admin':
        return 'bg-amber-50 dark:bg-amber-900/20';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'in_progress':
        return 'bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'hover:bg-gray-50 dark:hover:bg-gray-800';
    }
  };

  // Get border styling based on status
  const getBorderStyling = (status: GrossePriseEntry['status']) => {
    switch (status) {
      case 'locked_judge':
        return 'border-l-4 border-green-500';
      case 'locked_admin':
        return 'border-l-4 border-orange-500';
      case 'offline_judge':
      case 'offline_admin':
        return 'border-l-4 border-amber-500';
      case 'error':
        return 'border-l-4 border-red-500';
      case 'in_progress':
        return 'border-l-4 border-blue-500';
      default:
        return '';
    }
  };

  // Get status badge
  const getStatusBadge = (status: GrossePriseEntry['status']) => {
    switch (status) {
      case 'locked_judge':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Verrouillé (Juge)</Badge>;
      case 'locked_admin':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">Verrouillé (Admin)</Badge>;
      case 'offline_judge':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">Hors ligne (Juge)</Badge>;
      case 'offline_admin':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">Hors ligne (Admin)</Badge>;
      case 'error':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">Erreur</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">En cours</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">Vide</Badge>;
    }
  };

  // Handle row selection
  const handleRowSelect = (competitorId: string) => {
    const entry = entries[competitorId];
    // Don't allow selection of locked entries
    if (entry && ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status)) {
      return;
    }
    setSelectedCompetitorId(competitorId);
    setIsEditorCollapsed(false);
  };

  // Find next missing entry
  const findNextMissing = () => {
    // Sort competitors by box number to ensure proper order
    const sortedCompetitors = [...mockCompetitors].sort((a, b) => a.boxNumber - b.boxNumber);
    const nextMissing = sortedCompetitors.find(comp => {
      const entry = entries[comp.id];
      return !entry || !['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status);
    });
    
    if (nextMissing) {
      setSelectedCompetitorId(nextMissing.id);
      setIsEditorCollapsed(false);
    }
  };

  // Validation
  const validateEntry = () => {
    const newErrors: { [key: string]: string } = {};

    if (!biggestCatch.trim()) {
      newErrors.biggestCatch = 'Grosse prise requise';
    } else if (parseInt(biggestCatch) < 0) {
      newErrors.biggestCatch = 'La grosse prise doit être ≥ 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save entry
  const handleSaveEntry = async (saveAndNext = false) => {
    if (!validateEntry() || !selectedCompetitor) return;

    setIsSaving(true);

    const entry: GrossePriseEntry = {
      competitorId: selectedCompetitor.id,
      boxNumber: selectedCompetitor.boxNumber,
      biggestCatch: parseInt(biggestCatch),
      status: isOnlineSimulation ? 'locked_judge' : 'offline_judge',
      timestamp: new Date(),
      syncRetries: 0,
    };

    // Update state immediately
    setEntries(prev => ({
      ...prev,
      [selectedCompetitor.id]: entry
    }));

    // Store in localStorage for offline support
    const updateLocalStorage = (competitorId: string, entry: GrossePriseEntry) => {
      if (typeof window !== 'undefined') {
        try {
          const allGrossePriseData = JSON.parse(localStorage.getItem('grossePriseData') || '{}');
          if (!allGrossePriseData[judgeSector]) {
            allGrossePriseData[judgeSector] = {};
          }
          allGrossePriseData[judgeSector][competitorId] = entry;
          localStorage.setItem('grossePriseData', JSON.stringify(allGrossePriseData));
          
          // Trigger storage event for real-time updates
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'grossePriseData',
            newValue: JSON.stringify(allGrossePriseData)
          }));
          
          // Create backup in sessionStorage for extra safety
          sessionStorage.setItem('grossePriseDataBackup', JSON.stringify(allGrossePriseData));
          
          // Also store individual entry for recovery
          const entryKey = `grossePrise_${judgeSector}_${competitorId}`;
          localStorage.setItem(entryKey, JSON.stringify(entry));
        } catch (error) {
          console.error('Failed to save grosse prise data to localStorage:', error);
          
          // Fallback: try to save in sessionStorage
          try {
            const fallbackKey = `fallback_grossePrise_${judgeSector}_${competitorId}`;
            sessionStorage.setItem(fallbackKey, JSON.stringify(entry));
          } catch (fallbackError) {
            console.error('Failed to store grosse prise entry in sessionStorage:', fallbackError);
          }
        }
      }
    };

    updateLocalStorage(selectedCompetitor.id, entry);

    // Save to Firebase
    try {
      await upsertBigCatch({
        sector: judgeSector,
        competitorId: selectedCompetitor.id,
        boxNumber: selectedCompetitor.boxNumber,
        biggestCatch: parseInt(biggestCatch),
        status: isOnlineSimulation ? 'locked_judge' : 'offline_judge',
        source: 'Judge',
        updatedBy: currentUser?.username || 'judge',
      });
    } catch (error) {
      console.error('Error saving to Firebase:', error);
    }

    setTimeout(() => {
      setIsSaving(false);
      
      if (saveAndNext) {
        // Find next incomplete competitor by box order
        const sortedCompetitors = [...mockCompetitors].sort((a, b) => a.boxNumber - b.boxNumber);
        const updatedEntries = {...entries, [selectedCompetitor.id]: entry};
        const nextCompetitor = sortedCompetitors.find(comp => {
          const compEntry = updatedEntries[comp.id];
          return !compEntry || !['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(compEntry.status);
        });
        
        // Clear form first
        setBiggestCatch('');
        setErrors({});
        
        if (nextCompetitor) {
          // Move to next incomplete competitor
          setSelectedCompetitorId(nextCompetitor.id);
          
          // Scroll to and highlight the row
          setTimeout(() => {
            const rowElement = document.querySelector(`[data-competitor-id="${nextCompetitor.id}"]`);
            if (rowElement) {
              rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              rowElement.classList.add('ring-2', 'ring-blue-500');
              setTimeout(() => {
                rowElement.classList.remove('ring-2', 'ring-blue-500');
              }, 1000);
            }
          }, 100);
          
          // Focus the biggest catch input
          setTimeout(() => {
            const biggestCatchInput = document.querySelector('#biggestCatchInput') as HTMLInputElement;
            if (biggestCatchInput) {
              biggestCatchInput.focus();
            }
          }, 200);
        } else {
          // All entries complete
          setSelectedCompetitorId(null);
          
          // Show success banner
          const banner = document.createElement('div');
          banner.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg text-sm z-50 shadow-lg';
          banner.textContent = 'Grosse Prise terminée (20/20)';
          document.body.appendChild(banner);
          
          setTimeout(() => {
            if (document.body.contains(banner)) {
              document.body.removeChild(banner);
            }
          }, 3000);
        }
      } else {
        // Regular save - just clear form but keep same competitor selected
        setBiggestCatch('');
        setErrors({});
        
        // Focus the biggest catch input
        setTimeout(() => {
          const biggestCatchInput = document.querySelector('#biggestCatchInput') as HTMLInputElement;
          if (biggestCatchInput) {
            biggestCatchInput.focus();
          }
        }, 100);
      }
    }, 800);
  };

  // Check if there are any incomplete competitors
  const hasIncompleteCompetitors = useMemo(() => {
    return mockCompetitors.some(comp => {
      const entry = entries[comp.id];
      return !entry || !['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status);
    });
  }, [mockCompetitors, entries]);

  // Check if entry is already saved/locked
  const isEntryLocked = selectedEntry && ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(selectedEntry.status);

  // Handle duplicate submission
  const handleDuplicateSubmission = () => {
    if (isEntryLocked) {
      // Show non-blocking notice for duplicate submission
      const notice = document.createElement('div');
      notice.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm z-50 shadow-lg';
      notice.textContent = 'Entrée déjà enregistrée';
      document.body.appendChild(notice);
      
      setTimeout(() => {
        if (document.body.contains(notice)) {
          document.body.removeChild(notice);
        }
      }, 3000);
    }
  };

  // Calculate completion stats
  const totalCompetitors = mockCompetitors.length;
  const completedEntries = mockCompetitors.filter(comp => {
    const entry = entries[comp.id];
    return entry && ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status);
  }).length;

  return (
    <div className="h-screen flex flex-col">
      {!judgeSector ? (
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Secteur non assigné
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Aucun secteur n'est assigné à votre compte. Contactez l'administrateur.
            </p>
          </div>
        </div>
      ) : (
        <>
      {/* Connection Status Bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isOnlineSimulation ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                <span className="text-gray-900 dark:text-white">
                  {isOnlineSimulation ? 'En ligne' : 'Hors ligne'}
                </span>
              </span>
              {syncQueue > 0 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {syncQueue} en cours de sync
                </Badge>
              )}
              <button
                onClick={() => setIsOnlineSimulation(!isOnlineSimulation)}
                className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                {isOnlineSimulation ? 'Simuler hors ligne' : 'Simuler en ligne'}
              </button>
            </div>
            <Badge variant="secondary" className={`bg-sectors-${judgeSector} text-white`}>
              <MapPin className="w-3 h-3 mr-1" />
              Secteur {judgeSector}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={findNextMissing}
            className="flex items-center space-x-1"
          >
            <SkipForward className="w-4 h-4" />
            <span>Suivant manquant</span>
          </Button>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom ou box..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <Button
              variant={showIncompleteOnly ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
              className="flex items-center space-x-1"
            >
              <Filter className="w-4 h-4" />
              <span>Incomplets seulement</span>
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedEntries / totalCompetitors) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="text-gray-900 dark:text-white">{completedEntries}/{totalCompetitors}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Table */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="sticky left-0 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-1">
                      <span>Action</span>
                    </div>
                  </th>
                  <th className="sticky left-16 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">
                      <span>BOX N°</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">
                      <span>Compétiteur</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">
                      <span>Équipe</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">
                      <span>Grosse prise (g)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">
                      <span>Heure</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">
                      <span>Statut</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCompetitors.map(competitor => {
                  const entry = entries[competitor.id];
                  const status = getEntryStatus(competitor.id);
                  const actionIcon = getActionIcon(status);
                  const isSelected = selectedCompetitorId === competitor.id;
                  const isLocked = ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(status);
                  
                  return (
                    <tr 
                      key={competitor.id}
                      className={`${getRowStyling(status)} ${getBorderStyling(status)} ${isSelected ? 'ring-2 ring-ocean-500' : ''} ${isLocked ? '' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      onClick={() => handleRowSelect(competitor.id)}
                      data-competitor-id={competitor.id}
                    >
                      {/* Action Column - Sticky */}
                      <td className={`sticky left-0 ${getRowStyling(status)} px-4 py-4 border-r border-gray-200 dark:border-gray-700`}>
                        <button
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${actionIcon.color} ${isLocked ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                          title={actionIcon.tooltip}
                          disabled={isLocked}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isLocked) {
                              handleRowSelect(competitor.id);
                            }
                          }}
                        >
                          <actionIcon.icon className="w-4 h-4" />
                        </button>
                      </td>
                      
                      {/* Box Number - Sticky */}
                      <td className={`sticky left-16 ${getRowStyling(status)} px-4 py-4 border-r border-gray-200 dark:border-gray-700`}>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {competitor.boxCode}
                        </span>
                      </td>
                      
                      {/* Competitor */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {competitor.name}
                        </span>
                      </td>
                      
                      {/* Équipe */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-gray-900 dark:text-white">
                          {competitor.equipe}
                        </span>
                      </td>
                      
                      {/* Grosse prise */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {entry ? <span className="font-semibold text-gray-900 dark:text-white">{formatWeight(entry.biggestCatch)}</span> : <span className="text-gray-400 dark:text-gray-500">-</span>}
                      </td>
                      
                      {/* Timestamp */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {entry?.timestamp ? (
                          <span className="font-mono text-sm text-gray-600 dark:text-gray-300">{formatTime(entry.timestamp)}</span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      
                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(status)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel - Editor */}
        <div className={`bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 transition-all duration-300 ${
          isEditorCollapsed ? 'w-12' : 'w-96'
        }`}>
          {isEditorCollapsed ? (
            <div className="p-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditorCollapsed(false)}
                className="w-full"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Éditeur Grosse Prise
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditorCollapsed(true)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                {selectedCompetitor ? (
                  <div className="space-y-6">
                    {/* Competitor Identity */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">BOX N°:</span>
                          <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedCompetitor.boxCode}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Compétiteur:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{selectedCompetitor.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Équipe:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{selectedCompetitor.equipe}</span>
                        </div>
                        {selectedEntry && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Source:</span>
                              <Badge variant="outline" className="text-xs">Juge</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Dernière MAJ:</span>
                              <span className="text-sm text-gray-900 dark:text-gray-100">{selectedEntry.timestamp ? formatTime(selectedEntry.timestamp) : '-'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Entry Status */}
                    {selectedEntry && selectedEntry.status === 'locked_judge' ? (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lock className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-800 dark:text-green-200">
                            Entrée verrouillée (lecture seule)
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Grosse prise:</span>
                            <span className="ml-2 font-medium">{formatWeight(selectedEntry.biggestCatch)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Seuls les administrateurs peuvent modifier les entrées sauvegardées.
                        </p>
                      </div>
                    ) : selectedEntry && selectedEntry.status === 'locked_admin' ? (
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lock className="w-5 h-5 text-orange-600" />
                          <span className="font-medium text-orange-800 dark:text-orange-200">
                            Entrée verrouillée
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Grosse prise:</span>
                            <span className="ml-2 font-medium">{formatWeight(selectedEntry.biggestCatch)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Seuls les administrateurs peuvent modifier les entrées sauvegardées.
                        </p>
                      </div>
                    ) : selectedEntry && (selectedEntry.status === 'offline_judge' || selectedEntry.status === 'offline_admin') ? (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <CloudOff className="w-5 h-5 text-amber-600" />
                          <span className="font-medium text-amber-800 dark:text-amber-200">
                            Mode hors ligne
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Grosse prise:</span>
                            <span className="ml-2 font-medium">{formatWeight(selectedEntry.biggestCatch)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Entrée sauvegardée hors ligne. Sera synchronisée automatiquement.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Data Entry Fields */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              <Trophy className="w-4 h-4 inline mr-1" />
                              Grosse prise (g) *
                            </label>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setBiggestCatch(Math.max(0, parseInt(biggestCatch) - 1 || 0).toString())}
                                disabled={parseInt(biggestCatch) <= 0}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <input
                                id="biggestCatchInput"
                                type="number"
                                min="0"
                                value={biggestCatch}
                                onChange={(e) => setBiggestCatch(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center"
                                placeholder="0"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setBiggestCatch((parseInt(biggestCatch) + 1 || 1).toString())}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            {errors.biggestCatch && (
                              <p className="text-red-500 text-xs mt-1">{errors.biggestCatch}</p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <Button
                            variant="primary"
                            onClick={() => handleSaveEntry(false)}
                            className="w-full"
                            disabled={!biggestCatch.trim() || isSaving || isEntryLocked || Object.keys(errors).length > 0}
                          >
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={() => handleSaveEntry(true)}
                            className="w-full"
                            disabled={!biggestCatch.trim() || isSaving || isEntryLocked || !hasIncompleteCompetitors || Object.keys(errors).length > 0}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {!hasIncompleteCompetitors ? 'Aucune ligne restante' : 'Sauvegarder & Suivant'}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setSelectedCompetitorId(null);
                              setBiggestCatch('');
                              setErrors({});
                            }}
                            className="w-full"
                          >
                            Annuler
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Sélectionnez une ligne pour saisir la grosse prise</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
}