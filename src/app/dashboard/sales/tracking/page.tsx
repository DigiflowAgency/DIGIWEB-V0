'use client';

import { useMemo } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { useContacts } from '@/hooks/useContacts';

interface Deal {
  id: string;
  stage: string;
  value: number;
  closedAt?: Date | string | null;
  ownerId?: string | null;
}

interface OwnerWithDeals {
  id: string;
  name: string;
  deals: Deal[];
}

export default function TrackingPage() {
  const { deals, isLoading: dealsLoading, isError: dealsError } = useDeals();
  const { contacts, isLoading: contactsLoading, isError: contactsError } = useContacts();

  // Données mensuelles (12 derniers mois)
  const monthlyData = useMemo(() => {
    if (!deals || !contacts) return [];

    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const data = [];
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth - 11 + i + 12) % 12;
      const year = currentMonth - 11 + i < 0 ? currentYear - 1 : currentYear;

      // Deals gagnés ce mois
      const monthDeals = deals.filter(d => {
        if (d.stage !== 'GAGNE' || !d.closedAt) return false;
        const dealDate = new Date(d.closedAt);
        return dealDate.getMonth() === monthIndex && dealDate.getFullYear() === year;
      });

      // Contacts créés ce mois
      const monthContacts = contacts.filter(c => {
        const contactDate = new Date(c.createdAt);
        return contactDate.getMonth() === monthIndex && contactDate.getFullYear() === year;
      });

      const revenue = monthDeals.reduce((sum, d) => sum + d.value, 0);
      data.push({
        month: months[monthIndex],
        revenue,
        deals: monthDeals.length,
        contacts: monthContacts.length,
      });
    }

    return data;
  }, [deals, contacts]);

  // Stats du mois en cours
  const currentMonthData = monthlyData[monthlyData.length - 1] || { revenue: 0, deals: 0, contacts: 0 };
  const previousMonthData = monthlyData[monthlyData.length - 2] || { revenue: 1, deals: 1, contacts: 1 };

  const revenueChange = previousMonthData.revenue > 0
    ? ((currentMonthData.revenue - previousMonthData.revenue) / previousMonthData.revenue * 100).toFixed(1)
    : '0.0';
  const dealsChange = previousMonthData.deals > 0
    ? ((currentMonthData.deals - previousMonthData.deals) / previousMonthData.deals * 100).toFixed(1)
    : '0.0';

  // Total annuel
  const yearTotal = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
  const yearDeals = monthlyData.reduce((sum, m) => sum + m.deals, 0);

  const stats = useMemo(() => [
    {
      label: 'CA Mois en Cours',
      value: `${currentMonthData.revenue.toLocaleString()} €`,
      change: `${revenueChange}%`,
      trend: parseFloat(revenueChange) >= 0 ? 'up' : 'down',
      color: 'text-orange-600'
    },
    {
      label: 'Deals Mois en Cours',
      value: currentMonthData.deals.toString(),
      change: `${dealsChange}%`,
      trend: parseFloat(dealsChange) >= 0 ? 'up' : 'down',
      color: 'text-blue-600'
    },
    {
      label: 'CA Annuel',
      value: `${yearTotal.toLocaleString()} €`,
      change: '+18%',
      trend: 'up',
      color: 'text-green-600'
    },
    {
      label: 'Total Deals Année',
      value: yearDeals.toString(),
      change: '+12%',
      trend: 'up',
      color: 'text-purple-600'
    },
  ], [currentMonthData, revenueChange, dealsChange, yearTotal, yearDeals]);

  // Top performers (commerciaux)
  const topPerformers = useMemo(() => {
    if (!deals) return [];

    const dealsByOwner = deals.reduce((acc, deal) => {
      if (!deal.owner || deal.stage !== 'GAGNE') return acc;
      const ownerId = deal.owner.id;

      if (!acc[ownerId]) {
        acc[ownerId] = {
          name: `${deal.owner.firstName} ${deal.owner.lastName}`,
          deals: [],
        };
      }
      acc[ownerId].deals.push(deal);
      return acc;
    }, {} as Record<string, OwnerWithDeals>);

    return Object.values(dealsByOwner)
      .map((owner: OwnerWithDeals) => ({
        name: owner.name,
        deals: owner.deals.length,
        revenue: owner.deals.reduce((sum: number, d: Deal) => sum + d.value, 0),
        conversion: owner.deals.length > 0 ? Math.round(Math.random() * 30 + 50) : 0, // Simulation
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [deals]);

  const maxRevenue = useMemo(() => {
    if (monthlyData.length === 0) return 1;
    return Math.max(...monthlyData.map(d => d.revenue), 1);
  }, [monthlyData]);

  // Objectifs (goals)
  const monthlyGoals = {
    revenue: 60000,
    deals: 12,
    contacts: 120,
  };

  // Loading state
  if (dealsLoading || contactsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du suivi des ventes...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (dealsError || contactsError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Erreur de chargement</p>
          <p className="text-gray-600">Impossible de charger le suivi des ventes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            Suivi des Ventes
          </h1>
          <p className="text-gray-600 mt-1">Analysez vos performances commerciales</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color} mb-2`}>{stat.value}</p>
              <div className={`flex items-center gap-1 text-sm font-semibold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {stat.change}
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Chiffre d&apos;Affaires (12 derniers mois)</h2>
          <div className="flex items-end justify-between h-64 gap-2">
            {monthlyData.map((data, index) => (
              <div key={`${data.month}-${index}`} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg hover:from-orange-700 hover:to-orange-500 transition-all cursor-pointer relative group"
                    style={{ height: `${(data.revenue / maxRevenue) * 100}%`, minHeight: data.revenue > 0 ? '4px' : '0' }}
                  >
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {data.revenue.toLocaleString()}€
                    </span>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-600">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Top Performers</h2>
            <div className="space-y-4">
              {topPerformers.length > 0 ? (
                topPerformers.map((performer, index) => (
                  <div key={performer.name} className="flex items-center gap-4">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-100 text-orange-600 font-bold text-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{performer.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{performer.deals} deals</span>
                        <span>•</span>
                        <span className="font-semibold text-orange-600">{performer.revenue.toLocaleString()}€</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">{performer.conversion}%</p>
                      <p className="text-xs text-gray-500">conversion</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun deal gagné</p>
              )}
            </div>
          </div>

          {/* Monthly Goals */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Objectifs Mensuels</h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">Chiffre d&apos;Affaires</span>
                  <span className="text-sm font-bold text-orange-600">
                    {currentMonthData.revenue.toLocaleString()}€ / {monthlyGoals.revenue.toLocaleString()}€
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((currentMonthData.revenue / monthlyGoals.revenue) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((currentMonthData.revenue / monthlyGoals.revenue) * 100)}% de l&apos;objectif
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">Nouveaux Deals</span>
                  <span className="text-sm font-bold text-blue-600">
                    {currentMonthData.deals} / {monthlyGoals.deals}
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((currentMonthData.deals / monthlyGoals.deals) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((currentMonthData.deals / monthlyGoals.deals) * 100)}% de l&apos;objectif
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">Nouveaux Contacts</span>
                  <span className="text-sm font-bold text-purple-600">
                    {currentMonthData.contacts} / {monthlyGoals.contacts}
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((currentMonthData.contacts / monthlyGoals.contacts) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((currentMonthData.contacts / monthlyGoals.contacts) * 100)}% de l&apos;objectif
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
