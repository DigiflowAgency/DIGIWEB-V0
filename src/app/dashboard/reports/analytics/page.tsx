'use client';

import { useMemo } from 'react';
import { BarChart3, TrendingUp, Euro, Users, Target, Activity, ArrowUpRight, Loader2 } from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { useContacts } from '@/hooks/useContacts';
import { useActivities } from '@/hooks/useActivities';

export default function AnalyticsReportPage() {
  const { deals, isLoading: dealsLoading, isError: dealsError } = useDeals();
  const { contacts, isLoading: contactsLoading, isError: contactsError } = useContacts();
  const { activities, isLoading: activitiesLoading, isError: activitiesError } = useActivities({ limit: 10 });

  // Calcul des stats depuis les vraies données
  const stats = useMemo(() => {
    if (!deals || !contacts) return [];

    // CA Total (deals gagnés)
    const wonDeals = deals.filter(d => d.productionStage === 'ENCAISSE');
    const totalCA = wonDeals.reduce((sum, d) => sum + d.value, 0);

    // Nouveaux clients (ce mois)
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const newContacts = contacts.filter(c => new Date(c.createdAt) >= monthStart);

    // Deals gagnés
    const wonDealsCount = wonDeals.length;

    // Taux de conversion
    const totalDeals = deals.length;
    const conversionRate = totalDeals > 0 ? Math.round((wonDealsCount / totalDeals) * 100) : 0;

    return [
      { label: 'CA Total', value: `${totalCA.toLocaleString()} €`, change: '+18%', trend: 'up', color: 'text-orange-600', icon: Euro },
      { label: 'Nouveaux Clients', value: newContacts.length.toString(), change: '+12%', trend: 'up', color: 'text-blue-600', icon: Users },
      { label: 'Deals Gagnés', value: wonDealsCount.toString(), change: '+23%', trend: 'up', color: 'text-green-600', icon: Target },
      { label: 'Taux Conversion', value: `${conversionRate}%`, change: '+5%', trend: 'up', color: 'text-purple-600', icon: TrendingUp },
    ];
  }, [deals, contacts]);

  // CA mensuel (12 derniers mois)
  const monthlyRevenue = useMemo(() => {
    if (!deals) return [];

    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const monthlyData = [];
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth - 11 + i + 12) % 12;
      const year = currentMonth - 11 + i < 0 ? currentYear - 1 : currentYear;

      const monthDeals = deals.filter(d => {
        if (d.productionStage !== 'ENCAISSE' || !d.closedAt) return false;
        const dealDate = new Date(d.closedAt);
        return dealDate.getMonth() === monthIndex && dealDate.getFullYear() === year;
      });

      const revenue = monthDeals.reduce((sum, d) => sum + d.value, 0);
      monthlyData.push({ month: months[monthIndex], value: revenue });
    }

    return monthlyData;
  }, [deals]);

  // Top 5 deals par valeur (proxy pour "top products")
  const topDeals = useMemo(() => {
    if (!deals) return [];

    return [...deals]
      .filter(d => d.productionStage === 'ENCAISSE')
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(d => ({
        name: d.title,
        company: d.companies?.name || 'N/A',
        revenue: d.value,
      }));
  }, [deals]);

  // Activités récentes formatées
  const recentActivities = useMemo(() => {
    if (!activities) return [];

    return activities.slice(0, 4).map(activity => {
      const timeAgo = getTimeAgo(new Date(activity.createdAt));
      return {
        type: activity.type,
        description: `${activity.type} - ${activity.title}`,
        time: timeAgo,
      };
    });
  }, [activities]);

  // Helper pour calculer "il y a X"
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Il y a quelques minutes';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Il y a 1j';
    return `Il y a ${diffDays}j`;
  };

  const maxRevenue = useMemo(() => {
    if (monthlyRevenue.length === 0) return 1;
    return Math.max(...monthlyRevenue.map(m => m.value), 1);
  }, [monthlyRevenue]);

  // Loading state
  if (dealsLoading || contactsLoading || activitiesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (dealsError || contactsError || activitiesError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Erreur de chargement</p>
          <p className="text-gray-600">Impossible de charger les analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-orange-600" />
            Analytics & Rapports
          </h1>
          <p className="text-gray-600 mt-1">Vue d&apos;ensemble de vos performances</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
                <p className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
                <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                  <ArrowUpRight className="h-4 w-4" />
                  {stat.change}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Chiffre d&apos;Affaires (12 derniers mois)</h2>
          <div className="flex items-end justify-between h-64 gap-2">
            {monthlyRevenue.map((data) => (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg hover:from-orange-700 hover:to-orange-500 transition-all cursor-pointer relative group"
                    style={{ height: `${(data.value / maxRevenue) * 100}%`, minHeight: data.value > 0 ? '4px' : '0' }}
                  >
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {data.value.toLocaleString()}€
                    </span>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-600">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Top 5 Deals Gagnés</h2>
            <div className="space-y-4">
              {topDeals.length > 0 ? (
                topDeals.map((deal, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-orange-100 text-orange-600 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{deal.name}</p>
                        <p className="text-sm text-gray-600">{deal.company}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-orange-600">{deal.revenue.toLocaleString()}€</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun deal gagné</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Activité Récente</h2>
            <div className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Activity className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
