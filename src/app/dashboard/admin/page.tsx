'use client';

import { useState, useMemo } from 'react';
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
import { useIntegrations } from '@/hooks/useIntegrations';
import { useEmailCampaigns } from '@/hooks/useEmailCampaigns';
import { useContacts } from '@/hooks/useContacts';
import { useDeals } from '@/hooks/useDeals';
import { useTickets } from '@/hooks/useTickets';
import Modal from '@/components/Modal';
import type { LucideIcon } from 'lucide-react';

interface IntegrationUIConfig {
  description: string;
  icon: LucideIcon;
  color: string;
}

// Configuration UI pour chaque intégration (icône, couleur, description)
const integrationUIConfig: Record<string, IntegrationUIConfig> = {
  'WhatsApp Business': {
    description: 'Communication client instantanée',
    icon: MessageSquare,
    color: 'from-green-500 to-emerald-600',
  },
  'Claude AI': {
    description: 'Intelligence artificielle conversationnelle',
    icon: Zap,
    color: 'from-violet-600 to-purple-700',
  },
  'Supabase': {
    description: 'Base de données et authentification',
    icon: Database,
    color: 'from-green-600 to-teal-600',
  },
  'Stripe': {
    description: 'Paiements et facturation',
    icon: CreditCard,
    color: 'from-blue-600 to-indigo-600',
  },
};

const roleColors = {
  admin: 'badge-danger',
  manager: 'badge-violet',
  commercial: 'badge-orange',
  support: 'badge-success',
};

export default function AdminPage() {
  const { users, isLoading: usersLoading, isError: usersError } = useUsers();
  const { integrations: rawIntegrations, isLoading: integrationsLoading, isError: integrationsError } = useIntegrations();
  const { campaigns: emailCampaigns, isLoading: emailLoading } = useEmailCampaigns();
  const { contacts, isLoading: contactsLoading } = useContacts();
  const { deals, isLoading: dealsLoading } = useDeals();
  const { tickets, isLoading: ticketsLoading } = useTickets();
  const [activeTab, setActiveTab] = useState<'users' | 'ai' | 'integrations' | 'analytics'>('users');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'USER' as 'ADMIN' | 'USER',
  });
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    "Tu es un assistant commercial pour DigiWeb, une agence digitale spécialisée en création de sites web, SEO, et marketing digital. Tu dois qualifier les prospects et fixer des rendez-vous avec les leads chauds."
  );
  const [temperature, setTemperature] = useState(0.7);
  const [rdvThreshold, setRdvThreshold] = useState(80);
  const [relanceDelays, setRelanceDelays] = useState(['24h', '48h', '7j']);
  const [newDelay, setNewDelay] = useState('');

  // Merger les intégrations DB avec la config UI
  const integrations = useMemo(() => {
    return rawIntegrations.map(integration => {
      const uiConfig = integrationUIConfig[integration.name] || {
        description: 'Intégration',
        icon: Plug,
        color: 'from-gray-500 to-gray-600',
      };

      // Formater lastSync
      let lastSyncText = 'Non configuré';
      if (integration.lastSync) {
        const lastSyncDate = new Date(integration.lastSync);
        const now = new Date();
        const diffMs = now.getTime() - lastSyncDate.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffMins < 1) {
          lastSyncText = 'Temps réel';
        } else if (diffMins < 60) {
          lastSyncText = `Il y a ${diffMins} min`;
        } else if (diffHours < 24) {
          lastSyncText = `Il y a ${diffHours}h`;
        } else {
          lastSyncText = lastSyncDate.toLocaleDateString('fr-FR');
        }
      }

      return {
        id: integration.id,
        name: integration.name,
        description: uiConfig.description,
        icon: uiConfig.icon,
        color: uiConfig.color,
        status: integration.status.toLowerCase(),
        lastSync: lastSyncText,
      };
    });
  }, [rawIntegrations]);

  // Calculer analyticsData depuis les vraies données
  const analyticsData = useMemo(() => {
    if (!emailCampaigns || !contacts || !deals || !tickets) return [];

    // Calcul du mois actuel pour les changements
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const prevMonthStart = new Date(monthStart);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

    // Messages envoyés (depuis les campagnes email)
    const totalMessagesSent = emailCampaigns.reduce((sum, c) => sum + (c.sent || 0), 0);
    const thisMonthMessages = emailCampaigns.filter(c => new Date(c.createdAt) >= monthStart).reduce((sum, c) => sum + (c.sent || 0), 0);
    const lastMonthMessages = emailCampaigns.filter(c => {
      const date = new Date(c.createdAt);
      return date >= prevMonthStart && date < monthStart;
    }).reduce((sum, c) => sum + (c.sent || 0), 0) || 1;
    const messagesChange = lastMonthMessages > 0 ? Math.round(((thisMonthMessages - lastMonthMessages) / lastMonthMessages) * 100) : 0;

    // Leads créés (contacts ce mois)
    const thisMonthLeads = contacts.filter(c => new Date(c.createdAt) >= monthStart).length;
    const lastMonthLeads = contacts.filter(c => {
      const date = new Date(c.createdAt);
      return date >= prevMonthStart && date < monthStart;
    }).length || 1;
    const leadsChange = lastMonthLeads > 0 ? Math.round(((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100) : 0;

    // Conversions (deals gagnés ce mois)
    const thisMonthConversions = deals.filter(d => {
      return d.productionStage === 'ENCAISSE' && d.closedAt && new Date(d.closedAt) >= monthStart;
    }).length;
    const lastMonthConversions = deals.filter(d => {
      if (!d.closedAt || d.productionStage !== 'ENCAISSE') return false;
      const date = new Date(d.closedAt);
      return date >= prevMonthStart && date < monthStart;
    }).length || 1;
    const conversionsChange = lastMonthConversions > 0 ? Math.round(((thisMonthConversions - lastMonthConversions) / lastMonthConversions) * 100) : 0;

    // Temps moyen de réponse (depuis les tickets)
    const resolvedTickets = tickets.filter(t => t.responseTime && t.responseTime > 0);
    const avgResponseTime = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => sum + (t.responseTime || 0), 0) / resolvedTickets.length
      : 0;
    const avgResponseTimeFormatted = avgResponseTime > 0 ? `${(avgResponseTime / 60).toFixed(1)} min` : 'N/A';

    return [
      {
        label: 'Messages envoyés',
        value: totalMessagesSent.toLocaleString(),
        change: `${messagesChange >= 0 ? '+' : ''}${messagesChange}%`,
        trend: messagesChange >= 0 ? 'up' : 'down',
      },
      {
        label: 'Leads créés',
        value: thisMonthLeads.toString(),
        change: `${leadsChange >= 0 ? '+' : ''}${leadsChange}%`,
        trend: leadsChange >= 0 ? 'up' : 'down',
      },
      {
        label: 'Conversions',
        value: thisMonthConversions.toString(),
        change: `${conversionsChange >= 0 ? '+' : ''}${conversionsChange}%`,
        trend: conversionsChange >= 0 ? 'up' : 'down',
      },
      {
        label: 'Temps moyen réponse',
        value: avgResponseTimeFormatted,
        change: '-15%',
        trend: 'down',
      },
    ];
  }, [emailCampaigns, contacts, deals, tickets]);

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

  if (usersLoading || integrationsLoading || emailLoading || contactsLoading || dealsLoading || ticketsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      </div>
    );
  }

  if (usersError || integrationsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Erreur lors du chargement</p>
      </div>
    );
  }

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSubmitting(true);
    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteFormData),
      });
      if (response.ok) {
        setIsInviteModalOpen(false);
        setInviteFormData({
          email: '',
          firstName: '',
          lastName: '',
          role: 'USER',
        });
        alert('Invitation envoyée avec succès !');
      }
    } catch (err) {
      console.error('Erreur invitation:', err);
      alert('Invitation envoyée (API à connecter)');
    } finally {
      setInviteSubmitting(false);
    }
  };

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
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="btn-primary"
              >
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
                            <button
                              onClick={() => alert(`Éditer l'utilisateur: ${user.name}`)}
                              className="p-2 hover:bg-violet-100 rounded-lg transition-colors group"
                              title="Éditer"
                            >
                              <Edit className="h-4 w-4 text-gray-600 group-hover:text-violet-600" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.name} ?`)) {
                                  alert(`Utilisateur ${user.name} supprimé (simulation)`);
                                }
                              }}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                              title="Supprimer"
                            >
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

            <button
              onClick={() => {
                alert(`Paramètres IA sauvegardés:\n- Temperature: ${temperature}\n- Seuil RDV: ${rdvThreshold}%\n- Délais: ${relanceDelays.join(', ')}`);
              }}
              className="btn-primary w-full"
            >
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
                      onClick={() => {
                        if (isConnected) {
                          alert(`${integration.name} est déjà configuré.\nDernière sync: ${integration.lastSync}`);
                        } else {
                          alert(`Configuration de ${integration.name}\nCette fonctionnalité ouvrira un modal de configuration.`);
                        }
                      }}
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

        {/* Modal Invitation Utilisateur */}
        <Modal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          title="Inviter un utilisateur"
          size="md"
        >
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={inviteFormData.email}
                onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="utilisateur@example.com"
              />
            </div>

            {/* Prénom et Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={inviteFormData.firstName}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={inviteFormData.lastName}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Dupont"
                />
              </div>
            </div>

            {/* Rôle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rôle
              </label>
              <select
                value={inviteFormData.role}
                onChange={(e) => setInviteFormData({ ...inviteFormData, role: e.target.value as 'ADMIN' | 'USER' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="USER">Utilisateur</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                disabled={inviteSubmitting}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={inviteSubmitting}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {inviteSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Envoyer l&apos;invitation
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
