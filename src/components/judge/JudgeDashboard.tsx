'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/components/providers/TranslationProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import dynamic from 'next/dynamic';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { 
  Clock, 
  Users, 
  Fish, 
  Scale, 
  Trophy, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  MapPin,
  Timer,
  Target,
  Award
} from 'lucide-react';

const CountdownOverlay = dynamic(() => import('@/components/ui/CountdownOverlay'), { ssr: false });

export default function JudgeDashboard() {
  const t = useTranslations('common');
  const { currentUser } = useCurrentUser();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [competitionStartTime] = useState(new Date('2025-01-27T08:00:00'));
  
  const judgeSector = currentUser?.sector || 'A';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate competition status
  const competitionStarted = currentTime >= competitionStartTime;
  const timeSinceStart = currentTime.getTime() - competitionStartTime.getTime();
  const currentHour = Math.floor(timeSinceStart / (1000 * 60 * 60)) + 1;
  const timeUntilStart = competitionStartTime.getTime() - currentTime.getTime();

  // Mock data for dashboard
  const dashboardStats = [
    {
      icon: Clock,
      label: 'Heure Actuelle',
      value: competitionStarted ? `H${Math.min(currentHour, 7)}` : 'Not Started',
      change: competitionStarted ? 'Active' : 'Waiting',
      changeType: competitionStarted ? 'positive' : 'neutral',
      color: 'text-ocean-600'
    },
    {
      icon: Users,
      label: 'Compétiteurs de Mon Secteur',
      value: '20',
      change: '20 assigned',
      changeType: 'neutral',
      color: 'text-sand-600'
    },
    {
      icon: Fish,
      label: 'Entrées Terminées',
      value: '45',
      change: '+12 today',
      changeType: 'positive',
      color: 'text-coral-600'
    },
    {
      icon: CheckCircle,
      label: 'Heures Terminées',
      value: '2/7',
      change: 'H1, H2 done',
      changeType: 'positive',
      color: 'text-green-600'
    }
  ];

  const hourlyProgress = [
    { hour: 1, completed: true, entries: 20, total: 20, unlocked: true },
    { hour: 2, completed: true, entries: 20, total: 20, unlocked: true },
    { hour: 3, completed: false, entries: 15, total: 20, unlocked: true },
    { hour: 4, completed: false, entries: 0, total: 20, unlocked: false },
    { hour: 5, completed: false, entries: 0, total: 20, unlocked: false },
    { hour: 6, completed: false, entries: 0, total: 20, unlocked: false },
    { hour: 7, completed: false, entries: 0, total: 20, unlocked: false },
  ];

  const getIconColor = (type: string) => {
    switch (type) {
      case 'entry':
        return 'text-blue-600';
      case 'hour':
        return 'text-orange-600';
      case 'complete':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const recentActivity = [
    {
      id: 1,
      type: 'entry',
      icon: Fish,
      message: 'Entrée H3 terminée pour A15 - Mohamed Taieb Korbi',
      time: 'il y a 2 minutes',
      priority: 'normal',
    },
    {
      id: 2,
      type: 'hour',
      icon: Clock,
      message: 'Heure H3 déverrouillée pour la saisie',
      time: 'il y a 5 minutes',
      priority: 'high',
    },
    {
      id: 3,
      type: 'complete',
      icon: CheckCircle,
      message: 'H2 marquée comme terminée (20/20 entrées)',
      time: 'il y a 1 heure',
      priority: 'normal',
    },
    {
      id: 4,
      type: 'entry',
      icon: Fish,
      message: 'Entrée H2 terminée pour A08 - Foued Baccouche',
      time: 'il y a 1 heure',
      priority: 'normal',
    },
  ];

  const sectorStats = {
    sector: judgeSector,
    totalFish: 234,
    totalWeight: 67.8,
    avgWeight: 2.9,
    topCompetitor: 'Sami Said',
    rank: 1
  };

  return (
    <div className="space-y-6">
      <CountdownOverlay />
      
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-ocean-600 to-ocean-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Tableau de bord - Juge Secteur {judgeSector}
            </h1>
            <p className="text-ocean-100">
              {competitionStarted 
                ? `Compétition active - Actuellement en H${Math.min(currentHour, 7)}`
                : 'La compétition commence bientôt - Préparez-vous pour la saisie'
              }
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold">
              {competitionStarted ? (
                `H${Math.min(currentHour, 7)}`
              ) : (
                `${Math.floor(timeUntilStart / (1000 * 60 * 60)).toString().padStart(2, '0')}:${Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0')}`
              )}
            </div>
            <div className="text-sm text-ocean-200">
              {competitionStarted ? 'Heure actuelle' : 'Temps avant début'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label.replace('Mon Secteur', `Secteur ${judgeSector}`)}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className={`text-xs ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {stat.change}
                  </p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Progress */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Timer className="w-5 h-5 text-ocean-600" />
                <span>Progression horaire - Secteur {judgeSector}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hourlyProgress.map((hour) => (
                  <div key={hour.hour} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        hour.completed ? 'bg-green-100 text-green-600' :
                        hour.unlocked ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {hour.completed ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : hour.unlocked ? (
                          <Clock className="w-6 h-6" />
                        ) : (
                          <Timer className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Heure H{hour.hour}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {hour.entries}/{hour.total} entrées terminées
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            hour.completed ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${(hour.entries / hour.total) * 100}%` }}
                        />
                      </div>
                      <Badge variant={
                        hour.completed ? 'default' : 
                        hour.unlocked ? 'secondary' : 'outline'
                      } className={
                        hour.completed ? 'bg-green-100 text-green-800' :
                        hour.unlocked ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-600'
                      }>
                        {hour.completed ? 'Terminé' : 
                         hour.unlocked ? 'Actif' : 'Verrouillé'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sector Performance */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-ocean-600" />
                <span>Performance Secteur {judgeSector}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-br from-ocean-50 to-sand-50 dark:from-ocean-900/20 dark:to-sand-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-ocean-600 mb-1">
                    Secteur {judgeSector}
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Rank #{sectorStats.rank}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Fish className="w-5 h-5 mx-auto mb-1 text-coral-600" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {sectorStats.totalFish}
                    </div>
                    <div className="text-xs text-gray-500">Poissons</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Scale className="w-5 h-5 mx-auto mb-1 text-sand-600" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {sectorStats.totalWeight}kg
                    </div>
                    <div className="text-xs text-gray-500">Poids</div>
                  </div>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Trophy className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Leader du secteur
                    </span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {sectorStats.topCompetitor}
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {sectorStats.avgWeight}kg
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Poids moyen/poisson
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-ocean-600" />
            <span>Activité récente - Secteur {judgeSector}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <activity.icon className={`w-5 h-5 mt-0.5 ${getIconColor(activity.type)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-300">
                      {activity.time}
                    </span>
                    <Badge variant="secondary" className={`text-xs ${getPriorityColor(activity.priority)}`}>
                      {activity.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}