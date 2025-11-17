'use client';

import { motion } from 'framer-motion';
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
  Zap,
  Sun,
  Sparkles,
  Phone,
  Mail,
  MessageSquare,
  Euro,
  TrendingDown,
} from 'lucide-react';

const stats = [
  {
    name: 'Leads actifs',
    value: '47',
    change: '+12%',
    trend: 'up',
    icon: Users,
    color: 'from-violet-600 to-violet-700',
    bgColor: 'bg-violet-50',
  },
  {
    name: 'RDV ce mois',
    value: '23',
    change: '+8%',
    trend: 'up',
    icon: Calendar,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    name: 'CA du mois',
    value: '48 500 €',
    change: '+23%',
    trend: 'up',
    icon: Euro,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
  },
  {
    name: 'Taux conversion',
    value: '34%',
    change: '+5%',
    trend: 'up',
    icon: Target,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
  },
];

const hotLeads = [
  {
    id: 1,
    name: 'Restaurant Le Gourmet',
    contact: 'Pierre Martin',
    score: 95,
    activity: 'Site web + SEO',
    value: '4 500 €',
    nextAction: 'Appel demain 14h',
  },
  {
    id: 2,
    name: 'Boutique Mode Élégance',
    contact: 'Sophie Dubois',
    score: 88,
    activity: 'E-commerce',
    value: '6 200 €',
    nextAction: 'Devis envoyé',
  },
  {
    id: 3,
    name: 'Cabinet Avocat Dupont',
    contact: 'Jean Dupont',
    score: 82,
    activity: 'Site vitrine',
    value: '2 800 €',
    nextAction: 'RDV jeudi',
  },
];

const recentActivity = [
  {
    id: 1,
    type: 'lead',
    title: 'Nouveau lead créé',
    description: 'Restaurant La Table - Score: 85',
    time: 'Il y a 5 min',
    icon: Sparkles,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
  },
  {
    id: 2,
    type: 'meeting',
    title: 'RDV confirmé',
    description: 'Coiffeur Tendance - 16 Nov à 10h30',
    time: 'Il y a 12 min',
    icon: Calendar,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    id: 3,
    type: 'message',
    title: 'Message WhatsApp',
    description: 'Garage Auto Pro a répondu',
    time: 'Il y a 23 min',
    icon: MessageSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    id: 4,
    type: 'deal',
    title: 'Deal conclu',
    description: 'Boulangerie Tradition - 3 200€',
    time: 'Il y a 1h',
    icon: CheckCircle2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
];

const quickActions = [
  {
    name: 'Nouveau Lead',
    icon: Users,
    color: 'from-violet-600 to-violet-700',
    description: 'Créer un lead',
  },
  {
    name: 'Planifier RDV',
    icon: Calendar,
    color: 'from-orange-500 to-orange-600',
    description: 'Ajouter un rendez-vous',
  },
  {
    name: 'Envoyer devis',
    icon: Mail,
    color: 'from-blue-500 to-blue-600',
    description: 'Créer un devis',
  },
  {
    name: 'Appeler',
    icon: Phone,
    color: 'from-green-500 to-green-600',
    description: 'Lancer un appel',
  },
];

const weeklyData = [
  { day: 'Lun', leads: 8, meetings: 3, deals: 1 },
  { day: 'Mar', leads: 12, meetings: 5, deals: 2 },
  { day: 'Mer', leads: 10, meetings: 4, deals: 2 },
  { day: 'Jeu', leads: 15, meetings: 6, deals: 3 },
  { day: 'Ven', leads: 14, meetings: 5, deals: 2 },
  { day: 'Sam', leads: 6, meetings: 2, deals: 1 },
  { day: 'Dim', leads: 3, meetings: 1, deals: 0 },
];

const monthlyGoals = [
  {
    name: 'CA Mensuel',
    current: 48500,
    target: 60000,
    unit: '€',
  },
  {
    name: 'Nouveaux Deals',
    current: 8,
    target: 12,
    unit: 'deals',
  },
  {
    name: 'RDV Réalisés',
    current: 23,
    target: 30,
    unit: 'RDV',
  },
];

const getScoreBadge = (score: number) => {
  if (score >= 90) return { label: 'ULTRA CHAUD', color: 'bg-gradient-to-r from-red-500 to-orange-500 text-white', pulse: true };
  if (score >= 75) return { label: 'CHAUD', color: 'bg-orange-500 text-white', pulse: false };
  if (score >= 50) return { label: 'TIÈDE', color: 'bg-yellow-500 text-white', pulse: false };
  return { label: 'FROID', color: 'bg-blue-500 text-white', pulse: false };
};

export default function DashboardPage() {
  const maxValue = Math.max(...weeklyData.map(d => Math.max(d.leads, d.meetings * 3, d.deals * 5)));

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
                <div className="w-full flex flex-col gap-1 items-center justify-end h-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.leads / maxValue) * 100}%` }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                    className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-lg min-h-[20px] relative group"
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      {data.leads}
                    </span>
                  </motion.div>
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
            className="lg:col-span-2 card-premium overflow-hidden"
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

          {/* Quick Actions */}
          <motion.div
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
          </motion.div>
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
