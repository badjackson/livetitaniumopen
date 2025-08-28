'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { 
  Save, 
  Trophy, 
  Wifi, 
  WifiOff, 
  Loader2, 
  Edit,
  Lock,
  CloudOff,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Minus,
  ChevronRight,
  ChevronLeft,
  Download
} from 'lucide-react';
import { formatWeight, formatNumber, formatTime } from '@/lib/utils';

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
  source: 'Judge' | 'Admin';
  syncRetries?: number;
  errorMessage?: string;
}

// Mock competitors data - will be replaced with API
const getCompetitorsBySector = (): { [sector: string]: Competitor[] } => {
  if (typeof window !== 'undefined') {
    try {
      const savedCompetitors = localStorage.getItem('competitors');
      if (savedCompetitors) {
        const allCompetitors = JSON.parse(savedCompetitors);
        const competitorsBySector: { [sector: string]: Competitor[] } = {};
        
        allCompetitors.forEach((comp: any) => {
          if (!competitorsBySector[comp.sector]) {
            competitorsBySector[comp.sector] = [];
          }
          
          competitorsBySector[comp.sector].push({
            id: comp.id,
            boxNumber: comp.boxNumber,
            boxCode: comp.boxCode,
            name: comp.fullName,
            equipe: comp.equipe,
            sector: comp.sector,
          });
        });
        
        return competitorsBySector;
      }
    } catch (error) {
      console.error('Error loading competitors:', error);
    }
  }
  
  // Fallback - empty object
  return {};
};

export default function AdminGrossePrise() {
  const searchParams = useSearchParams();
  const [activeSector, setActiveSector] = useState(searchParams.get('sector') || 'A');
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [isOnlineSimulation, setIsOnlineSimulation] = useState(true);
  
  const [entries, setEntries] = useState<{ [sector: string]: { [competitorId: string]: GrossePriseEntry } }>({});

  // Dynamic competitors
  const [mockCompetitorsBySector, setMockCompetitorsBySector] = useState<{ [sector: string]: Competitor[] }>({});
  
  // Load persisted data on mount
  useEffect(() => {
    if (Object.keys(mockCompetitorsBySector).length > 0) {
      const loadPersistedData = () => {
        if (typeof window !== 'undefined') {
          try {
            // Try to load from localStorage first
            let allGrossePriseData = JSON.parse(localStorage.getItem('grossePriseData') || '{}');
            
            // If localStorage is empty, try sessionStorage backup
            if (Object.keys(allGrossePriseData).length === 0) {
              const backupData = sessionStorage.getItem('grossePriseDataBackup');
              if (backupData) {
                allGrossePriseData = JSON.parse(backupData);
                // Restore to localStorage
                localStorage.setItem('grossePriseData', JSON.stringify(allGrossePriseData));
              }
            }
            
            const newEntries: { [sector: string]: { [competitorId: string]: GrossePriseEntry } } = {};
            
            sectors.forEach(sector => {
              newEntries[sector] = {};
              const sectorData = allGrossePriseData[sector] || {};
              
              // Check for individual entry backups if main data is missing
              if (Object.keys(sectorData).length === 0) {
                mockCompetitorsBySector[sector]?.forEach(comp => {
                  const entryKey = `grossePrise_${sector}_${comp.id}`;
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
              
              Object.entries(sectorData).forEach(([competitorId, entry]: [string, any]) => {
                newEntries[sector][competitorId] = {
                  ...entry,
                  timestamp: entry.timestamp ? new Date(entry.timestamp) : undefined
                };
              });
            });
            
            setEntries(newEntries);
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
      
      // Initial load
      loadPersistedData();
    }
  }, [mockCompetitorsBySector]);

  // Load competitors on mount and listen for changes
  useEffect(() => {
    const loadCompetitors = () => {
      const competitors = getCompetitorsBySector();
      setMockCompetitorsBySector(competitors);
    };
    
    loadCompetitors();
    
    // Listen for storage changes for live updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'competitors') {
    // Set initial online status
    setIsOnline(navigator.onLine);
    setIsOnlineSimulation(navigator.onLine);
    
        loadCompetitors();
      }
    };
    // Auto-sync when coming back online
    const handleOnlineSync = () => {
      setIsOnline(true);
      setIsOnlineSimulation(true);
      
      // Try to sync any offline entries
      if (typeof window !== 'undefined') {
        try {
          const allGrossePriseData = JSON.parse(localStorage.getItem('grossePriseData') || '{}');
          
          // Update any offline entries to online status
          Object.keys(allGrossePriseData).forEach(sector => {
            const sectorData = allGrossePriseData[sector] || {};
            Object.keys(sectorData).forEach(competitorId => {
              const entry = sectorData[competitorId];
              if (entry.status === 'offline_admin') {
                entry.status = 'locked_admin';
                entry.timestamp = new Date();
              }
            });
          });
          
          localStorage.setItem('grossePriseData', JSON.stringify(allGrossePriseData));
          
          // Trigger update
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'grossePriseData',
            newValue: JSON.stringify(allGrossePriseData)
          }));
        } catch (error) {
          console.error('Error syncing offline grosse prise entries:', error);
        }
      }
    };

    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('online', handleOnlineSync);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('online', handleOnlineSync);
    };
  }, []);

  // Editor state
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string | null>(null);
  const [biggestCatch, setBiggestCatch] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const sectors = ['A', 'B', 'C', 'D', 'E', 'F'];
  const currentCompetitors = mockCompetitorsBySector[activeSector] || [];
  
  // Get current sector entries
  const currentEntries = entries[activeSector] || {};

  // Get selected competitor and entry
  const selectedCompetitor = selectedCompetitorId 
    ? currentCompetitors.find(c => c.id === selectedCompetitorId)
    : null;
  
  const selectedEntry = selectedCompetitorId 
    ? currentEntries[selectedCompetitorId]
    : null;

  // Listen for real-time updates from Judge
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
            notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg text-sm z-50 shadow-lg';
            notification.textContent = 'Données de grosse prise réinitialisées';
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
            const newEntries: { [sector: string]: { [competitorId: string]: GrossePriseEntry } } = {};
            
            sectors.forEach(sector => {
              newEntries[sector] = {};
              const sectorData = allGrossePriseData[sector] || {};
              
              Object.entries(sectorData).forEach(([competitorId, entry]: [string, any]) => {
                newEntries[sector][competitorId] = {
                  ...entry,
                  timestamp: entry.timestamp ? new Date(entry.timestamp) : undefined
                };
              });
            });
            
            setEntries(newEntries);
          } catch (error) {
            console.error('Failed to sync real-time grosse prise data:', error);
          }
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  // Update localStorage when entries change
  const updateLocalStorage = (sector: string, competitorId: string, entry: GrossePriseEntry) => {
    if (typeof window !== 'undefined') {
      try {
        const allGrossePriseData = JSON.parse(localStorage.getItem('grossePriseData') || '{}');
        if (!allGrossePriseData[sector]) allGrossePriseData[sector] = {};
        
        allGrossePriseData[sector][competitorId] = entry;
        
        localStorage.setItem('grossePriseData', JSON.stringify(allGrossePriseData));
        
        // Create backup in sessionStorage for extra safety
        sessionStorage.setItem('grossePriseDataBackup', JSON.stringify(allGrossePriseData));
        
        // Also store individual entry for recovery
        const entryKey = `grossePrise_${sector}_${competitorId}`;
        localStorage.setItem(entryKey, JSON.stringify(entry));
        
        // Trigger storage event for real-time updates
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'grossePriseData',
          newValue: JSON.stringify(allGrossePriseData)
        }));
      } catch (error) {
        console.error('Failed to store grosse prise entry locally:', error);
        
        // Fallback: try to save in sessionStorage
        try {
          const fallbackKey = `fallback_grossePrise_${sector}_${competitorId}`;
          sessionStorage.setItem(fallbackKey, JSON.stringify(entry));
        } catch (fallbackError) {
          console.error('Failed to store grosse prise entry in sessionStorage:', fallbackError);
        }
      }
    }
  };
  // Filter competitors
  const filteredCompetitors = useMemo(() => {
    let filtered = currentCompetitors;
    
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
        const entry = currentEntries[comp.id];
        return !entry || !['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(comp => {
        const entry = currentEntries[comp.id];
        return entry?.status === statusFilter || (!entry && statusFilter === 'empty');
      });
    }
    
    return filtered;
  }, [currentCompetitors, searchQuery, showIncompleteOnly, statusFilter, currentEntries]);

  // Load entry data when competitor is selected
  useEffect(() => {
    if (selectedCompetitorId) {
      const entry = currentEntries[selectedCompetitorId];
      if (entry && entry.status !== 'empty') {
        setBiggestCatch(entry.biggestCatch.toString());
      } else {
        setBiggestCatch('');
      }
      setErrors({});
    }
  }, [selectedCompetitorId, currentEntries]);

  const getSectorColor = (sector: string) => {
    const colors: { [key: string]: string } = {
      A: 'bg-sectors-A text-white',
      B: 'bg-sectors-B text-white',
      C: 'bg-sectors-C text-white',
      D: 'bg-sectors-D text-white',
      E: 'bg-sectors-E text-white',
      F: 'bg-sectors-F text-white',
    };
    return colors[sector] || 'bg-gray-500 text-white';
  };

  const getEntryStatus = (competitorId: string): GrossePriseEntry['status'] => {
    const entry = currentEntries[competitorId];
    return entry?.status || 'empty';
  };

  const getActionIcon = (status: GrossePriseEntry['status']) => {
    switch (status) {
      case 'locked_judge':
        return { icon: Lock, tooltip: 'Verrouillé par Juge', color: 'text-green-600' };
      case 'locked_admin':
        return { icon: Lock, tooltip: 'Verrouillé par Admin', color: 'text-orange-600' };
      case 'offline_judge':
      case 'offline_admin':
        return { icon: CloudOff, tooltip: 'Hors ligne', color: 'text-amber-600' };
      case 'error':
        return { icon: AlertTriangle, tooltip: 'Erreur', color: 'text-red-600' };
      case 'in_progress':
        return { icon: Edit, tooltip: 'En cours', color: 'text-blue-600' };
      default:
        return { icon: Edit, tooltip: 'Saisir la grosse prise', color: 'text-gray-600' };
    }
  };

  const getRowStyling = (status: GrossePriseEntry['status']) => {
    switch (status) {
      case 'locked_judge':
        return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500';
      case 'locked_admin':
        return 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500';
      case 'offline_judge':
      case 'offline_admin':
        return 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500';
      case 'in_progress':
        return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500';
      default:
        return 'hover:bg-gray-50 dark:hover:bg-gray-800';
    }
  };

  const getStatusBadge = (status: GrossePriseEntry['status']) => {
    switch (status) {
      case 'locked_judge':
        return <Badge className="bg-green-100 text-green-800">Verrouillé (Juge)</Badge>;
      case 'locked_admin':
        return <Badge className="bg-orange-100 text-orange-800">Verrouillé (Admin)</Badge>;
      case 'offline_judge':
        return <Badge className="bg-amber-100 text-amber-800">Hors ligne (Juge)</Badge>;
      case 'offline_admin':
        return <Badge className="bg-amber-100 text-amber-800">Hors ligne (Admin)</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erreur</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>;
      default:
        return <Badge variant="outline">Vide</Badge>;
    }
  };

  const handleRowSelect = (competitorId: string) => {
    setSelectedCompetitorId(competitorId);
    setIsEditorCollapsed(false);
  };

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

  const handleSaveEntry = async (saveAndNext = false) => {
    if (!validateEntry() || !selectedCompetitor) return;

    setIsSaving(true);

    const entry: GrossePriseEntry = {
      competitorId: selectedCompetitor.id,
      boxNumber: selectedCompetitor.boxNumber,
      biggestCatch: parseInt(biggestCatch),
      status: isOnlineSimulation ? 'locked_admin' : 'offline_admin',
      timestamp: new Date(),
      source: 'Admin',
      syncRetries: 0,
    };

    // Update state
    setEntries(prev => ({
      ...prev,
      [activeSector]: {
        ...(prev[activeSector] || {}),
        [selectedCompetitor.id]: entry
      }
    }));

    // Update localStorage
    updateLocalStorage(activeSector, selectedCompetitor.id, entry);

    // Simulate save delay
    setTimeout(() => {
      setIsSaving(false);
      setBiggestCatch('');
      setErrors({});
      
      if (saveAndNext) {
        // Find next incomplete competitor in box order
        const sortedCompetitors = [...currentCompetitors].sort((a, b) => a.boxNumber - b.boxNumber);
        const updatedEntries = {...currentEntries, [selectedCompetitor.id]: entry};
        const nextCompetitor = sortedCompetitors.find(comp => {
          const compEntry = updatedEntries[comp.id];
          return !compEntry || !['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(compEntry.status);
        });
        
        if (nextCompetitor) {
          setSelectedCompetitorId(nextCompetitor.id);
        } else {
          setSelectedCompetitorId(null);
        }
      }
    }, 800);
  };

  const handleExportCSV = () => {
    const headers = ['Box N°', 'Compétiteur', 'Équipe', 'Grosse prise (g)', 'Heure', 'Source', 'Statut'];
    const rows = filteredCompetitors.map(comp => {
      const entry = currentEntries[comp.id];
      return [
        comp.boxCode,
        comp.name,
        comp.equipe,
        entry?.biggestCatch || 0,
        entry?.timestamp ? formatTime(entry.timestamp) : '',
        entry?.source || '',
        entry?.status || 'Vide'
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grosse-prise-${activeSector}.csv`;
    a.click();
  };

  // Calculate progress for current sector
  const completedEntries = Object.values(currentEntries).filter(e => 
    ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(e.status)
  ).length;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Grosse Prise</h1>
            <p className="text-gray-600 dark:text-gray-300">Gestion des grosses prises par secteur</p>
          </div>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span className="text-sm font-medium">
              <span className="text-gray-900 dark:text-white">
                {isOnlineSimulation ? 'En ligne' : 'Hors ligne'}
              </span>
            </span>
            <button
              onClick={() => setIsOnlineSimulation(!isOnlineSimulation)}
              className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {isOnlineSimulation ? 'Simuler hors ligne' : 'Simuler en ligne'}
            </button>
          </div>
        </div>
      </div>

      {/* Sector Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {sectors.map(sector => (
              <Button
                key={sector}
                variant={activeSector === sector ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveSector(sector)}
                className={activeSector === sector ? getSectorColor(sector) : ''}
              >
                Secteur {sector}
              </Button>
            ))}
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedEntries / 20) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="text-gray-900 dark:text-white">{completedEntries}/20</span>
              </span>
            </div>
          </div>
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
            >
              <Filter className="w-4 h-4 mr-1" />
              Incomplets seulement
            </Button>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="empty">Vide</option>
              <option value="locked_judge">Verrouillé (Juge)</option>
              <option value="locked_admin">Verrouillé (Admin)</option>
              <option value="offline_judge">Hors ligne (Juge)</option>
              <option value="offline_admin">Hors ligne (Admin)</option>
              <option value="error">Erreur</option>
            </select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
          >
            <Download className="w-4 h-4 mr-1" />
            Exporter CSV
          </Button>
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
                    Action
                  </th>
                  <th className="sticky left-16 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                    BOX N°
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Compétiteur
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Équipe
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Grosse prise (g)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Heure
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCompetitors.map(competitor => {
                  const entry = currentEntries[competitor.id];
                  const status = getEntryStatus(competitor.id);
                  const actionIcon = getActionIcon(status);
                  const isSelected = selectedCompetitorId === competitor.id;
                  
                  return (
                    <tr 
                      key={competitor.id}
                      className={`${getRowStyling(status)} ${isSelected ? 'ring-2 ring-ocean-500' : ''} cursor-pointer`}
                      onClick={() => handleRowSelect(competitor.id)}
                    >
                      <td className={`sticky left-0 ${getRowStyling(status)} px-4 py-4 border-r border-gray-200 dark:border-gray-700`}>
                        <button className={`w-8 h-8 rounded-lg flex items-center justify-center ${actionIcon.color}`}>
                          <actionIcon.icon className="w-4 h-4" />
                        </button>
                      </td>
                      <td className={`sticky left-16 ${getRowStyling(status)} px-4 py-4 border-r border-gray-200 dark:border-gray-700`}>
                        <span className="font-mono font-semibold text-gray-900 dark:text-white">{competitor.boxCode}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900 dark:text-white">{competitor.name}</span>
                      </td>
                      
                      {/* Équipe */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-gray-800 dark:text-gray-200">{competitor.equipe}</span>
                      </td>
                      
                      {/* Biggest Catch */}
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
                      
                      {/* Source */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {entry?.source ? (
                          <Badge variant="outline" className="text-xs">{entry.source}</Badge>
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
                    Éditeur Grosse Prise - {activeSector}
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
                              <Badge variant="outline" className="text-xs text-gray-700 dark:text-gray-300">{selectedEntry.source}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Dernière MAJ:</span>
                              <span className="text-sm text-gray-900 dark:text-white">{selectedEntry.timestamp ? formatTime(selectedEntry.timestamp) : '-'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Data Entry Field */}
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
                            type="number"
                            min="0"
                            value={biggestCatch}
                            onChange={(e) => setBiggestCatch(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-center"
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
                        disabled={!biggestCatch.trim() || isSaving || Object.keys(errors).length > 0}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {selectedEntry ? 'Mettre à jour' : 'Sauvegarder'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => handleSaveEntry(true)}
                        className="w-full"
                        disabled={!biggestCatch.trim() || isSaving || Object.keys(errors).length > 0}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {selectedEntry ? 'Mettre à jour & Suivant' : 'Sauvegarder & Suivant'}
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
    </div>
  );
}