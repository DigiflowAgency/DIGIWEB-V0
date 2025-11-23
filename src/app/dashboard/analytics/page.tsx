'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Euro,
  Users,
  FileText,
  Target,
  ShoppingCart,
  Activity,
  Briefcase,
  Clock,
  CheckCircle,
  Phone,
  Mail,
  Calendar,
  Video,
  BarChart3,
  Loader2,
  Filter,
} from 'lucide-react';

interface Analytics {
  period: string;
  kpis: {
    totalRevenue: number;
    encaissedRevenue: number;
    newLeads: number;
    sentQuotes: number;
    conversionRate: number;
    averageBasket: number;
    completedActivities: number;
    activeDeals: number;
    forecastRevenue: number;
    averageClosingTime: number;
    quoteAcceptanceRate: number;
  };
  dealsByStage: Array<{
    stage: string;
    _count: { stage: number };
    _sum: { value: number | null };
  }>;
  performance: Array<{
    id: string;
    name: string;
    avatar: string | null;
    revenue: number;
    dealsCount: number;
    leadsCount: number;
    activitiesCount: number;
  }>;
  monthlyEvolution: Array<{
    month: string;
    revenue: number;
    deals: number;
    leads: number;
  }>;
  activitiesByType: Array<{
    type: string;
    _count: { type: number };
  }>;
}

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  A_CONTACTER: { label: 'À contacter', color: 'bg-gray-100 text-gray-700' },
  EN_DISCUSSION: { label: 'En discussion', color: 'bg-blue-100 text-blue-700' },
  A_RELANCER: { label: 'À relancer', color: 'bg-yellow-100 text-yellow-700' },
  RDV_PRIS: { label: 'RDV pris', color: 'bg-purple-100 text-purple-700' },
  NEGO_HOT: { label: 'Négo HOT', color: 'bg-orange-100 text-orange-700' },
  CLOSING: { label: 'Closing', color: 'bg-green-100 text-green-700' },
  REFUSE: { label: 'Refusé', color: 'bg-red-100 text-red-700' },
  GAGNE: { label: 'Gagné', color: 'bg-green-100 text-green-700' },
  PERDU: { label: 'Perdu', color: 'bg-red-100 text-red-700' },
};

const ACTIVITY_ICONS: Record<string, any> = {
  APPEL: Phone,
  EMAIL: Mail,
  REUNION: Calendar,
  VISIO: Video,
};

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?period=${period}`);
      const data = await res.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchAnalytics();
    }
  }, [status, session, period, fetchAnalytics]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const { kpis, dealsByStage, performance, monthlyEvolution, activitiesByType } = analytics;

  // KPI Cards Data
  const kpiCards = [
    {
      name: 'CA Généré',
      value: `${kpis.totalRevenue.toLocaleString()} €`,
      icon: Euro,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'CA Encaissé',
      value: `${kpis.encaissedRevenue.toLocaleString()} €`,
      icon: CheckCircle,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
    },
    {
      name: 'Nouveaux Leads',
      value: kpis.newLeads.toString(),
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Devis Envoyés',
      value: kpis.sentQuotes.toString(),
      icon: FileText,
      color: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-50',
    },
    {
      name: 'Taux Conversion',
      value: `${kpis.conversionRate.toFixed(1)}%`,
      icon: Target,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      name: 'Panier Moyen',
      value: `${kpis.averageBasket.toLocaleString()} €`,
      icon: ShoppingCart,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      name: 'Activités',
      value: kpis.completedActivities.toString(),
      icon: Activity,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      name: 'Deals Actifs',
      value: kpis.activeDeals.toString(),
      icon: Briefcase,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Prévisions CA',
      value: `${kpis.forecastRevenue.toLocaleString()} €`,
      icon: TrendingUp,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      name: 'Temps Closing',
      value: `${kpis.averageClosingTime} jours`,
      icon: Clock,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      name: 'Taux Acceptation Devis',
      value: `${kpis.quoteAcceptanceRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
    },
  ];

  const maxMonthlyRevenue = Math.max(...monthlyEvolution.map(m => m.revenue), 1);

  return (
    <div className="min-h-screen gradient-mesh py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
                <BarChart3 className="h-10 w-10 text-violet-600" />
                Analytics
              </h1>
              <p className="mt-2 text-gray-600">
                Vue d'ensemble de la performance commerciale
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="input-field"
              >
                <option value="week">7 derniers jours</option>
                <option value="month">30 derniers jours</option>
                <option value="quarter">3 derniers mois</option>
                <option value="year">12 derniers mois</option>
                <option value="all">Depuis le début</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card-premium p-6 group hover:scale-105 transition-transform"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${kpi.color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{kpi.name}</h3>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Évolution mensuelle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card-premium p-6 mb-8"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-600" />
              Évolution mensuelle du CA
            </h3>
            <p className="text-sm text-gray-500 mt-1">12 derniers mois</p>
          </div>
          <div className="flex items-end justify-between h-64 gap-2">
            {monthlyEvolution.map((month, index) => (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col gap-1 items-center justify-end h-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(month.revenue / maxMonthlyRevenue) * 100}%` }}
                    transition={{ delay: 0.7 + index * 0.05, duration: 0.5 }}
                    className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-lg min-h-[20px] relative group"
                  >
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap">
                      <div>{month.revenue.toLocaleString()} €</div>
                      <div className="text-gray-300">{month.deals} deals</div>
                      <div className="text-gray-300">{month.leads} leads</div>
                    </div>
                  </motion.div>
                </div>
                <span className="text-xs font-medium text-gray-600 rotate-45 origin-left">
                  {month.month}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pipeline par stage */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="card-premium p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-violet-600" />
              Répartition du Pipeline
            </h3>
            <div className="space-y-4">
              {dealsByStage.map((stage, index) => {
                const stageInfo = STAGE_LABELS[stage.stage];
                const totalDeals = dealsByStage.reduce((sum, s) => sum + s._count.stage, 0);
                const percentage = totalDeals > 0 ? (stage._count.stage / totalDeals) * 100 : 0;

                return (
                  <motion.div
                    key={stage.stage}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${stageInfo?.color || 'bg-gray-100 text-gray-700'}`}>
                          {stageInfo?.label || stage.stage}
                        </span>
                        <span className="text-sm text-gray-600">
                          {stage._count.stage} deal{stage._count.stage > 1 ? 's' : ''}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {(stage._sum.value || 0).toLocaleString()} €
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.9 + index * 0.05, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-violet-600 to-orange-500"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Activités par type */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="card-premium p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-violet-600" />
              Activités par type
            </h3>
            <div className="space-y-4">
              {activitiesByType.map((activity, index) => {
                const Icon = ACTIVITY_ICONS[activity.type] || Activity;
                const total = activitiesByType.reduce((sum, a) => sum + a._count.type, 0);
                const percentage = total > 0 ? (activity._count.type / total) * 100 : 0;

                return (
                  <motion.div
                    key={activity.type}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                    className="flex items-center gap-4"
                  >
                    <div className="p-3 rounded-lg bg-violet-100">
                      <Icon className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900">{activity.type}</span>
                        <span className="text-sm font-bold text-violet-700">{activity._count.type}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.9 + index * 0.05, duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-violet-600 to-orange-500"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Performance par commercial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="card-premium overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-gray-200/50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-600" />
              Performance par commercial
            </h3>
            <p className="text-sm text-gray-500 mt-1">Classement par CA généré</p>
          </div>
          <div className="divide-y divide-gray-200/50">
            {performance.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.05 }}
                className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center gap-4"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' :
                  index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                  index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex items-center gap-3 flex-1">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center text-white font-semibold">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{user.dealsCount} deals</span>
                      <span>{user.leadsCount} leads</span>
                      <span>{user.activitiesCount} activités</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-violet-700">
                    {user.revenue.toLocaleString()} €
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
