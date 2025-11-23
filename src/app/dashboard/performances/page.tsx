'use client';

import { useMemo } from 'react';
import {
  Target,
  TrendingUp,
  Award,
  Trophy,
  Zap,
  Calendar,
  Euro,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { useActivities } from '@/hooks/useActivities';
import { useReviews } from '@/hooks/useReviews';

interface Goal {
  name: string;
  current: number;
  target: number;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface Salesperson {
  id: string;
  name: string;
  avatar: string;
  deals: number;
  ca: number;
  meetings: number;
  rank: number;
  badge: string;
  badgeColor: string;
  bonus: number;
}

interface DealWithOwner {
  id: string;
  stage: string;
  value: number;
  closedAt?: Date | string | null;
  ownerId?: string | null;
}

interface OwnerData {
  id: string;
  name: string;
  deals: DealWithOwner[];
}

export default function PerformancesPage() {
  const { deals, isLoading: dealsLoading, isError: dealsError } = useDeals();
  const { activities, isLoading: activitiesLoading, isError: activitiesError } = useActivities();
  const { stats: reviewStats, isLoading: reviewsLoading } = useReviews();

  // Calculer les objectifs du mois
  const goals: Goal[] = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const wonDealsThisMonth = deals.filter(
      d => d.productionStage === 'ENCAISSE' && d.closedAt && new Date(d.closedAt) >= monthStart
    );
    const caThisMonth = wonDealsThisMonth.reduce((sum, d) => sum + d.value, 0);

    const meetingsThisMonth = activities.filter(
      a => (a.type === 'REUNION' || a.type === 'VISIO') &&
           new Date(a.scheduledAt) >= monthStart
    ).length;

    return [
      {
        name: 'Chiffre d\'affaires',
        current: caThisMonth,
        target: 60000,
        unit: '€',
        icon: Euro,
        color: 'from-green-500 to-green-600',
      },
      {
        name: 'Rendez-vous',
        current: meetingsThisMonth,
        target: 30,
        unit: 'RDV',
        icon: Calendar,
        color: 'from-violet-600 to-violet-700',
      },
      {
        name: 'Deals signés',
        current: wonDealsThisMonth.length,
        target: 12,
        unit: 'deals',
        icon: CheckCircle2,
        color: 'from-orange-500 to-orange-600',
      },
    ];
  }, [deals, activities]);

  // Calculer le classement des commerciaux
  const salespeople: Salesperson[] = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Grouper les deals par owner
    const dealsByOwner = deals.reduce((acc, deal) => {
      if (!deal.users) return acc;

      const ownerId = deal.users.id;
      if (!acc[ownerId]) {
        acc[ownerId] = {
          id: ownerId,
          name: `${deal.users.firstName} ${deal.users.lastName}`,
          deals: [],
        };
      }

      acc[ownerId].deals.push(deal);
      return acc;
    }, {} as Record<string, OwnerData>);

    // Calculer les stats pour chaque commercial
    const stats = Object.values(dealsByOwner).map((owner: OwnerData) => {
      const wonDeals = owner.deals.filter((d: DealWithOwner) =>
        d.stage === 'GAGNE' && d.closedAt && new Date(d.closedAt) >= monthStart
      );
      const ca = wonDeals.reduce((sum: number, d: DealWithOwner) => sum + d.value, 0);

      const ownerActivities = activities.filter(a => a.assignedToId === owner.id);
      const meetings = ownerActivities.filter(
        a => (a.type === 'REUNION' || a.type === 'VISIO') &&
             new Date(a.scheduledAt) >= monthStart
      ).length;

      return {
        id: owner.id,
        name: owner.name,
        avatar: `${owner.name.split(' ')[0]?.[0] || ''}${owner.name.split(' ')[1]?.[0] || ''}`.toUpperCase(),
        deals: wonDeals.length,
        ca,
        meetings,
      };
    });

    // Trier par CA et attribuer les rangs
    const sorted = stats.sort((a, b) => b.ca - a.ca);

    return sorted.map((person, index) => ({
      ...person,
      rank: index + 1,
      badge: index === 0 ? 'Top Performer' : index === 1 ? 'Excellence' : 'Rising Star',
      badgeColor: index === 0
        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
        : index === 1
        ? 'bg-gradient-to-r from-gray-300 to-gray-400'
        : 'bg-gradient-to-r from-orange-400 to-orange-500',
      bonus: index === 0 ? 500 : index === 1 ? 300 : 200,
    }));
  }, [deals, activities]);

  // Calculer les achievements dynamiquement
  const achievements = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    // Deal Master: 10 deals signés ce mois
    const dealsThisMonth = deals.filter(
      d => d.productionStage === 'ENCAISSE' && d.closedAt && new Date(d.closedAt) >= monthStart
    ).length;
    const dealMasterProgress = Math.min(Math.round((dealsThisMonth / 10) * 100), 100);

    // Speed Closer: 5 deals signés en 1 semaine
    const dealsThisWeek = deals.filter(
      d => d.productionStage === 'ENCAISSE' && d.closedAt && new Date(d.closedAt) >= weekStart
    ).length;
    const speedCloserProgress = Math.min(Math.round((dealsThisWeek / 5) * 100), 100);

    // Client Champion: 95% de satisfaction client (basé sur la moyenne des reviews)
    const avgRating = reviewStats?.avgRating || 0;
    const satisfactionPercent = (avgRating / 5) * 100;
    const clientChampionProgress = Math.min(Math.round(satisfactionPercent), 100);

    return [
      {
        name: 'Deal Master',
        description: '10 deals signés ce mois',
        progress: dealMasterProgress,
        icon: Trophy,
        color: 'text-yellow-500',
      },
      {
        name: 'Speed Closer',
        description: '5 deals signés en 1 semaine',
        progress: speedCloserProgress,
        icon: Zap,
        color: 'text-violet-600',
      },
      {
        name: 'Client Champion',
        description: '95% de satisfaction client',
        progress: clientChampionProgress,
        icon: Award,
        color: 'text-orange-500',
      },
    ];
  }, [deals, reviewStats]);

  if (dealsLoading || activitiesLoading || reviewsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      </div>
    );
  }

  if (dealsError || activitiesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Erreur lors du chargement</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 to-orange-500 bg-clip-text text-transparent">
            Performances
          </h1>
          <p className="mt-2 text-gray-600">
            Suivez vos objectifs et votre progression commerciale
          </p>
        </div>

        {/* Monthly Goals */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="h-6 w-6 text-violet-600" />
            <h2 className="text-xl font-bold text-gray-900">Objectifs du mois</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {goals.map((goal) => {
              const Icon = goal.icon;
              const percentage = Math.round((goal.current / goal.target) * 100);
              return (
                <div key={goal.name} className="card-premium p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${goal.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{goal.name}</h3>
                  <div className="flex items-baseline space-x-2 mb-3">
                    <span className="text-2xl font-bold text-gray-900">
                      {goal.current.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {goal.target.toLocaleString()} {goal.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${goal.color} transition-all duration-500`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  {percentage >= 100 && (
                    <div className="mt-3 flex items-center text-green-600 text-sm font-semibold">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Objectif atteint !
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Trophy className="h-6 w-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">Classement de l&apos;équipe</h2>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200">
              {salespeople.map((person) => (
                <div
                  key={person.id}
                  className={`p-6 hover:bg-gray-50 transition ${
                    person.rank === 1 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Left Section */}
                    <div className="flex items-center space-x-4">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-12 text-center">
                        {person.rank === 1 ? (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                            <Trophy className="h-6 w-6 text-white" />
                          </div>
                        ) : (
                          <div className="text-3xl font-bold text-gray-400">#{person.rank}</div>
                        )}
                      </div>

                      {/* Avatar & Info */}
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">{person.avatar}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{person.name}</h3>
                          <span className={`inline-block px-3 py-1 text-xs font-bold text-white ${person.badgeColor} rounded-full`}>
                            {person.badge}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{person.deals}</div>
                        <div className="text-xs text-gray-500">Deals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {person.ca.toLocaleString()} €
                        </div>
                        <div className="text-xs text-gray-500">CA généré</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-violet-600">{person.meetings}</div>
                        <div className="text-xs text-gray-500">RDV</div>
                      </div>
                      {person.bonus > 0 && (
                        <div className="text-center bg-green-100 px-4 py-2 rounded-lg">
                          <div className="text-lg font-bold text-green-700">+{person.bonus} €</div>
                          <div className="text-xs text-green-600">Prime</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Award className="h-6 w-6 text-violet-600" />
            <h2 className="text-xl font-bold text-gray-900">Badges & Réalisations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={achievement.name}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-100 to-orange-100 flex items-center justify-center">
                        <Icon className={`h-7 w-7 ${achievement.color}`} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {achievement.name}
                      </h3>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progression</span>
                      <span className="font-semibold text-gray-900">{achievement.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-orange-500 transition-all duration-500"
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                  </div>
                  {achievement.progress >= 100 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="inline-flex items-center text-green-600 text-sm font-semibold">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Badge débloqué !
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="mt-8 bg-gradient-to-r from-violet-700 to-orange-500 rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Excellente performance ce mois !</h2>
              <p className="text-violet-100">
                Vous êtes sur la bonne voie pour atteindre tous vos objectifs. Continuez comme ça !
              </p>
            </div>
            <div className="flex-shrink-0">
              <TrendingUp className="h-16 w-16 text-white opacity-80" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
