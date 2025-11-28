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
  Filter,
} from 'lucide-react';

interface MetaLead {
  id: string;
  metaLeadId: string;
  formName: string | null;
  campaignName: string | null;
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

export default function AdsLeadsPage() {
  useSession(); // Ensures user is authenticated
  const [leads, setLeads] = useState<MetaLead[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, libre: 0, assigne: 0, converti: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }
      const response = await fetch(`/api/meta-leads?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setLeads(data.leads || []);
        setStats(data.stats || { total: 0, libre: 0, assigne: 0, converti: 0 });
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
  }, [filter]);

  const handleSync = async () => {
    setIsSyncing(true);
    setMessage(null);
    try {
      const response = await fetch('/api/meta-leads', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Synchronisation réussie: ${data.created} nouveaux leads importés (${data.skipped} ignorés)`,
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

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total leads</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.libre}</div>
            <div className="text-sm text-gray-500">Libres</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.assigne}</div>
            <div className="text-sm text-gray-500">Assignés</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-violet-200">
            <div className="text-2xl font-bold text-violet-600">{stats.converti}</div>
            <div className="text-sm text-gray-500">Convertis</div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les leads</option>
            <option value="LIBRE">Libres uniquement</option>
            <option value="ASSIGNE">Assignés</option>
            <option value="CONVERTI">Convertis</option>
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
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {lead.fullName || 'Nom non renseigné'}
                        </h3>
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${
                            STATUS_COLORS[lead.status]
                          }`}
                        >
                          {STATUS_LABELS[lead.status]}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {lead.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a
                            href={`mailto:${lead.email}`}
                            className="hover:text-blue-600 truncate"
                          >
                            {lead.email}
                          </a>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a href={`tel:${lead.phone}`} className="hover:text-blue-600">
                            {lead.phone}
                          </a>
                        </div>
                      )}
                      {lead.formName && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Target className="h-4 w-4 text-gray-400" />
                          <span className="truncate">{lead.formName}</span>
                        </div>
                      )}
                      {lead.metaCreatedAt && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            {new Date(lead.metaCreatedAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                    </div>

                    {lead.assignedTo && (
                      <div className="mt-3 text-sm text-gray-500">
                        Assigné à: <span className="font-medium">{lead.assignedTo.firstName} {lead.assignedTo.lastName}</span>
                      </div>
                    )}

                    {lead.campaignName && (
                      <div className="mt-2 text-xs text-gray-400">
                        Campagne: {lead.campaignName}
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
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
                        href={`/dashboard/crm/pipeline`}
                        className="px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors inline-flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Voir le deal
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
