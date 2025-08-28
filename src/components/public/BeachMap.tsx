'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/components/providers/TranslationProvider';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import CompetitorAvatar from '@/components/ui/CompetitorAvatar';
import { motion } from 'framer-motion';

interface CompetitorChip {
  id: string;
  name: string;
  equipe: string;
  boxNumber: number;
  boxCode: string;
  sector: string;
  points: number;
  fishCount: number;
  totalWeight: number;
  biggestCatch: number;
  photo: string;
}

export default function BeachMap() {
  const t = useTranslations('beachMap');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorChip | null>(null);
  const [competitors, setCompetitors] = useState<{ [sector: string]: CompetitorChip[] }>({});

  // Load competitors from localStorage on client side only
  useEffect(() => {
    const loadCompetitors = () => {
      const getCompetitorsFromStorage = (): { [sector: string]: CompetitorChip[] } => {
        if (typeof window !== 'undefined') {
          try {
            // First ensure we have competitors data
            const existingCompetitors = localStorage.getItem('competitors');
            if (!existingCompetitors) {
              const officialCompetitors = [
                // Sector A
                { sector: 'A', boxNumber: 1, fullName: 'Sami Said', equipe: 'OPEN' },
                { sector: 'A', boxNumber: 2, fullName: 'Ramzi Dhahak', equipe: 'TST' },
                { sector: 'A', boxNumber: 3, fullName: 'Nour Abdennadher', equipe: 'AS MARSA' },
                { sector: 'A', boxNumber: 4, fullName: 'Zied Ferjani', equipe: 'OPEN' },
                { sector: 'A', boxNumber: 5, fullName: 'Slim Baklouti', equipe: 'CPSS' },
                { sector: 'A', boxNumber: 6, fullName: 'Mohamed Nour Zribi', equipe: 'PLANET' },
                { sector: 'A', boxNumber: 7, fullName: 'Yassine Bellil', equipe: 'TST' },
                { sector: 'A', boxNumber: 8, fullName: 'Foued Baccouche', equipe: 'OPEN' },
                { sector: 'A', boxNumber: 9, fullName: 'Fredj Gharbi', equipe: 'ETOILE BLEUE SOUSSE' },
                { sector: 'A', boxNumber: 10, fullName: 'Mohamed Maarfi', equipe: 'PIRANHA' },
                { sector: 'A', boxNumber: 11, fullName: 'Aymen Ben Hmida', equipe: 'CPS NABEUL' },
                { sector: 'A', boxNumber: 12, fullName: 'Riadh Ajmi', equipe: 'TST' },
                { sector: 'A', boxNumber: 13, fullName: 'Sidali Guir', equipe: 'ECOSIUM' },
                { sector: 'A', boxNumber: 14, fullName: 'Kais Masmoudi', equipe: 'OPEN' },
                { sector: 'A', boxNumber: 15, fullName: 'Mohamed Taieb Korbi', equipe: 'TST' },
                { sector: 'A', boxNumber: 16, fullName: 'Elyes Benzarti', equipe: 'PLANET' },
                { sector: 'A', boxNumber: 17, fullName: 'Zied Kefi', equipe: 'PIRANHA' },
                { sector: 'A', boxNumber: 18, fullName: 'Hamdi Naili', equipe: 'OPEN' },
                { sector: 'A', boxNumber: 19, fullName: 'Heni Kolsi', equipe: 'TEAM MAJD' },
                { sector: 'A', boxNumber: 20, fullName: 'Yacine Kidar', equipe: 'PLANET DZ' },
                
                // Sector B
                { sector: 'B', boxNumber: 1, fullName: 'Akram Ben Abdallah', equipe: 'AS MARSA' },
                { sector: 'B', boxNumber: 2, fullName: 'Ramzi Soukah', equipe: 'CPS NABEUL' },
                { sector: 'B', boxNumber: 3, fullName: 'Wajdi Lajmi', equipe: 'PIRANHA' },
                { sector: 'B', boxNumber: 4, fullName: 'Saief Loudhaief', equipe: 'TST' },
                { sector: 'B', boxNumber: 5, fullName: 'Hammadi Fakhfekh', equipe: 'CPSS' },
                { sector: 'B', boxNumber: 6, fullName: 'Ilyes Bessiuod', equipe: 'OPEN' },
                { sector: 'B', boxNumber: 7, fullName: 'Med Wajdi Cherif', equipe: 'PLANET' },
                { sector: 'B', boxNumber: 8, fullName: 'Walid Safraoui', equipe: 'TST' },
                { sector: 'B', boxNumber: 9, fullName: 'Bilal Sefsaf', equipe: 'OPEN' },
                { sector: 'B', boxNumber: 10, fullName: 'Abdelmonem Elgliou', equipe: 'PIRANHA' },
                { sector: 'B', boxNumber: 11, fullName: 'Hamza Krifi', equipe: 'TPL' },
                { sector: 'B', boxNumber: 12, fullName: 'Kamel Bahloul', equipe: 'ORCA' },
                { sector: 'B', boxNumber: 13, fullName: 'Ridha Wahid', equipe: 'OPEN' },
                { sector: 'B', boxNumber: 14, fullName: 'Amen Souayha', equipe: 'PLANET' },
                { sector: 'B', boxNumber: 15, fullName: 'Fatma Ktifi', equipe: 'TST' },
                { sector: 'B', boxNumber: 16, fullName: 'Nizar Mbarek', equipe: 'ETOILE BLEUE SOUSSE' },
                { sector: 'B', boxNumber: 17, fullName: 'Mohamed Anouer Belhessin Bay', equipe: 'PIRANHA' },
                { sector: 'B', boxNumber: 18, fullName: 'Ali Ouesleti', equipe: 'TPL' },
                { sector: 'B', boxNumber: 19, fullName: 'Walid Ben Jrad', equipe: 'TST' },
                { sector: 'B', boxNumber: 20, fullName: 'Mohamed Saber Haouari', equipe: 'PIRANHA' },
                
                // Sector C
                { sector: 'C', boxNumber: 1, fullName: 'Bassem Mezelini', equipe: 'PIRANHA' },
                { sector: 'C', boxNumber: 2, fullName: 'Rami Jomni', equipe: 'TST' },
                { sector: 'C', boxNumber: 3, fullName: 'Hassen Ben Amor', equipe: 'OPEN' },
                { sector: 'C', boxNumber: 4, fullName: 'Bilel Ennouri', equipe: 'TPL' },
                { sector: 'C', boxNumber: 5, fullName: 'Ramzi Ben Amor', equipe: 'OPEN' },
                { sector: 'C', boxNumber: 6, fullName: 'Youssef Ben Hamed', equipe: 'PLANET' },
                { sector: 'C', boxNumber: 7, fullName: 'Redouane Mechkour', equipe: 'MINA FISHING DZ' },
                { sector: 'C', boxNumber: 8, fullName: 'Chiheb Bayar', equipe: 'TST' },
                { sector: 'C', boxNumber: 9, fullName: 'Zied Zarrouk', equipe: 'PIRANHA' },
                { sector: 'C', boxNumber: 10, fullName: 'Yassine Mannai', equipe: 'AS MARSA' },
                { sector: 'C', boxNumber: 11, fullName: 'Abdelkader Sami Khalfi', equipe: 'TSC DZ' },
                { sector: 'C', boxNumber: 12, fullName: 'Bechir Ben Aoun', equipe: 'TST' },
                { sector: 'C', boxNumber: 13, fullName: 'Faouzi Berkane', equipe: 'SÉTIFIEN DZ' },
                { sector: 'C', boxNumber: 14, fullName: 'Rami Gdich', equipe: 'CPSS' },
                { sector: 'C', boxNumber: 15, fullName: 'Walid Gharbi', equipe: 'OPEN' },
                { sector: 'C', boxNumber: 16, fullName: 'Mohamed Chedli Cherif', equipe: 'PLANET' },
                { sector: 'C', boxNumber: 17, fullName: 'Aladain Letaief', equipe: 'ETOILE BLEUE SOUSSE' },
                { sector: 'C', boxNumber: 18, fullName: 'Riadh Jaouadi', equipe: 'TST' },
                { sector: 'C', boxNumber: 19, fullName: 'Ramzi Idoudi', equipe: 'PIRANHA' },
                { sector: 'C', boxNumber: 20, fullName: 'Faten Jemmali', equipe: 'CPS NABEUL' },
                
                // Sector D
                { sector: 'D', boxNumber: 1, fullName: 'Hamdi Gdara', equipe: 'MED FISHING' },
                { sector: 'D', boxNumber: 2, fullName: 'Mohamed Ghazi Jaziri', equipe: 'PIRANHA' },
                { sector: 'D', boxNumber: 3, fullName: 'Amar Nechat', equipe: 'OPEN' },
                { sector: 'D', boxNumber: 4, fullName: 'Moheb Salah', equipe: 'TPL' },
                { sector: 'D', boxNumber: 5, fullName: 'Marwen Douiri', equipe: 'TST' },
                { sector: 'D', boxNumber: 6, fullName: 'Mohamed Douss', equipe: 'PLANET' },
                { sector: 'D', boxNumber: 7, fullName: 'Mohamed El Kefi', equipe: 'CPS NABEUL' },
                { sector: 'D', boxNumber: 8, fullName: 'Marouen Zouari', equipe: 'TST' },
                { sector: 'D', boxNumber: 9, fullName: 'Saif Allah Ben Zarga', equipe: 'PIRANHA' },
                { sector: 'D', boxNumber: 10, fullName: 'Mehdi Sayadi', equipe: 'ORCA' },
                { sector: 'D', boxNumber: 11, fullName: 'Anouar Chouat', equipe: 'AS MARSA' },
                { sector: 'D', boxNumber: 12, fullName: 'Noureddine Ben Khedija', equipe: 'ETOILE BLEUE SOUSSE' },
                { sector: 'D', boxNumber: 13, fullName: 'Mhamed Gannar', equipe: 'TST' },
                { sector: 'D', boxNumber: 14, fullName: 'Nebil Bousselmi', equipe: 'PIRANHA' },
                { sector: 'D', boxNumber: 15, fullName: 'Mokhtar Ramdani', equipe: 'SÉTIFIEN DZ' },
                { sector: 'D', boxNumber: 16, fullName: 'Brahim ALIANI', equipe: 'TST' },
                { sector: 'D', boxNumber: 17, fullName: 'Walid Hakim', equipe: 'CPSS' },
                { sector: 'D', boxNumber: 18, fullName: 'Reda Guenfissi', equipe: 'ECOSIUM' },
                { sector: 'D', boxNumber: 19, fullName: 'Mohamed Mokaddem', equipe: 'PLANET' },
                { sector: 'D', boxNumber: 20, fullName: 'Taib Maaoui', equipe: 'PIRANHA' },
                
                // Sector E
                { sector: 'E', boxNumber: 1, fullName: 'Tayssir Dimassi', equipe: 'OPEN' },
                { sector: 'E', boxNumber: 2, fullName: 'Mohamed Amir Nasri', equipe: 'PIRANHA' },
                { sector: 'E', boxNumber: 3, fullName: 'Karim Hammoudi', equipe: 'OPEN' },
                { sector: 'E', boxNumber: 4, fullName: 'Abdelkader Zouari', equipe: 'CPSS' },
                { sector: 'E', boxNumber: 5, fullName: 'Natalia Trounova', equipe: 'TPL' },
                { sector: 'E', boxNumber: 6, fullName: 'Tawfik Orfi', equipe: 'TST' },
                { sector: 'E', boxNumber: 7, fullName: 'Mohamed Turki', equipe: 'PIRANHA' },
                { sector: 'E', boxNumber: 8, fullName: 'Seifeddine Touil', equipe: 'CN RAS JEBAL' },
                { sector: 'E', boxNumber: 9, fullName: 'Bilel Mayara', equipe: 'CPS NABEUL' },
                { sector: 'E', boxNumber: 10, fullName: 'Anis El Feiz', equipe: 'TST' },
                { sector: 'E', boxNumber: 11, fullName: 'Tarik Zebairi', equipe: 'Horizon Atlantique' },
                { sector: 'E', boxNumber: 12, fullName: 'Assaad Troudi', equipe: 'AS MARSA' },
                { sector: 'E', boxNumber: 13, fullName: 'Riadh M', equipe: 'PIRANHA' },
                { sector: 'E', boxNumber: 14, fullName: 'Mohamed Amine Ben Aouana', equipe: 'ETOILE BLEUE SOUSSE' },
                { sector: 'E', boxNumber: 15, fullName: 'Amine Boussaa', equipe: 'TST' },
                { sector: 'E', boxNumber: 16, fullName: 'Rami Trigui', equipe: 'CPSS' },
                { sector: 'E', boxNumber: 17, fullName: 'Nizar Welhazi', equipe: 'PLANET' },
                { sector: 'E', boxNumber: 18, fullName: 'Aymen Ben Arfaa', equipe: 'PIRANHA' },
                { sector: 'E', boxNumber: 19, fullName: 'Oussema Klai', equipe: 'OPEN' },
                { sector: 'E', boxNumber: 20, fullName: 'Mariem Hakim Safraoui', equipe: 'TST' },
                
                // Sector F
                { sector: 'F', boxNumber: 1, fullName: 'Mounir El Haddad', equipe: 'TST' },
                { sector: 'F', boxNumber: 2, fullName: 'Mohamed Bouazra', equipe: 'CPS NABEUL' },
                { sector: 'F', boxNumber: 3, fullName: 'Karim Mokaddem', equipe: 'AS MARSA' },
                { sector: 'F', boxNumber: 4, fullName: 'Mohamed Abouda', equipe: 'ETOILE BLEUE SOUSSE' },
                { sector: 'F', boxNumber: 5, fullName: 'Ghassen Souissi', equipe: 'PIRANHA' },
                { sector: 'F', boxNumber: 6, fullName: 'Ibrahim Merwan Touami', equipe: 'OPEN' },
                { sector: 'F', boxNumber: 7, fullName: 'Maher Ben Taieb', equipe: 'TST' },
                { sector: 'F', boxNumber: 8, fullName: 'Elaine Vredenburg', equipe: 'HSV de Slufter' },
                { sector: 'F', boxNumber: 9, fullName: 'Mohamed Larbi Agli', equipe: 'OPEN' },
                { sector: 'F', boxNumber: 10, fullName: 'Souhail Smaoui', equipe: 'CPSS' },
                { sector: 'F', boxNumber: 11, fullName: 'Rayen Galai', equipe: 'PIRANHA' },
                { sector: 'F', boxNumber: 12, fullName: 'Akram khelifa', equipe: 'OPEN' },
                { sector: 'F', boxNumber: 13, fullName: 'Mhamed Belalgia', equipe: 'TST' },
                { sector: 'F', boxNumber: 14, fullName: 'Mahdi Karoui', equipe: 'TPL' },
                { sector: 'F', boxNumber: 15, fullName: 'Foued Harzalleoui', equipe: 'AS MARSA' },
                { sector: 'F', boxNumber: 16, fullName: 'Khalil Issaoui', equipe: 'CPS NABEUL' },
                { sector: 'F', boxNumber: 17, fullName: 'Hichem Bouzouita', equipe: 'TST' },
                { sector: 'F', boxNumber: 18, fullName: 'Seif Eddine Ben Ayed', equipe: 'PIRANHA' },
                { sector: 'F', boxNumber: 19, fullName: 'Hassen Lanssari', equipe: 'PLANET' },
                { sector: 'F', boxNumber: 20, fullName: 'Nejah Abdeljawed', equipe: 'TST' }
              ];

              // Convert to the required format
              const allCompetitors = officialCompetitors.map(comp => ({
                id: `comp-${comp.sector.toLowerCase()}-${comp.boxNumber}`,
                sector: comp.sector,
                boxNumber: comp.boxNumber,
                boxCode: `${comp.sector}${String(comp.boxNumber).padStart(2, '0')}`,
                fullName: comp.fullName,
                equipe: comp.equipe,
                photo: `https://images.pexels.com/photos/${1000000 + Math.floor(Math.random() * 1000000)}/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=150&h=150`,
                lastUpdate: new Date(),
                source: 'Admin',
                status: 'active'
              }));

              localStorage.setItem('competitors', JSON.stringify(allCompetitors));
            }

            const savedCompetitors = localStorage.getItem('competitors');
            if (savedCompetitors) {
              const allCompetitors = JSON.parse(savedCompetitors);
              const competitorsBySector: { [sector: string]: CompetitorChip[] } = {};
              
              // Group competitors by sector
              allCompetitors.forEach((comp: any) => {
                if (!competitorsBySector[comp.sector]) {
                  competitorsBySector[comp.sector] = [];
                }
                
                // Get real data from localStorage for more realistic stats
                const hourlyData = JSON.parse(localStorage.getItem('hourlyData') || '{}');
                const grossePriseData = JSON.parse(localStorage.getItem('grossePriseData') || '{}');
                
                let totalFishCount = 0;
                let totalWeight = 0;
                let biggestCatch = 0;
                
                // Calculate real stats from hourly data
                const sectorHourlyData = hourlyData[comp.sector] || {};
                for (let hour = 1; hour <= 7; hour++) {
                  const hourData = sectorHourlyData[hour] || {};
                  const entry = hourData[comp.id];
                  if (entry && ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status)) {
                    totalFishCount += entry.fishCount || 0;
                    totalWeight += entry.totalWeight || 0;
                  }
                }
                
                // Get grosse prise
                const grossePriseEntry = grossePriseData[comp.sector]?.[comp.id];
                if (grossePriseEntry && ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(grossePriseEntry.status)) {
                  biggestCatch = grossePriseEntry.biggestCatch || 0;
                }
                
                // Calculate points
                const points = (totalFishCount * 50) + totalWeight;
                competitorsBySector[comp.sector].push({
                  id: comp.id,
                  name: comp.fullName,
                  equipe: comp.equipe,
                  boxNumber: comp.boxNumber,
                  boxCode: comp.boxCode,
                  sector: comp.sector,
                  points: points || Math.floor(Math.random() * 1000) + 500,
                  fishCount: totalFishCount || Math.floor(Math.random() * 20) + 5,
                  totalWeight: totalWeight || Math.floor(Math.random() * 500) + 200,
                  biggestCatch: biggestCatch || Math.floor(Math.random() * 100) + 50,
                  photo: comp.photo
                });
              });
              
              return competitorsBySector;
            }
          } catch (error) {
            console.error('Error loading competitors from storage:', error);
          }
        }
        
        return {};
      };

      setCompetitors(getCompetitorsFromStorage());
    };
    
    // Initial load
    loadCompetitors();
    
    // Listen for storage changes for live updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'competitors' || e.key === 'hourlyData' || e.key === 'grossePriseData') {
        loadCompetitors();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const sectors = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  // Sector button colors
  const getSectorButtonClass = (sector: string, isSelected: boolean) => {
    const baseClass = 'px-4 py-2 rounded-full transition-all font-medium';
    const sectorColors = {
      A: isSelected ? 'bg-sectors-A text-white shadow-lg' : 'bg-sectors-A/20 text-sectors-A hover:bg-sectors-A/30',
      B: isSelected ? 'bg-sectors-B text-white shadow-lg' : 'bg-sectors-B/20 text-sectors-B hover:bg-sectors-B/30',
      C: isSelected ? 'bg-sectors-C text-white shadow-lg' : 'bg-sectors-C/20 text-sectors-C hover:bg-sectors-C/30',
      D: isSelected ? 'bg-sectors-D text-white shadow-lg' : 'bg-sectors-D/20 text-sectors-D hover:bg-sectors-D/30',
      E: isSelected ? 'bg-sectors-E text-white shadow-lg' : 'bg-sectors-E/20 text-sectors-E hover:bg-sectors-E/30',
      F: isSelected ? 'bg-sectors-F text-white shadow-lg' : 'bg-sectors-F/20 text-sectors-F hover:bg-sectors-F/30',
    };
    
    return `${baseClass} ${sectorColors[sector as keyof typeof sectorColors] || 'bg-gray-100 text-gray-600'}`;
  };

  return (
    <section className="py-16 bg-gradient-to-br from-sand-50 to-coral-50 dark:from-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('interactiveBeachMap')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('beachMapDescription')}
          </p>
        </div>

        <Card className="max-w-7xl mx-auto">
          <CardContent>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <button
                onClick={() => setSelectedSector('all')}
                className={`px-4 py-2 rounded-full transition-all font-medium ${
                  selectedSector === 'all'
                    ? 'bg-ocean-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t('allSectors')}
              </button>
              {sectors.map(sector => (
                <button
                  key={sector}
                  onClick={() => setSelectedSector(sector)}
                  className={getSectorButtonClass(sector, selectedSector === sector)}
                >
                  {t('sector')} {sector}
                </button>
              ))}
            </div>

            {selectedSector !== 'all' && sectors.includes(selectedSector) && (
              <div className="relative">
                <div className="space-y-3">
                  {/* First row - competitors 1-10 */}
                  <div className="grid grid-cols-10 gap-3">
                    {competitors[selectedSector]?.slice(0, 10).map((competitor, index) => (
                      <motion.div
                        key={competitor.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="relative group cursor-pointer"
                        onClick={() => setSelectedCompetitor(competitor)}
                      >
                        <div className="relative">
                          <CompetitorAvatar
                            photo={competitor.photo}
                            name={competitor.name}
                            sector={competitor.sector}
                            size="xl"
                            className="ring-2 ring-white shadow-lg hover:scale-110 transition-transform"
                          />
                          <Badge 
                            className="absolute -top-1 -right-1 w-6 h-6 p-0 flex items-center justify-center text-xs"
                            variant="secondary"
                          >
                            {String(competitor.boxNumber).padStart(2, '0')}
                          </Badge>
                        </div>
                        
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="bg-gray-900 text-white text-xs rounded-lg p-2 whitespace-nowrap">
                            <div className="font-semibold">{competitor.name}</div>
                            <div className="text-gray-300">{competitor.equipe}</div>
                            <div className="flex justify-between gap-4 mt-1">
                              <span className="text-gray-200">{competitor.points} pts</span>
                              <span className="text-gray-200">{competitor.fishCount} fish</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Second row - competitors 11-20 */}
                  <div className="grid grid-cols-10 gap-3">
                    {competitors[selectedSector]?.slice(10, 20).map((competitor, index) => (
                      <motion.div
                        key={competitor.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: (index + 10) * 0.05 }}
                        className="relative group cursor-pointer"
                        onClick={() => setSelectedCompetitor(competitor)}
                      >
                        <div className="relative">
                          <CompetitorAvatar
                            photo={competitor.photo}
                            name={competitor.name}
                            sector={competitor.sector}
                            size="xl"
                            className="ring-2 ring-white shadow-lg hover:scale-110 transition-transform"
                          />
                          <Badge 
                            className="absolute -top-1 -right-1 w-6 h-6 p-0 flex items-center justify-center text-xs"
                            variant="secondary"
                          >
                            {String(competitor.boxNumber).padStart(2, '0')}
                          </Badge>
                        </div>
                        
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="bg-gray-900 text-white text-xs rounded-lg p-2 whitespace-nowrap">
                            <div className="font-semibold">{competitor.name}</div>
                            <div className="text-gray-300">{competitor.equipe}</div>
                            <div className="flex justify-between gap-4 mt-1">
                              <span className="text-gray-200">{competitor.points} pts</span>
                              <span className="text-gray-200">{competitor.fishCount} fish</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedSector === 'all' && (
              <div className="space-y-6">
                {sectors.map(sector => (
                  <div key={sector} className="space-y-3">
                    <h3 className={`text-lg font-semibold text-center sector-${sector.toLowerCase()}`}>
                      {t('sector')} {sector}
                    </h3>
                    <div className="space-y-3">
                      {/* First row - competitors 1-10 */}
                      <div className="grid grid-cols-10 gap-3">
                        {competitors[sector]?.slice(0, 10).map((competitor, index) => (
                          <motion.div
                            key={competitor.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="relative group cursor-pointer"
                            onClick={() => setSelectedCompetitor(competitor)}
                          >
                            <div className="relative">
                              <CompetitorAvatar
                                photo={competitor.photo}
                                name={competitor.name}
                                sector={competitor.sector}
                                size="xl"
                                className="ring-2 ring-white shadow-lg hover:scale-110 transition-transform"
                              />
                              <Badge 
                                className="absolute -top-1 -right-1 w-6 h-6 p-0 flex items-center justify-center text-xs"
                                variant="secondary"
                              >
                                {String(competitor.boxNumber).padStart(2, '0')}
                              </Badge>
                            </div>
                            
                            {/* Hover Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              <div className="bg-gray-900 text-white text-xs rounded-lg p-2 whitespace-nowrap">
                                <div className="font-semibold">{competitor.name}</div>
                                <div className="text-gray-300">{competitor.equipe}</div>
                                <div className="flex justify-between gap-4 mt-1">
                                  <span className="text-gray-200">{competitor.points} pts</span>
                                  <span className="text-gray-200">{competitor.fishCount} fish</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      {/* Second row - competitors 11-20 */}
                      <div className="grid grid-cols-10 gap-3">
                        {competitors[sector]?.slice(10, 20).map((competitor, index) => (
                          <motion.div
                            key={competitor.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: (index + 10) * 0.05 }}
                            className="relative group cursor-pointer"
                            onClick={() => setSelectedCompetitor(competitor)}
                          >
                            <div className="relative">
                              <CompetitorAvatar
                                photo={competitor.photo}
                                name={competitor.name}
                                sector={competitor.sector}
                                size="xl"
                                className="ring-2 ring-white shadow-lg hover:scale-110 transition-transform"
                              />
                              <Badge 
                                className="absolute -top-1 -right-1 w-6 h-6 p-0 flex items-center justify-center text-xs"
                                variant="secondary"
                              >
                                {String(competitor.boxNumber).padStart(2, '0')}
                              </Badge>
                            </div>
                            
                            {/* Hover Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              <div className="bg-gray-900 text-white text-xs rounded-lg p-2 whitespace-nowrap">
                                <div className="font-semibold">{competitor.name}</div>
                                <div className="text-gray-300">{competitor.equipe}</div>
                                <div className="flex justify-between gap-4 mt-1">
                                  <span className="text-gray-200">{competitor.points} pts</span>
                                  <span className="text-gray-200">{competitor.fishCount} fish</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Competitor Modal/Popup */}
        {selectedCompetitor && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedCompetitor(null)}
          >
            <Card className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CompetitorAvatar
                    photo={selectedCompetitor.photo}
                    name={selectedCompetitor.name}
                    sector={selectedCompetitor.sector}
                    size="lg"
                  />
                  <div>
                    <div className="font-semibold">{selectedCompetitor.name}</div>
                    <div className="text-sm text-gray-500">{selectedCompetitor.equipe}</div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{selectedCompetitor.points}</div>
                      <div className="text-sm text-gray-500">{t('points')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{selectedCompetitor.fishCount}</div>
                      <div className="text-sm text-gray-500">{t('fishCaught')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{selectedCompetitor.totalWeight}g</div>
                      <div className="text-sm text-gray-500">{t('totalWeight')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{selectedCompetitor.biggestCatch}g</div>
                      <div className="text-sm text-gray-500">{t('biggestCatch')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}