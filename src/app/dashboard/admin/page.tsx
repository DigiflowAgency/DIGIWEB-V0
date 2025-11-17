'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Plug,
  BarChart3,
  UserPlus,
  Edit,
  Trash2,
  X,
  Zap,
  MessageSquare,
  Database,
  CreditCard,
  CheckCircle2,
  XCircle,
  Save,
  Plus,
  TrendingUp,
  Target,
  Clock,
  Thermometer,
  Loader2,
} from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';

const integrations = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Communication client instantanée',
    icon: MessageSquare,
    color: 'from-green-500 to-emerald-600',
    status: 'connected',
    lastSync: 'Il y a 5 min',
  },
  {
    id: 'claude',
    name: 'Claude AI',
    description: 'Intelligence artificielle conversationnelle',
    icon: Zap,
    color: 'from-violet-600 to-purple-700',
    status: 'connected',
    lastSync: 'Il y a 2 min',
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Base de données et authentification',
    icon: Database,
    color: 'from-green-600 to-teal-600',
    status: 'connected',
    lastSync: 'Temps réel',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Paiements et facturation',
    icon: CreditCard,
    color: 'from-blue-600 to-indigo-600',
    status: 'disconnected',
    lastSync: 'Non configuré',
  },
];

const analyticsData = [
  {
    label: 'Messages envoyés',
    value: '2 845',
    change: '+18%',
    trend: 'up',
  },
  {
    label: 'Leads créés',
    value: '156',
    change: '+24%',
    trend: 'up',
  },
  {
    label: 'Conversions',
    value: '42',
    change: '+12%',
    trend: 'up',
  },
  {
    label: 'Temps moyen réponse',
    value: '2.3 min',
    change: '-15%',
    trend: 'down',
  },
];

const roleColors = {
  admin: 'badge-danger',
  manager: 'badge-violet',
  commercial: 'badge-orange',
  support: 'badge-success',
};

export default function AdminPage() {
  const { users, isLoading, isError } = useUsers();
  const [activeTab, setActiveTab] = useState<'users' | 'ai' | 'integrations' | 'analytics'>('users');
  const [systemPrompt, setSystemPrompt] = useState(
    "Tu es un assistant commercial pour DigiWeb, une agence digitale spécialisée en création de sites web, SEO, et marketing digital. Tu dois qualifier les prospects et fixer des rendez-vous avec les leads chauds."
  );
  const [temperature, setTemperature] = useState(0.7);
  const [rdvThreshold, setRdvThreshold] = useState(80);
  const [relanceDelays, setRelanceDelays] = useState(['24h', '48h', '7j']);
  const [newDelay, setNewDelay] = useState('');

  const usersData = users.map(u => ({
    ...u,
    name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Utilisateur',
    avatar: `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase() || 'U',
    status: 'active' as const,
    role: u.role.toLowerCase(),
  }));

  const addDelay = () => {
    if (newDelay && !relanceDelays.includes(newDelay)) {
      setRelanceDelays([...relanceDelays, newDelay]);
      setNewDelay('');
    }
  };

  const removeDelay = (delay: string) => {
    setRelanceDelays(relanceDelays.filter(d => d !== delay));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      </div>
    );
  }

  if (isError) {
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 to-orange-500 bg-clip-text text-transparent">
            Administration
          </h1>
          <p className="mt-2 text-gray-600">
            Configuration système et gestion des utilisateurs
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="card-premium p-2 mb-8 inline-flex rounded-2xl gap-2"
        >
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-violet-600 to-orange-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="h-5 w-5" />
            Utilisateurs
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-violet-600 to-orange-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Zap className="h-5 w-5" />
            IA
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'integrations'
                ? 'bg-gradient-to-r from-violet-600 to-orange-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plug className="h-5 w-5" />
            Intégrations
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-violet-600 to-orange-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            Analytics
          </button>
        </motion.div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h2>
              <button className="btn-primary">
                <UserPlus className="inline-block h-5 w-5 mr-2" />
                Inviter un utilisateur
              </button>
            </div>

            <div className="card-premium overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Rôle
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {usersData.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="hover:bg-violet-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">{user.avatar}</span>
                            </div>
                            <span className="font-medium text-gray-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{user.email}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`badge ${roleColors[user.role as keyof typeof roleColors]}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`badge ${
                              user.status === 'active' ? 'badge-success' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {user.status === 'active' ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-violet-100 rounded-lg transition-colors group">
                              <Edit className="h-4 w-4 text-gray-600 group-hover:text-violet-600" />
                            </button>
                            <button className="p-2 hover:bg-red-100 rounded-lg transition-colors group">
                              <Trash2 className="h-4 w-4 text-gray-600 group-hover:text-red-600" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Tab */}
        {activeTab === 'ai' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Paramètres IA</h2>
                <p className="text-sm text-gray-600">Configuration du système d&apos;intelligence artificielle</p>
              </div>
            </div>

            {/* System Prompt */}
            <div className="card-premium p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Prompt système</h3>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="input-premium w-full min-h-[150px] resize-y"
                placeholder="Définissez le comportement de l&apos;IA..."
              />
              <p className="text-xs text-gray-500 mt-2">
                Ce prompt définit le contexte et le comportement global de l&apos;IA
              </p>
            </div>

            {/* Temperature */}
            <div className="card-premium p-6">
              <div className="flex items-center gap-3 mb-4">
                <Thermometer className="h-5 w-5 text-orange-500" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">Température</h3>
                  <p className="text-sm text-gray-600">Contrôle la créativité des réponses (0 = précis, 1 = créatif)</p>
                </div>
                <span className="text-2xl font-bold text-violet-700">{temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #7c3aed ${temperature * 100}%, #e5e7eb ${temperature * 100}%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Précis</span>
                <span>Équilibré</span>
                <span>Créatif</span>
              </div>
            </div>

            {/* RDV Threshold */}
            <div className="card-premium p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">Seuil de proposition RDV</h3>
                  <p className="text-sm text-gray-600">Score minimum pour proposer un rendez-vous</p>
                </div>
                <span className="text-2xl font-bold text-violet-700">{rdvThreshold}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={rdvThreshold}
                onChange={(e) => setRdvThreshold(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #7c3aed ${rdvThreshold}%, #e5e7eb ${rdvThreshold}%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Relance Delays */}
            <div className="card-premium p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Délais de relance</h3>
                  <p className="text-sm text-gray-600">Configuration des délais automatiques</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mb-4">
                {relanceDelays.map((delay) => (
                  <span
                    key={delay}
                    className="badge badge-violet flex items-center gap-2 text-base px-4 py-2"
                  >
                    {delay}
                    <button
                      onClick={() => removeDelay(delay)}
                      className="hover:bg-violet-200 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ex: 3j, 1sem, 30min..."
                  value={newDelay}
                  onChange={(e) => setNewDelay(e.target.value)}
                  className="input-premium flex-1"
                />
                <button onClick={addDelay} className="btn-secondary">
                  <Plus className="inline-block h-5 w-5 mr-2" />
                  Ajouter
                </button>
              </div>
            </div>

            <button className="btn-primary w-full">
              <Save className="inline-block h-5 w-5 mr-2" />
              Sauvegarder les paramètres
            </button>
          </motion.div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Intégrations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {integrations.map((integration, index) => {
                const Icon = integration.icon;
                const isConnected = integration.status === 'connected';
                return (
                  <motion.div
                    key={integration.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="card-premium p-6"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`p-4 rounded-2xl bg-gradient-to-br ${integration.color}`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{integration.name}</h3>
                          {isConnected ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          ) : (
                            <XCircle className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{integration.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          {integration.lastSync}
                        </div>
                      </div>
                    </div>
                    <button
                      className={`w-full py-3 rounded-xl font-semibold transition-all ${
                        isConnected
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg'
                          : 'glass border-2 border-violet-200 text-violet-700 hover:border-violet-300'
                      }`}
                    >
                      {isConnected ? 'Configuré' : 'Configurer'}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h2>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {analyticsData.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="card-premium p-6"
                >
                  <h3 className="text-sm font-medium text-gray-600 mb-3">{metric.label}</h3>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                    <span
                      className={`text-sm font-bold flex items-center gap-1 ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-orange-600'
                      }`}
                    >
                      <TrendingUp
                        className={`h-4 w-4 ${metric.trend === 'down' ? 'rotate-180' : ''}`}
                      />
                      {metric.change}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Usage Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card-premium p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-6">Utilisation sur 30 jours</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {Array.from({ length: 30 }).map((_, i) => {
                  const height = 20 + Math.random() * 80;
                  return (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.6 + i * 0.02, duration: 0.3 }}
                      className="flex-1 bg-gradient-to-t from-violet-600 to-orange-500 rounded-t-lg hover:opacity-75 transition-opacity cursor-pointer"
                      title={`Jour ${i + 1}`}
                    />
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
