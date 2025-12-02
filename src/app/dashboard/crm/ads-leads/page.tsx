'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  RefreshCw,
  User,
  Mail,
  Phone,
  Calendar,
  Target,
  Loader2,
  CheckCircle,
  AlertCircle,
  Facebook,
  Instagram,
  Filter,
  Building2,
  Shuffle,
  Megaphone,
  Layers,
  FileText,
  Leaf,
  MessageCircle,
} from 'lucide-react';
import AutoAssignModal from '@/components/auto-assign-modal';

interface MetaLead {
  id: string;
  metaLeadId: string;
  formName: string | null;
  pageId: string | null;
  pageName: string | null;
  adId: string | null;
  adName: string | null;
  adsetId: string | null;
  adsetName: string | null;
  campaignId: string | null;
  campaignName: string | null;
  platform: string | null;
  isOrganic: boolean | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  customFields: any;
  status: 'LIBRE' | 'ASSIGNE' | 'CONVERTI';
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  convertedToDeal: boolean;
  dealId: string | null;
  metaCreatedAt: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  libre: number;
  assigne: number;
  converti: number;
}

interface PageStat {
  pageId: string | null;
  pageName: string | null;
  _count: { id: number };
}

interface MetaPage {
  id: string;
  name: string;
  category?: string;
}

const STATUS_COLORS = {
  LIBRE: 'bg-green-100 text-green-700 border-green-300',
  ASSIGNE: 'bg-blue-100 text-blue-700 border-blue-300',
  CONVERTI: 'bg-violet-100 text-violet-700 border-violet-300',
};

const STATUS_LABELS = {
  LIBRE: 'Libre',
  ASSIGNE: 'Assigné',
  CONVERTI: 'Converti',
};

// Couleurs pour les différentes entreprises
const PAGE_COLORS: Record<string, string> = {
  'Digiflow': 'bg-blue-100 text-blue-700 border-blue-300',
  'Be Hype': 'bg-orange-100 text-orange-700 border-orange-300',
};

const getPageColor = (pageName: string | null) => {
  if (!pageName) return 'bg-gray-100 text-gray-700 border-gray-300';
  return PAGE_COLORS[pageName] || 'bg-purple-100 text-purple-700 border-purple-300';
};

export default function AdsLeadsPage() {
  useSession(); // Ensures user is authenticated
  const [leads, setLeads] = useState<MetaLead[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, libre: 0, assigne: 0, converti: 0 });
  const [pageStats, setPageStats] = useState<PageStat[]>([]);
  const [pages, setPages] = useState<MetaPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pageFilter, setPageFilter] = useState<string>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [commerciaux, setCommerciaux] = useState<{ id: string; firstName: string; lastName: string }[]>([]);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (pageFilter !== 'all') {
        params.append('pageId', pageFilter);
      }
      const response = await fetch(`/api/meta-leads?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setLeads(data.leads || []);
        setStats(data.stats || { total: 0, libre: 0, assigne: 0, converti: 0 });
        setPageStats(data.pageStats || []);
        setPages(data.pages || []);
      } else {
        console.error('Erreur:', data.error);
      }
    } catch (error) {
      console.error('Erreur chargement leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, pageFilter]);

  // Charger les commerciaux au montage
  useEffect(() => {
    const fetchCommerciaux = async () => {
      try {
        const response = await fetch('/api/users?role=VENTE');
        const data = await response.json();
        if (response.ok && data.users) {
          setCommerciaux(data.users.filter((u: any) => u.status === 'ACTIVE'));
        }
      } catch (error) {
        console.error('Erreur chargement commerciaux:', error);
      }
    };
    fetchCommerciaux();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setMessage(null);
    try {
      const response = await fetch('/api/meta-leads', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        const pagesSummary = data.pageStats
          ?.map((ps: PageStat) => `${ps.pageName}: ${ps._count.id}`)
          .join(', ') || '';
        setMessage({
          type: 'success',
          text: `Synchronisation réussie: ${data.created} nouveaux leads importés (${data.skipped} ignorés). ${pagesSummary}`,
        });
        fetchLeads();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Erreur lors de la synchronisation',
        });
      }
    } catch (_error) {
      setMessage({
        type: 'error',
        text: 'Erreur de connexion à Meta',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAssign = async (leadId: string) => {
    setIsAssigning(leadId);
    setMessage(null);
    try {
      const response = await fetch(`/api/meta-leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign' }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Lead attribué avec succès ! Deal créé dans la pipeline.`,
        });
        fetchLeads();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Erreur lors de l\'attribution',
        });
      }
    } catch (_error) {
      setMessage({
        type: 'error',
        text: 'Erreur lors de l\'attribution',
      });
    } finally {
      setIsAssigning(null);
    }
  };

  return (
    <div className="min-h-screen gradient-mesh py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl shadow-lg">
                <Facebook className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  Ads Leads
                </h1>
                <p className="text-gray-600">Leads provenant de Meta Ads (Facebook/Instagram)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {stats.libre > 0 && commerciaux.length >= 2 && (
                <button
                  onClick={() => setShowAutoAssign(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all"
                >
                  <Shuffle className="h-5 w-5" />
                  Attribution auto ({stats.libre})
                </button>
              )}
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
              </button>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Stats globales */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total leads</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.libre}</div>
            <div className="text-sm text-gray-500">Libres</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-violet-200">
            <div className="text-2xl font-bold text-violet-600">{stats.converti}</div>
            <div className="text-sm text-gray-500">Convertis</div>
          </div>
        </div>

        {/* Stats par entreprise */}
        {pageStats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {pageStats.map((ps) => (
              <div
                key={ps.pageId || 'unknown'}
                className={`rounded-xl shadow-sm p-4 border ${getPageColor(ps.pageName)}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium truncate">{ps.pageName || 'Inconnu'}</span>
                </div>
                <div className="text-2xl font-bold">{ps._count.id}</div>
                <div className="text-xs opacity-75">leads</div>
              </div>
            ))}
          </div>
        )}

        {/* Filtres */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">Filtres:</span>
          </div>

          {/* Filtre par statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="LIBRE">Libres uniquement</option>
            <option value="ASSIGNE">Assignés</option>
            <option value="CONVERTI">Convertis</option>
          </select>

          {/* Filtre par entreprise */}
          <select
            value={pageFilter}
            onChange={(e) => setPageFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toutes les entreprises</option>
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.name}
              </option>
            ))}
          </select>
        </div>

        {/* Leads List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Facebook className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun lead Meta</h3>
            <p className="text-gray-500 mb-4">
              Cliquez sur "Synchroniser" pour récupérer les leads depuis vos campagnes Meta Ads.
            </p>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Lancer la synchronisation
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {leads.map((lead) => {
              const PlatformIcon = lead.platform === 'instagram' ? Instagram : lead.platform === 'messenger' ? MessageCircle : Facebook;
              const platformColor = lead.platform === 'instagram' ? 'text-pink-500' : lead.platform === 'messenger' ? 'text-blue-500' : 'text-blue-600';

              return (
                <div
                  key={lead.id}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header: Nom + Badges */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {lead.fullName || 'Nom non renseigné'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span
                              className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${STATUS_COLORS[lead.status]}`}
                            >
                              {STATUS_LABELS[lead.status]}
                            </span>
                            {lead.pageName && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${getPageColor(lead.pageName)}`}>
                                <Building2 className="h-3 w-3" />
                                {lead.pageName}
                              </span>
                            )}
                            {lead.platform && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border border-gray-200 bg-gray-50 text-gray-600">
                                <PlatformIcon className={`h-3 w-3 ${platformColor}`} />
                                {lead.platform}
                              </span>
                            )}
                            {lead.isOrganic && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border border-green-200 bg-green-50 text-green-600">
                                <Leaf className="h-3 w-3" />
                                Organique
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Contact: Email + Téléphone + Date */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-4">
                        {lead.email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <a href={`mailto:${lead.email}`} className="hover:text-blue-600 truncate">
                              {lead.email}
                            </a>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <a href={`tel:${lead.phone}`} className="hover:text-blue-600">
                              {lead.phone}
                            </a>
                          </div>
                        )}
                        {lead.metaCreatedAt && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span>
                              {new Date(lead.metaCreatedAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Infos Pub: Campagne, Adset, Ad, Formulaire */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm border-t border-gray-100 pt-4">
                        {lead.campaignName && (
                          <div className="flex items-start gap-2 text-gray-600">
                            <Megaphone className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-xs text-gray-400">Campagne</div>
                              <div className="font-medium truncate" title={lead.campaignName}>{lead.campaignName}</div>
                            </div>
                          </div>
                        )}
                        {lead.adsetName && (
                          <div className="flex items-start gap-2 text-gray-600">
                            <Layers className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-xs text-gray-400">Ensemble</div>
                              <div className="font-medium truncate" title={lead.adsetName}>{lead.adsetName}</div>
                            </div>
                          </div>
                        )}
                        {lead.adName && (
                          <div className="flex items-start gap-2 text-gray-600">
                            <Target className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-xs text-gray-400">Publicité</div>
                              <div className="font-medium truncate" title={lead.adName}>{lead.adName}</div>
                            </div>
                          </div>
                        )}
                        {lead.formName && (
                          <div className="flex items-start gap-2 text-gray-600">
                            <FileText className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-xs text-gray-400">Formulaire</div>
                              <div className="font-medium truncate" title={lead.formName}>{lead.formName}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Assignation */}
                      {lead.assignedTo && (
                        <div className="mt-4 pt-3 border-t border-gray-100 text-sm text-gray-500">
                          <User className="h-4 w-4 inline mr-1" />
                          Assigné à: <span className="font-medium text-gray-700">{lead.assignedTo.firstName} {lead.assignedTo.lastName}</span>
                        </div>
                      )}

                      {/* Champs personnalisés */}
                      {lead.customFields && Object.keys(lead.customFields).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-400 mb-2">Champs personnalisés</div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(lead.customFields).map(([key, value]) => (
                              <span key={key} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                <span className="font-medium">{key}:</span> {String(value)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bouton action */}
                    <div className="ml-4 flex-shrink-0">
                      {lead.status === 'LIBRE' ? (
                        <button
                          onClick={() => handleAssign(lead.id)}
                          disabled={isAssigning === lead.id}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg hover:from-blue-700 hover:to-violet-700 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {isAssigning === lead.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                          S'attribuer
                        </button>
                      ) : lead.dealId ? (
                        <a
                          href={`/dashboard/crm`}
                          className="px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors inline-flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Voir le deal
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal d'attribution automatique */}
      <AutoAssignModal
        isOpen={showAutoAssign}
        onClose={() => setShowAutoAssign(false)}
        leads={leads.filter((l) => l.status === 'LIBRE')}
        users={commerciaux}
        onComplete={() => {
          fetchLeads();
          setShowAutoAssign(false);
        }}
        onLeadAssigned={fetchLeads}
      />
    </div>
  );
}
