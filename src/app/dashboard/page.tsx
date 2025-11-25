'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import {
  Users,
  Calendar,
  TrendingUp,
  Target,
  Flame,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Activity,
  Sun,
  Phone,
  Mail,
  Euro,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { useActivities } from '@/hooks/useActivities';

// V2 - Actions rapides désactivées pour l'instant
// const quickActions = [
//   {
//     name: 'Nouveau Lead',
//     icon: Users,
//     color: 'from-violet-600 to-violet-700',
//     description: 'Créer un lead',
//   },
//   {
//     name: 'Planifier RDV',
//     icon: Calendar,
//     color: 'from-orange-500 to-orange-600',
//     description: 'Ajouter un rendez-vous',
//   },
//   {
//     name: 'Envoyer devis',
//     icon: Mail,
//     color: 'from-blue-500 to-blue-600',
//     description: 'Créer un devis',
//   },
//   {
//     name: 'Appeler',
//     icon: Phone,
//     color: 'from-green-500 to-green-600',
//     description: 'Lancer un appel',
//   },
// ];

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'APPEL': return Phone;
    case 'EMAIL': return Mail;
    case 'REUNION': return Calendar;
    case 'VISIO': return Calendar;
    default: return Activity;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'APPEL': return { color: 'text-violet-600', bgColor: 'bg-violet-100' };
    case 'EMAIL': return { color: 'text-blue-600', bgColor: 'bg-blue-100' };
    case 'REUNION': return { color: 'text-orange-600', bgColor: 'bg-orange-100' };
    case 'VISIO': return { color: 'text-green-600', bgColor: 'bg-green-100' };
    default: return { color: 'text-gray-600', bgColor: 'bg-gray-100' };
  }
};

const getTimeAgo = (date: string | Date) => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays}j`;
};

const getScoreBadge = (score: number) => {
  if (score >= 90) return { label: 'ULTRA CHAUD', color: 'bg-gradient-to-r from-red-500 to-orange-500 text-white', pulse: true };
  if (score >= 75) return { label: 'CHAUD', color: 'bg-orange-500 text-white', pulse: false };
  if (score >= 50) return { label: 'TIÈDE', color: 'bg-yellow-500 text-white', pulse: false };
  return { label: 'FROID', color: 'bg-blue-500 text-white', pulse: false };
};

export default function DashboardPage() {
  const { deals, isLoading: dealsLoading, isError: dealsError } = useDeals();
  const { activities, isLoading: activitiesLoading, isError: activitiesError } = useActivities({ limit: 10 });

  // Calculer les stats principales
  const stats = useMemo(() => {
    const activeDeals = deals.filter(d => d.productionStage !== 'ENCAISSE');

    // Mois actuel
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Mois précédent
    const lastMonthStart = new Date(monthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const lastMonthEnd = new Date(monthStart);
    lastMonthEnd.setTime(lastMonthEnd.getTime() - 1); // Dernière milliseconde du mois précédent

    // Fonction pour calculer le pourcentage de changement
    const calculateChange = (current: number, previous: number): { change: string; trend: 'up' | 'down' | 'stable' } => {
      if (previous === 0) {
        if (current > 0) return { change: '+100%', trend: 'up' };
        return { change: '0%', trend: 'stable' };
      }
      const percentChange = Math.round(((current - previous) / previous) * 100);
      if (percentChange > 0) return { change: `+${percentChange}%`, trend: 'up' };
      if (percentChange < 0) return { change: `${percentChange}%`, trend: 'down' };
      return { change: '0%', trend: 'stable' };
    };

    // Deals actifs - comparer avec le mois précédent
    const lastMonthDeals = deals.filter(d => {
      const createdDate = new Date(d.createdAt);
      return createdDate >= lastMonthStart && createdDate < monthStart;
    });
    const activeDealsLastMonth = lastMonthDeals.filter(d => d.productionStage !== 'ENCAISSE').length;
    const dealsChange = calculateChange(activeDeals.length, activeDealsLastMonth);

    // Deals et CA ce mois
    const dealsThisMonth = deals.filter(d => new Date(d.createdAt) >= monthStart);
    const wonDealsThisMonth = deals.filter(
      d => d.productionStage === 'ENCAISSE' && d.closedAt && new Date(d.closedAt) >= monthStart
    );
    const caThisMonth = wonDealsThisMonth.reduce((sum, d) => sum + d.value, 0);

    // CA mois précédent
    const wonDealsLastMonth = deals.filter(
      d => d.productionStage === 'ENCAISSE' && d.closedAt &&
           new Date(d.closedAt) >= lastMonthStart && new Date(d.closedAt) <= lastMonthEnd
    );
    const caLastMonth = wonDealsLastMonth.reduce((sum, d) => sum + d.value, 0);
    const caChange = calculateChange(caThisMonth, caLastMonth);

    // RDV ce mois
    const meetingsThisMonth = activities.filter(
      a => (a.type === 'REUNION' || a.type === 'VISIO') &&
           new Date(a.scheduledAt) >= monthStart
    ).length;

    // RDV mois précédent
    const meetingsLastMonth = activities.filter(
      a => (a.type === 'REUNION' || a.type === 'VISIO') &&
           new Date(a.scheduledAt) >= lastMonthStart && new Date(a.scheduledAt) <= lastMonthEnd
    ).length;
    const meetingsChange = calculateChange(meetingsThisMonth, meetingsLastMonth);

    // Taux de conversion
    const conversionRate = dealsThisMonth.length > 0
      ? Math.round((wonDealsThisMonth.length / dealsThisMonth.length) * 100)
      : 0;

    const dealsLastMonthCount = deals.filter(
      d => new Date(d.createdAt) >= lastMonthStart && new Date(d.createdAt) <= lastMonthEnd
    ).length;
    const conversionRateLastMonth = dealsLastMonthCount > 0
      ? Math.round((wonDealsLastMonth.length / dealsLastMonthCount) * 100)
      : 0;
    const conversionChange = calculateChange(conversionRate, conversionRateLastMonth);

    return [
      {
        name: 'Deals actifs',
        value: activeDeals.length.toString(),
        change: dealsChange.change,
        trend: dealsChange.trend,
        icon: Users,
        color: 'from-violet-600 to-violet-700',
        bgColor: 'bg-violet-50',
      },
      {
        name: 'RDV ce mois',
        value: meetingsThisMonth.toString(),
        change: meetingsChange.change,
        trend: meetingsChange.trend,
        icon: Calendar,
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-50',
      },
      {
        name: 'CA du mois',
        value: `${caThisMonth.toLocaleString()} €`,
        change: caChange.change,
        trend: caChange.trend,
        icon: Euro,
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-50',
      },
      {
        name: 'Taux conversion',
        value: `${conversionRate}%`,
        change: conversionChange.change,
        trend: conversionChange.trend,
        icon: Target,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
      },
    ];
  }, [deals, activities]);

  // Hot leads (deals avec haute probabilité)
  const hotLeads = useMemo(() => {
    return deals
      .filter(d => d.probability >= 75 && d.productionStage !== 'ENCAISSE')
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 3)
      .map(d => ({
        id: d.id,
        name: d.companies?.name || d.title,
        contact: d.contacts ? `${d.contacts.firstName} ${d.contacts.lastName}` : 'Contact non défini',
        score: d.probability,
        activity: d.description || d.title,
        value: `${d.value.toLocaleString()} €`,
        nextAction: d.expectedCloseDate
          ? `Clôture prévue ${new Date(d.expectedCloseDate).toLocaleDateString('fr-FR')}`
          : 'Pas de date prévue',
      }));
  }, [deals]);

  // Activités récentes
  const recentActivity = useMemo(() => {
    return activities.slice(0, 4).map(a => {
      const colors = getActivityColor(a.type);
      const Icon = getActivityIcon(a.type);

      return {
        id: a.id,
        type: a.type.toLowerCase(),
        title: a.title,
        description: a.description || `${a.type} - ${a.contact ? `${a.contact.firstName} ${a.contact.lastName}` : 'Contact non défini'}`,
        time: getTimeAgo(a.scheduledAt),
        icon: Icon,
        color: colors.color,
        bgColor: colors.bgColor,
      };
    });
  }, [activities]);

  // Données hebdomadaires - calcul avec vraies données
  const weeklyData = useMemo(() => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const now = new Date();

    return days.map((day, index) => {
      const dayDate = new Date(now);
      dayDate.setDate(now.getDate() - (6 - index));
      dayDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(dayDate);
      nextDay.setDate(dayDate.getDate() + 1);

      // Compter les leads (deals créés ce jour)
      const leadsCount = deals.filter(d => {
        const created = new Date(d.createdAt);
        return created >= dayDate && created < nextDay;
      }).length;

      // Compter les RDV (activités REUNION/VISIO planifiées ce jour)
      const meetingsCount = activities.filter(a => {
        if (a.type !== 'REUNION' && a.type !== 'VISIO') return false;
        const scheduled = new Date(a.scheduledAt);
        return scheduled >= dayDate && scheduled < nextDay;
      }).length;

      // Compter les deals gagnés ce jour
      const dealsWonCount = deals.filter(d => {
        if (d.productionStage !== 'ENCAISSE' || !d.closedAt) return false;
        const closed = new Date(d.closedAt);
        return closed >= dayDate && closed < nextDay;
      }).length;

      return {
        day,
        leads: leadsCount,
        meetings: meetingsCount,
        deals: dealsWonCount,
      };
    });
  }, [deals, activities]);

  // Objectifs mensuels
  const monthlyGoals = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // CA = Deals encaissés ce mois
    const wonDealsThisMonth = deals.filter(
      d => d.productionStage === 'ENCAISSE' && d.closedAt && new Date(d.closedAt) >= monthStart
    );
    const caThisMonth = wonDealsThisMonth.reduce((sum, d) => sum + d.value, 0);

    // Nouveaux deals = TOUS les deals créés ce mois (pas seulement les gagnés)
    const newDealsThisMonth = deals.filter(
      d => new Date(d.createdAt) >= monthStart
    ).length;

    // RDV réalisés = Activités REUNION/VISIO qui sont terminées ce mois
    const completedMeetingsThisMonth = activities.filter(
      a => (a.type === 'REUNION' || a.type === 'VISIO') &&
           a.status === 'COMPLETEE' &&
           new Date(a.scheduledAt) >= monthStart
    ).length;

    return [
      {
        name: 'CA Mensuel',
        current: caThisMonth,
        target: 60000,
        unit: '€',
      },
      {
        name: 'Nouveaux Deals',
        current: newDealsThisMonth,
        target: 12,
        unit: 'deals',
      },
      {
        name: 'RDV Réalisés',
        current: completedMeetingsThisMonth,
        target: 30,
        unit: 'RDV',
      },
    ];
  }, [deals, activities]);

  if (dealsLoading || activitiesLoading) {
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

  const maxValue = Math.max(...weeklyData.map(d => d.leads + d.meetings + d.deals), 1);

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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 to-orange-500 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="mt-2 text-gray-600 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Vue d&apos;ensemble de votre activité commerciale
              </p>
            </div>
            <div className="flex items-center gap-3 glass px-4 py-3 rounded-xl">
              <Sun className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Paris</p>
                <p className="text-xs text-gray-500">18°C • Ensoleillé</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card-premium p-6 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-bold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {stat.change}
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.name}</h3>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Weekly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-premium p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-violet-600" />
                Activité hebdomadaire
              </h3>
              <p className="text-sm text-gray-500 mt-1">Performance des 7 derniers jours</p>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-600"></div>
                <span>Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>RDV</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Deals</span>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between h-48 gap-4">
            {weeklyData.map((data, index) => (
              <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col gap-0 items-center justify-end h-full">
                  {/* Deals gagnés (vert) - en haut */}
                  {data.deals > 0 && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(data.deals / maxValue) * 100}%` }}
                      transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                      className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg min-h-[20px] relative group"
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-green-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1 rounded shadow">
                        {data.deals}
                      </span>
                    </motion.div>
                  )}
                  {/* RDV (orange) - au milieu */}
                  {data.meetings > 0 && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(data.meetings / maxValue) * 100}%` }}
                      transition={{ delay: 0.7 + index * 0.1 + 0.05, duration: 0.5 }}
                      className={`w-full bg-gradient-to-t from-orange-600 to-orange-400 min-h-[20px] relative group ${data.deals === 0 ? 'rounded-t-lg' : ''}`}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-orange-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1 rounded shadow">
                        {data.meetings}
                      </span>
                    </motion.div>
                  )}
                  {/* Leads (violet) - en bas */}
                  {data.leads > 0 && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(data.leads / maxValue) * 100}%` }}
                      transition={{ delay: 0.7 + index * 0.1 + 0.1, duration: 0.5 }}
                      className={`w-full bg-gradient-to-t from-violet-600 to-violet-400 min-h-[20px] relative group ${data.meetings === 0 && data.deals === 0 ? 'rounded-t-lg' : ''}`}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-violet-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1 rounded shadow">
                        {data.leads}
                      </span>
                    </motion.div>
                  )}
                  {/* Si aucune donnée, afficher une barre minimale */}
                  {data.leads === 0 && data.meetings === 0 && data.deals === 0 && (
                    <div className="w-full h-2 bg-gray-200 rounded-t-lg"></div>
                  )}
                </div>
                <span className="text-xs font-medium text-gray-600">{data.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Hot Leads */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-3 card-premium overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
                    <Flame className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Leads Ultra Chauds</h3>
                    <p className="text-xs text-gray-500">Priorité maximale</p>
                  </div>
                </div>
                <span className="badge badge-danger animate-pulse">
                  {hotLeads.length} actifs
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-200/50">
              {hotLeads.map((lead, index) => {
                const badge = getScoreBadge(lead.score);
                return (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="px-6 py-4 hover:bg-violet-50/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-violet-700 transition-colors">
                            {lead.name}
                          </h4>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${badge.color} ${badge.pulse ? 'animate-pulse' : ''}`}>
                            {lead.score}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                          <Users className="h-3.5 w-3.5" />
                          {lead.contact}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          {lead.nextAction}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">{lead.activity}</p>
                        <p className="text-lg font-bold text-violet-700">{lead.value}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* V2 - Quick Actions section désactivée pour l'instant */}
          {/* <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="card-premium p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-600 to-orange-500">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Actions rapides</h3>
                <p className="text-xs text-gray-500">Accès direct</p>
              </div>
            </div>
            <div className="space-y-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="w-full glass hover:glass-violet p-4 rounded-xl flex items-center gap-4 group hover:scale-105 transition-all duration-300"
                  >
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${action.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">
                        {action.name}
                      </p>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div> */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="card-premium overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Activité récente</h3>
                  <p className="text-xs text-gray-500">Dernières actions</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200/50">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 + index * 0.1 }}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-4"
                  >
                    <div className={`p-2 rounded-lg ${activity.bgColor} h-fit`}>
                      <Icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-600 mb-1">{activity.description}</p>
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Monthly Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="card-premium p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Objectifs du mois</h3>
                <p className="text-xs text-gray-500">Suivez votre progression</p>
              </div>
            </div>
            <div className="space-y-6">
              {monthlyGoals.map((goal, index) => {
                const percentage = Math.round((goal.current / goal.target) * 100);
                return (
                  <motion.div
                    key={goal.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 + index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-900">{goal.name}</span>
                      <span className="text-sm font-bold text-violet-700">
                        {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                      </span>
                    </div>
                    <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(percentage, 100)}%` }}
                        transition={{ delay: 1.2 + index * 0.1, duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          percentage >= 100
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : percentage >= 75
                            ? 'bg-gradient-to-r from-violet-600 to-orange-500'
                            : 'bg-gradient-to-r from-orange-400 to-orange-500'
                        }`}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 font-medium">{percentage}% complété</span>
                      {percentage >= 100 && (
                        <CheckCircle2 className="h-5 w-5 text-green-500 animate-bounce" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
