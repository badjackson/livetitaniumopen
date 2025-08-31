'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/components/providers/FirestoreSyncProvider';
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
  Users,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatWeight, formatNumber, formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Competitor {
  id: string;
  boxNumber: number;
  boxCode: string;
  fullName: string;
  equipe: string;
  sector: string;
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
  coefficient: number;
  classementSecteur: number;
  classementGeneral: number;
  lastValidEntry?: Date;
}

export default function AdminClassementGeneral() {
  const { 
    competitors: firestoreCompetitors, 
    hourlyEntries: firestoreHourlyEntries, 
    bigCatches: firestoreBigCatches,
    publicAppearanceSettings: firestorePublicSettings,
    auditLog 
  } = useFirestore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('classementGeneral');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterSector, setFilterSector] = useState<string>('all');

  // Convert Firebase data to local format for calculations
  const hourlyDataByCompetitor = useMemo(() => {
    const data: { [competitorId: string]: { [hour: number]: any } } = {};
    
    firestoreHourlyEntries.forEach(entry => {
      if (!data[entry.competitorId]) {
        data[entry.competitorId] = {};
      }
      data[entry.competitorId][entry.hour] = {
        fishCount: entry.fishCount,
        totalWeight: entry.totalWeight,
        status: entry.status,
        timestamp: entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date()
      };
    });
    
    return data;
  }, [firestoreHourlyEntries]);
  
  const bigCatchesByCompetitor = useMemo(() => {
    const data: { [competitorId: string]: any } = {};
    
    firestoreBigCatches.forEach(entry => {
      data[entry.competitorId] = {
        biggestCatch: entry.biggestCatch,
        status: entry.status,
        timestamp: entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date()
      };
    });
    
    return data;
  }, [firestoreBigCatches]);

  // Calculate data for all competitors across all sectors
  const calculatedCompetitors = useMemo(() => {
    // First, calculate basic stats for each competitor
    const allCompetitors: CalculatedCompetitor[] = firestoreCompetitors.map(competitor => {
      let nbPrisesGlobal = 0;
      let poidsTotal = 0;
      let lastValidEntry: Date | undefined;
      
      // Sum across all 7 hours
      for (let hour = 1; hour <= 7; hour++) {
        const entry = hourlyDataByCompetitor[competitor.id]?.[hour];
        
        if (entry && ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status)) {
          nbPrisesGlobal += entry.fishCount;
          poidsTotal += entry.totalWeight;
          
          if (entry.timestamp && (!lastValidEntry || entry.timestamp > lastValidEntry)) {
            lastValidEntry = entry.timestamp;
          }
        }
      }
      
      // Get grosse prise
      const grossePriseEntry = bigCatchesByCompetitor[competitor.id];
      const grossePrise = grossePriseEntry && ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(grossePriseEntry.status) 
        ? grossePriseEntry.biggestCatch 
        : 0;
      
      // Calculate points: (Nb Prises global × 50) + Poids Total global
      const points = (nbPrisesGlobal * 50) + poidsTotal;
      
      return {
        id: competitor.id,
        boxNumber: competitor.boxNumber,
        boxCode: competitor.boxCode,
        name: competitor.fullName,
        equipe: competitor.equipe,
        sector: competitor.sector,
        nbPrisesGlobal,
        poidsTotal,
        grossePrise,
        points,
        coefficient: 0, // Will be calculated after we have sector totals
        classementSecteur: 0, // Will be calculated after sorting by sector
        classementGeneral: 0, // Will be calculated with special algorithm
        lastValidEntry
      };
    });

    // Calculate coefficients by sector
    const sectors = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    sectors.forEach(sector => {
      const sectorCompetitors = allCompetitors.filter(comp => comp.sector === sector);
      const sectorTotalNbPrises = sectorCompetitors.reduce((sum, comp) => sum + comp.nbPrisesGlobal, 0);
      
      // Calculate coefficients for this sector
      sectorCompetitors.forEach(comp => {
        if (sectorTotalNbPrises > 0) {
          comp.coefficient = (comp.points * comp.nbPrisesGlobal) / sectorTotalNbPrises;
        } else {
          comp.coefficient = 0;
        }
      });
      
      // Calculate sector rankings (sort by Points desc)
      const sortedSectorCompetitors = [...sectorCompetitors].sort((a, b) => b.points - a.points);
      sortedSectorCompetitors.forEach((comp, index) => {
        comp.classementSecteur = index + 1;
      });
    });

    // Calculate Classement Général using "groupes de place sectorielle" algorithm
    const competitorsWithGeneralRanking = [...allCompetitors];
    
    // Separate competitors with coefficient = 0 (will be ranked 120)
    const zeroCoeffCompetitors = competitorsWithGeneralRanking.filter(comp => comp.coefficient === 0);
    const activeCompetitors = competitorsWithGeneralRanking.filter(comp => comp.coefficient > 0);
    
    // Group active competitors by sector ranking (1st place, 2nd place, etc.)
    const rankGroups: { [rank: number]: CalculatedCompetitor[] } = {};
    
    activeCompetitors.forEach(comp => {
      if (!rankGroups[comp.classementSecteur]) {
        rankGroups[comp.classementSecteur] = [];
      }
      rankGroups[comp.classementSecteur].push(comp);
    });
    
    // Sort each rank group by coefficient (desc), then by grosse prise (desc) for tie-breaking
    Object.keys(rankGroups).forEach(rank => {
      rankGroups[parseInt(rank)].sort((a, b) => {
        if (Math.abs(a.coefficient - b.coefficient) < 0.001) { // Handle floating point precision
          return b.grossePrise - a.grossePrise; // Tie-breaker: grosse prise desc
        }
        return b.coefficient - a.coefficient; // Primary: coefficient desc
      });
    });
    
    // Assign general rankings
    let currentGeneralRank = 1;
    
    // Process rank groups in order (1st places, then 2nd places, etc.)
    for (let sectorRank = 1; sectorRank <= 20; sectorRank++) {
      if (rankGroups[sectorRank]) {
        rankGroups[sectorRank].forEach(comp => {
          comp.classementGeneral = currentGeneralRank++;
        });
      }
    }
    
    // Assign rank 120 to all competitors with coefficient = 0
    zeroCoeffCompetitors.forEach(comp => {
      comp.classementGeneral = 120;
    });
    
    return competitorsWithGeneralRanking;
  }, [firestoreCompetitors, hourlyDataByCompetitor, bigCatchesByCompetitor]);

  // Apply sorting
  const sortedCompetitors = useMemo(() => {
    if (sortField === 'classementGeneral') {
      return calculatedCompetitors; // Already sorted by classement general
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
        case 'sector':
          aValue = a.sector;
          bValue = b.sector;
          break;
        case 'points':
          aValue = a.points;
          bValue = b.points;
          break;
        case 'nbPrisesGlobal':
          aValue = a.nbPrisesGlobal;
          bValue = b.nbPrisesGlobal;
          break;
        case 'grossePrise':
          aValue = a.grossePrise;
          bValue = b.grossePrise;
          break;
        case 'coefficient':
          aValue = a.coefficient;
          bValue = b.coefficient;
          break;
        case 'classementSecteur':
          aValue = a.classementSecteur;
          bValue = b.classementSecteur;
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
    
    // Sector filter
    if (filterSector !== 'all') {
      filtered = filtered.filter(comp => comp.sector === filterSector);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(comp => 
        comp.name.toLowerCase().includes(query) ||
        comp.equipe.toLowerCase().includes(query) ||
        comp.boxCode.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [sortedCompetitors, searchQuery, filterSector]);

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

  const handleDownloadPDF = () => {
    // Log export action to Firebase
    auditLog({
      action: 'EXPORT_GENERAL_RANKING',
      details: `Export PDF classement général - ${filteredCompetitors.length} compétiteurs`,
      metadata: { searchQuery, filterSector, totalCompetitors: filteredCompetitors.length }
    });
    
    const currentDate = new Date().toLocaleDateString('fr-FR', { 
      timeZone: 'Africa/Tunis',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const currentTime = new Date().toLocaleTimeString('fr-FR', {
      timeZone: 'Africa/Tunis',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const logoHtml = firestorePublicSettings?.logos?.light || firestorePublicSettings?.logos?.dark
      ? `<img src="${firestorePublicSettings.logos.light || firestorePublicSettings.logos.dark}" alt="Titanium Tunisia Open" style="height: 80px; margin: 0 auto 20px auto; display: block;" />`
      : `<div style="text-align: center; margin-bottom: 20px;">
           <h1 style="color: #0ea5e9; font-size: 24px; margin: 0;">Titanium Tunisia Open</h1>
         </div>`;

    const tableHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Classement Général - Titanium Tunisia Open</title>
          <style>
            @page { 
              size: A4; 
              margin: 20mm; 
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              font-size: 12px;
              line-height: 1.4;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #0ea5e9;
              padding-bottom: 20px;
            }
            .tagline {
              font-style: italic;
              color: #666;
              margin: 10px 0;
              font-size: 14px;
            }
            .event-info {
              font-weight: bold;
              color: #0ea5e9;
              margin: 10px 0;
              font-size: 16px;
            }
            .disclaimer {
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 10px;
              margin: 20px 0;
              border-radius: 4px;
              font-style: italic;
              text-align: center;
            }
            .meta-info {
              text-align: right;
              margin-bottom: 20px;
              color: #666;
              font-size: 11px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
              font-size: 11px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 6px 8px; 
              text-align: left; 
            }
            th { 
              background-color: #f8f9fa; 
              font-weight: bold;
              font-size: 10px;
              text-transform: uppercase;
            }
            .rank-1 { background-color: #fff3cd; }
            .rank-2 { background-color: #f8f9fa; }
            .rank-3 { background-color: #ffeaa7; }
            .text-center { text-align: center; }
            .font-mono { font-family: 'Courier New', monospace; }
            .sector-A { background-color: #fef3c7; }
            .sector-B { background-color: #dbeafe; }
            .sector-C { background-color: #dcfce7; }
            .sector-D { background-color: #fce7f3; }
            .sector-E { background-color: #f3e8ff; }
            .sector-F { background-color: #fed7d7; }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoHtml}
            <div class="tagline">The most luxurious Surfcasting competition in the world</div>
            <div class="event-info">TITANIUM TUNISIA OPEN - 6 septembre 2025 - Raoued, Tunisie</div>
            <div class="disclaimer">
              Classement provisoire — susceptible d'être modifié jusqu'à publication des résultats officiels.
            </div>
          </div>
          
          <div class="meta-info">
            Généré le ${currentDate} à ${currentTime} (Raoued, Tunisie)
          </div>
          
          <h2 style="color: #0ea5e9; margin-bottom: 20px;">Classement Général</h2>
          
          <table>
            <thead>
              <tr>
                <th>Classement Général</th>
                <th>Box N°</th>
                <th>Compétiteur</th>
                <th>Équipe</th>
                <th>Secteur</th>
                <th>Nb Prises global</th>
                <th>Grosse prise (g)</th>
                <th>Classement secteur</th>
                <th>Coefficient secteur</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCompetitors.map(comp => `
                <tr class="${comp.classementGeneral <= 3 ? `rank-${comp.classementGeneral}` : ''} sector-${comp.sector}">
                  <td class="text-center"><strong>${comp.classementGeneral}</strong></td>
                  <td class="font-mono">${comp.boxCode}</td>
                  <td>${comp.name}</td>
                  <td>${comp.equipe}</td>
                  <td class="text-center">${comp.sector}</td>
                  <td class="text-center">${comp.nbPrisesGlobal}</td>
                  <td class="text-center">${comp.grossePrise > 0 ? formatNumber(comp.grossePrise) : '—'}</td>
                  <td class="text-center">${comp.classementSecteur}</td>
                  <td class="text-center font-mono">${formatCoefficient(comp.coefficient)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 10px;">
            Document généré automatiquement par le système Titanium Tunisia Open
          </div>
        </body>
      </html>
    `.trim();

    // Create and download PDF-ready HTML
    const blob = new Blob([tableHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classement-general-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Classement Général
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Classement par groupes de place sectorielle avec coefficient
            </p>
          </div>
          <Button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exporter PDF</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, équipe ou box..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">Tous les secteurs</option>
            <option value="A">Secteur A</option>
            <option value="B">Secteur B</option>
            <option value="C">Secteur C</option>
            <option value="D">Secteur D</option>
            <option value="E">Secteur E</option>
            <option value="F">Secteur F</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-800">
        <div className="p-6">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                    <tr>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleSort('classementGeneral')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Classement Général</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleSort('boxNumber')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Box N°</span>
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
                        onClick={() => handleSort('sector')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Secteur</span>
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
                        onClick={() => handleSort('coefficient')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Coefficient secteur</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    <AnimatePresence>
                      {filteredCompetitors.map((competitor, index) => {
                        const isTopThree = competitor.classementGeneral <= 3;
                        
                        return (
                          <motion.tr
                            key={competitor.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: index * 0.02 }}
                            className={cn(
                              isTopThree && 'bg-yellow-50 dark:bg-yellow-900/10',
                              'hover:bg-gray-50 dark:hover:bg-gray-800'
                            )}
                          >
                            {/* Classement Général */}
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center space-x-1">
                                {competitor.classementGeneral <= 3 && getRankIcon(competitor.classementGeneral)}
                                <span className={cn('font-bold text-lg', 
                                  competitor.classementGeneral === 1 ? 'text-yellow-600' :
                                  competitor.classementGeneral === 2 ? 'text-gray-500' :
                                  competitor.classementGeneral === 3 ? 'text-amber-600' :
                                  competitor.classementGeneral === 120 ? 'text-red-500' :
                                  'text-ocean-600'
                                )}>
                                  {competitor.classementGeneral}
                                </span>
                              </div>
                            </td>
                            
                            {/* Box Number */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="font-mono font-semibold text-gray-900 dark:text-white">
                                {competitor.boxCode}
                              </span>
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
                            
                            {/* Secteur */}
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <Badge className={getSectorColor(competitor.sector)}>
                                {competitor.sector}
                              </Badge>
                            </td>
                            
                            {/* Nb Prises global */}
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {competitor.nbPrisesGlobal}
                              </span>
                            </td>
                            
                            {/* Grosse prise */}
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {competitor.grossePrise > 0 ? formatNumber(competitor.grossePrise) : '—'}
                              </span>
                            </td>
                            
                            {/* Classement secteur */}
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className="font-semibold text-ocean-600 dark:text-ocean-400">
                                {competitor.classementSecteur}
                              </span>
                            </td>
                            
                            {/* Coefficient secteur */}
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className="font-mono text-sm text-gray-800 dark:text-gray-200">
                                {formatCoefficient(competitor.coefficient)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}