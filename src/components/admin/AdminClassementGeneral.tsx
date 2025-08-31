'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { 
  Search,
  Filter,
  Download,
  ArrowUpDown,
  Trophy,
  Medal,
  Award,
  Wifi,
  WifiOff
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

interface HourlyEntry {
  competitorId: string;
  boxNumber: number;
  fishCount: number;
  totalWeight: number;
  status: string;
  timestamp?: Date;
  source: 'Judge' | 'Admin';
}

interface GrossePriseEntry {
  competitorId: string;
  boxNumber: number;
  biggestCatch: number;
  status: string;
  timestamp?: Date;
  source: 'Judge' | 'Admin';
}

interface CalculatedCompetitor {
  id: string;
  boxNumber: number;
  boxCode: string;
  name: string;
  equipe: string;
  sector: string;
  nbPrisesGlobal: number;
  poidsTotal: number;
  grossePrise: number;
  points: number;
  coefficientSecteur: number;
  classementSecteur: number;
  classementGeneral: number;
  lastValidEntry?: Date;
}

// Get competitors from localStorage
const getAllCompetitors = (): Competitor[] => {
  if (typeof window !== 'undefined') {
    try {
      const savedCompetitors = localStorage.getItem('competitors');
      if (savedCompetitors) {
        const allCompetitors = JSON.parse(savedCompetitors);
        return allCompetitors.map((comp: any) => ({
          id: comp.id,
          boxNumber: comp.boxNumber,
          boxCode: comp.boxCode,
          name: comp.fullName,
          equipe: comp.equipe,
          sector: comp.sector,
        }));
      }
    } catch (error) {
      console.error('Error loading competitors:', error);
    }
  }
  
  return [];
};

// Get hourly data from localStorage
const getHourlyData = (): { [sector: string]: { [hour: number]: { [competitorId: string]: HourlyEntry } } } => {
  if (typeof window !== 'undefined') {
    try {
      const savedData = localStorage.getItem('hourlyData');
      if (savedData) {
        const allHourlyData = JSON.parse(savedData);
        // Convert timestamp strings back to Date objects
        Object.keys(allHourlyData).forEach(sector => {
          Object.keys(allHourlyData[sector] || {}).forEach(hour => {
            Object.keys(allHourlyData[sector][hour] || {}).forEach(competitorId => {
              const entry = allHourlyData[sector][hour][competitorId];
              if (entry.timestamp) {
                entry.timestamp = new Date(entry.timestamp);
              }
            });
          });
        });
        return allHourlyData;
      }
    } catch (error) {
      console.error('Error loading hourly data:', error);
    }
  }
  
  return {};
};

// Get grosse prise data from localStorage
const getGrossePriseData = (): { [sector: string]: { [competitorId: string]: GrossePriseEntry } } => {
  if (typeof window !== 'undefined') {
    try {
      const savedData = localStorage.getItem('grossePriseData');
      if (savedData) {
        const allGrossePriseData = JSON.parse(savedData);
        // Convert timestamp strings back to Date objects
        Object.keys(allGrossePriseData).forEach(sector => {
          Object.keys(allGrossePriseData[sector] || {}).forEach(competitorId => {
            const entry = allGrossePriseData[sector][competitorId];
            if (entry.timestamp) {
              entry.timestamp = new Date(entry.timestamp);
            }
          });
        });
        return allGrossePriseData;
      }
    } catch (error) {
      console.error('Error loading grosse prise data:', error);
    }
  }
  
  return {};
};

export default function AdminClassementGeneral() {
  const [isOnline, setIsOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('classementGeneral');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Data states
  const [allCompetitors, setAllCompetitors] = useState<Competitor[]>([]);
  const [hourlyData, setHourlyData] = useState<{ [sector: string]: { [hour: number]: { [competitorId: string]: HourlyEntry } } }>({});
  const [grossePriseData, setGrossePriseData] = useState<{ [sector: string]: { [competitorId: string]: GrossePriseEntry } }>({});

  const sectors = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Load initial data
  useEffect(() => {
    const loadData = () => {
      setAllCompetitors(getAllCompetitors());
      setHourlyData(getHourlyData());
      setGrossePriseData(getGrossePriseData());
    };
    
    loadData();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'competitors') {
        setAllCompetitors(getAllCompetitors());
      } else if (e.key === 'hourlyData') {
        if (!e.newValue || e.newValue === 'null') {
          // Data was reset - reload empty data
          setHourlyData({});
          return;
        }
        setHourlyData(getHourlyData());
      } else if (e.key === 'grossePriseData') {
        if (!e.newValue || e.newValue === 'null') {
          // Data was reset - reload empty data
          setGrossePriseData({});
          return;
        }
        setGrossePriseData(getGrossePriseData());
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Calculate live data for all competitors
  const calculatedCompetitors = useMemo(() => {
    // First, calculate sector rankings
    const competitorsBySector: { [sector: string]: CalculatedCompetitor[] } = {};
    
    sectors.forEach(sector => {
      const sectorCompetitors = allCompetitors.filter(comp => comp.sector === sector);
      const sectorHourlyData = hourlyData[sector] || {};
      const sectorGrossePriseData = grossePriseData[sector] || {};
      
      // Calculate totals for each competitor in this sector
      const sectorCalculated: CalculatedCompetitor[] = sectorCompetitors.map(competitor => {
        let nbPrisesGlobal = 0;
        let poidsTotal = 0;
        let lastValidEntry: Date | undefined;
        
        // Sum across all 7 hours
        for (let hour = 1; hour <= 7; hour++) {
          const hourData = sectorHourlyData[hour] || {};
          const entry = hourData[competitor.id];
          
          if (entry && ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status)) {
            nbPrisesGlobal += entry.fishCount;
            poidsTotal += entry.totalWeight;
            
            if (entry.timestamp && (!lastValidEntry || entry.timestamp > lastValidEntry)) {
              lastValidEntry = entry.timestamp;
            }
          }
        }
        
        // Get grosse prise
        const grossePriseEntry = sectorGrossePriseData[competitor.id];
        const grossePrise = grossePriseEntry && ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(grossePriseEntry.status) 
          ? grossePriseEntry.biggestCatch 
          : 0;
        
        // Calculate points
        const points = (nbPrisesGlobal * 50) + poidsTotal;
        
        return {
          id: competitor.id,
          boxNumber: competitor.boxNumber,
          boxCode: competitor.boxCode,
          name: competitor.name,
          equipe: competitor.equipe,
          sector: competitor.sector,
          nbPrisesGlobal,
          poidsTotal,
          grossePrise,
          points,
          coefficientSecteur: 0, // Will be calculated after we have sector totals
          classementSecteur: 0, // Will be calculated after sorting
          classementGeneral: 0, // Will be calculated in general ranking
          lastValidEntry
        };
      });
      
      // Calculate sector total for coefficient calculation
      const sectorTotalNbPrises = sectorCalculated.reduce((sum, comp) => sum + comp.nbPrisesGlobal, 0);
      
      // Calculate coefficients
      sectorCalculated.forEach(comp => {
        if (sectorTotalNbPrises > 0) {
          comp.coefficientSecteur = (comp.points * comp.nbPrisesGlobal) / sectorTotalNbPrises;
        } else {
          comp.coefficientSecteur = 0;
        }
      });
      
      // Sort by points (desc), then by grosse prise (desc), then by earliest last valid entry for sector ranking
      const sectorSorted = [...sectorCalculated].sort((a, b) => {
        // Primary: Points (desc)
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        
        // Tie-breaker 1: Grosse prise (desc)
        if (b.grossePrise !== a.grossePrise) {
          return b.grossePrise - a.grossePrise;
        }
        
        // Tie-breaker 2: Earliest last valid entry (asc)
        if (a.lastValidEntry && b.lastValidEntry) {
          return a.lastValidEntry.getTime() - b.lastValidEntry.getTime();
        } else if (a.lastValidEntry) {
          return -1; // a has entry, b doesn't - a wins
        } else if (b.lastValidEntry) {
          return 1; // b has entry, a doesn't - b wins
        }
        
        return 0;
      });
      
      // Assign sector rankings
      sectorSorted.forEach((comp, index) => {
        comp.classementSecteur = index + 1;
      });
      
      competitorsBySector[sector] = sectorSorted;
    });
    
    // Now build general ranking by place groups
    const generalRanking: CalculatedCompetitor[] = [];
    
    // Process each place (1st through 20th)
    for (let place = 1; place <= 20; place++) {
      const placeGroup: CalculatedCompetitor[] = [];
      
      // Collect all competitors at this place from each sector
      sectors.forEach(sector => {
        const sectorCompetitors = competitorsBySector[sector] || [];
        const competitorAtPlace = sectorCompetitors.find(comp => comp.classementSecteur === place);
        if (competitorAtPlace) {
          placeGroup.push(competitorAtPlace);
        }
      });
      
      // Sort this place group by coefficient (desc), then tie-breakers
      placeGroup.sort((a, b) => {
        // Primary: Coefficient secteur (desc)
        if (b.coefficientSecteur !== a.coefficientSecteur) {
          return b.coefficientSecteur - a.coefficientSecteur;
        }
        
        // Tie-breaker 1: Grosse prise (desc)
        if (b.grossePrise !== a.grossePrise) {
          return b.grossePrise - a.grossePrise;
        }
        
        // Tie-breaker 2: Total Points (desc)
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        
        // Tie-breaker 3: Earliest last valid entry (asc)
        if (a.lastValidEntry && b.lastValidEntry) {
          return a.lastValidEntry.getTime() - b.lastValidEntry.getTime();
        } else if (a.lastValidEntry) {
          return -1;
        } else if (b.lastValidEntry) {
          return 1;
        }
        
        return 0;
      });
      
      // Add to general ranking
      generalRanking.push(...placeGroup);
    }
    
    // Handle zero-coefficient competitors (place at bottom with rank 120)
    const zeroCoeffCompetitors = generalRanking.filter(comp => comp.coefficientSecteur === 0);
    const nonZeroCompetitors = generalRanking.filter(comp => comp.coefficientSecteur > 0);
    
    // Assign general rankings
    nonZeroCompetitors.forEach((comp, index) => {
      comp.classementGeneral = index + 1;
    });
    
    zeroCoeffCompetitors.forEach(comp => {
      comp.classementGeneral = 120;
    });
    
    return [...nonZeroCompetitors, ...zeroCoeffCompetitors];
  }, [allCompetitors, hourlyData, grossePriseData, sectors]);

  // Apply sorting
  const sortedCompetitors = useMemo(() => {
    if (sortField === 'classementGeneral') {
      return calculatedCompetitors; // Already sorted by general ranking
    }
    
    return [...calculatedCompetitors].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;
      
      switch (sortField) {
        case 'boxNumber':
          aValue = a.boxNumber;
          bValue = b.boxNumber;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'equipe':
          aValue = a.equipe.toLowerCase();
          bValue = b.equipe.toLowerCase();
          break;
        case 'nbPrisesGlobal':
          aValue = a.nbPrisesGlobal;
          bValue = b.nbPrisesGlobal;
          break;
        case 'grossePrise':
          aValue = a.grossePrise;
          bValue = b.grossePrise;
          break;
        case 'classementSecteur':
          aValue = a.classementSecteur;
          bValue = b.classementSecteur;
          break;
        case 'coefficientSecteur':
          aValue = a.coefficientSecteur;
          bValue = b.coefficientSecteur;
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
      } else {
        return sortDirection === 'desc' ? (bValue as number) - (aValue as number) : (aValue as number) - (bValue as number);
      }
    });
  }, [calculatedCompetitors, sortField, sortDirection]);

  // Apply filters
  const filteredCompetitors = useMemo(() => {
    let filtered = sortedCompetitors;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(comp => 
        comp.name.toLowerCase().includes(query) ||
        comp.equipe.toLowerCase().includes(query) ||
        comp.boxCode.toLowerCase().includes(query)
      );
    }
    
    // Sector filter
    if (sectorFilter !== 'all') {
      filtered = filtered.filter(comp => comp.sector === sectorFilter);
    }
    
    // Type filters
    switch (filterType) {
      case 'top3':
        filtered = filtered.slice(0, 3);
        break;
      case 'top10':
        filtered = filtered.slice(0, 10);
        break;
      case 'withGrossePrise':
        filtered = filtered.filter(comp => comp.grossePrise > 0);
        break;
    }
    
    return filtered;
  }, [sortedCompetitors, searchQuery, sectorFilter, filterType]);

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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'classementGeneral' || field === 'classementSecteur' ? 'asc' : 'desc');
    }
  };

  const formatCoefficient = (value: number): string => {
    return value.toLocaleString('fr-FR', { 
      minimumFractionDigits: 3, 
      maximumFractionDigits: 3 
    });
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Award className="w-4 h-4 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Box N°', 
      'Compétiteur', 
      'Équipe', 
      'Secteur',
      'Nb Prises global', 
      'Grosse prise (g)', 
      'Classement secteur',
      'Coefficient secteur', 
      'Classement Général'
    ];
    
    const rows = filteredCompetitors.map(comp => [
      comp.boxCode,
      comp.name,
      comp.equipe,
      comp.sector,
      comp.nbPrisesGlobal,
      comp.grossePrise,
      comp.classementSecteur,
      formatCoefficient(comp.coefficientSecteur),
      comp.classementGeneral
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classement-general.csv`;
    a.click();
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Classement Général</h1>
            <p className="text-gray-600 dark:text-gray-300">Classement général de la compétition en temps réel</p>
          </div>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-600">Mise à jour automatique</span>
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
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">Tous les secteurs</option>
              {sectors.map(sector => (
                <option key={sector} value={sector}>Secteur {sector}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">Tous</option>
              <option value="top3">Top 3 général</option>
              <option value="top10">Top 10 général</option>
              <option value="withGrossePrise">Avec grosse prise</option>
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

      {/* Main Content - Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              <th 
                className="sticky left-0 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('boxNumber')}
              >
                <div className="flex items-center space-x-1">
                  <span>BOX N°</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Compétiteur</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('equipe')}
              >
                <div className="flex items-center space-x-1">
                  <span>Équipe</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('nbPrisesGlobal')}
              >
                <div className="flex items-center space-x-1">
                  <span>Nb Prises global</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('grossePrise')}
              >
                <div className="flex items-center space-x-1">
                  <span>Grosse prise (g)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('classementSecteur')}
              >
                <div className="flex items-center space-x-1">
                  <span>Classement secteur</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('coefficientSecteur')}
              >
                <div className="flex items-center space-x-1">
                  <span>Coefficient secteur</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('classementGeneral')}
              >
                <div className="flex items-center space-x-1">
                  <span>Classement Général</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredCompetitors.map(competitor => {
              const isTopThree = competitor.classementGeneral <= 3;
              const isZeroCoeff = competitor.coefficientSecteur === 0;
              
              return (
                <tr 
                  key={competitor.id}
                  className={`${isTopThree ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''} ${isZeroCoeff ? 'bg-gray-100 dark:bg-gray-800' : ''} hover:bg-gray-50 dark:hover:bg-gray-800`}
                >
                  {/* Box Number - Sticky */}
                  <td className="sticky left-0 bg-white dark:bg-gray-900 px-4 py-4 border-r border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">
                        {competitor.boxCode}
                      </span>
                      <Badge className={`text-xs ${getSectorColor(competitor.sector)}`}>
                        {competitor.sector}
                      </Badge>
                    </div>
                  </td>
                  
                  {/* Competitor */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {competitor.name}
                    </span>
                  </td>
                  
                  {/* Équipe */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-gray-800 dark:text-gray-200">{competitor.equipe}</span>
                  </td>
                  
                  {/* Nb Prises global */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {competitor.nbPrisesGlobal}
                    </span>
                  </td>
                  
                  {/* Grosse prise */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {competitor.grossePrise > 0 ? formatNumber(competitor.grossePrise) : '—'}
                    </span>
                  </td>
                  
                  {/* Classement secteur */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {competitor.classementSecteur <= 3 && getRankIcon(competitor.classementSecteur)}
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {competitor.classementSecteur}
                      </span>
                    </div>
                  </td>
                  
                  {/* Coefficient secteur */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-gray-800 dark:text-gray-200">
                      {formatCoefficient(competitor.coefficientSecteur)}
                    </span>
                  </td>
                  
                  {/* Classement Général */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {competitor.classementGeneral <= 3 && getRankIcon(competitor.classementGeneral)}
                      <span className={`font-bold text-lg ${
                        competitor.classementGeneral === 1 ? 'text-yellow-600' :
                        competitor.classementGeneral === 2 ? 'text-gray-500' :
                        competitor.classementGeneral === 3 ? 'text-amber-600' :
                        competitor.classementGeneral === 120 ? 'text-gray-400' :
                        'text-ocean-600'
                      }`}>
                        {competitor.classementGeneral}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}