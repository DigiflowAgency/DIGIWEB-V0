'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Upload,
  Download,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface Prospect {
  id: string;
  name: string;
  siret: string | null;
  activity: string;
  address: string;
  city: string;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  status: string;
  qualityScore: number | null;
  enrichedBy: string | null;
  assignedToId: string | null;
  convertedToDeal: boolean;
  createdAt: string;
  users: {
    firstName: string;
    lastName: string;
  } | null;
}

interface Commercial {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; isDeal?: boolean }> = {
  A_TRAITER: { label: 'À traiter', color: 'bg-gray-100 text-gray-700' },
  A_CONTACTER: { label: 'À contacter', color: 'bg-blue-100 text-blue-700', isDeal: true },
  EN_DISCUSSION: { label: 'En discussion', color: 'bg-cyan-100 text-cyan-700', isDeal: true },
  A_RELANCER: { label: 'À relancer', color: 'bg-orange-100 text-orange-700', isDeal: true },
  RDV_PRIS: { label: 'RDV pris', color: 'bg-indigo-100 text-indigo-700', isDeal: true },
  NEGO_HOT: { label: 'Négociation chaude', color: 'bg-pink-100 text-pink-700', isDeal: true },
  NON_QUALIFIE: { label: 'Non qualifié', color: 'bg-red-100 text-red-700' },
};

// Statuts qui créent automatiquement un deal
const DEAL_STATUSES = ['A_CONTACTER', 'EN_DISCUSSION', 'A_RELANCER', 'RDV_PRIS', 'NEGO_HOT'];

export default function ProspectionPage() {
  const { data: session } = useSession();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [commercials, setCommercials] = useState<Commercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCommercial, setSelectedCommercial] = useState<string>('all');
  const [importStatus, setImportStatus] = useState<string>('A_TRAITER');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = session?.user?.role === 'ADMIN';

  const fetchProspects = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (selectedCommercial !== 'all') params.append('assignedToId', selectedCommercial);

      const res = await fetch(`/api/prospects?${params}`);
      const data = await res.json();
      setProspects(data.prospects || []);
    } catch (error) {
      console.error('Erreur chargement prospects:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, selectedCommercial]);

  const fetchCommercials = useCallback(async () => {
    try {
      const res = await fetch('/api/users?role=VENTE');
      const data = await res.json();
      setCommercials(data.users || []);
    } catch (error) {
      console.error('Erreur chargement commerciaux:', error);
    }
  }, []);

  useEffect(() => {
    fetchProspects();
    fetchCommercials();
  }, [fetchProspects, fetchCommercials]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedCommercial !== 'all') {
        formData.append('assignedToId', selectedCommercial);
      }
      formData.append('defaultStatus', importStatus);

      const res = await fetch('/api/prospects/import', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      const data = await res.json();
      alert(`Import réussi ! ${data.batch.successRows} prospects importés, ${data.batch.errorRows} erreurs`);
      fetchProspects();
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'import');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEnrich = async (prospectId: string, siret: string) => {
    if (!siret) {
      alert('Le SIRET est requis pour l\'enrichissement');
      return;
    }

    try {
      const res = await fetch('/api/prospects/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId,
          siret,
          provider: 'pappers', // Par défaut
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      alert('Prospect enrichi avec succès !');
      fetchProspects();
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'enrichissement');
    }
  };

  const handleStatusChange = async (prospectId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/prospects/${prospectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      const data = await res.json();
      if (data.dealCreated) {
        alert(`Deal créé automatiquement pour "${data.prospect.name}" !`);
      }
      fetchProspects();
    } catch (error: any) {
      alert(error.message || 'Erreur lors du changement de statut');
    }
  };

  const stats = {
    total: prospects.length,
    aTraiter: prospects.filter(p => p.status === 'A_TRAITER').length,
    enCours: prospects.filter(p => DEAL_STATUSES.includes(p.status) && !p.convertedToDeal).length,
    convertis: prospects.filter(p => p.convertedToDeal).length,
    avgQuality: prospects.length > 0
      ? Math.round(prospects.reduce((sum, p) => sum + (p.qualityScore || 0), 0) / prospects.length)
      : 0,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Prospection</h1>
        <p className="text-gray-600">
          Importez et qualifiez vos prospects pour une prospection ciblée
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-100 rounded-lg">
              <Target className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Clock className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">À traiter</p>
              <p className="text-2xl font-bold text-gray-900">{stats.aTraiter}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-gray-900">{stats.enCours}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Convertis en deal</p>
              <p className="text-2xl font-bold text-gray-900">{stats.convertis}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Sparkles className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Qualité moy.</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgQuality}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {isAdmin && (
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <select
                value={importStatus}
                onChange={(e) => setImportStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                {Object.entries(STATUS_LABELS).map(([key, { label, isDeal }]) => (
                  <option key={key} value={key}>
                    {label} {isDeal ? '→ Deal' : ''}
                  </option>
                ))}
              </select>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-violet-700 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Importer CSV
                  </>
                )}
              </button>

              <a
                href="/templates/prospects-template.csv"
                download
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-200"
              >
                <Download className="h-5 w-5" />
                Télécharger modèle CSV
              </a>
            </div>
          )}

          <div className="flex items-center gap-4">
            <select
              value={selectedCommercial}
              onChange={(e) => setSelectedCommercial(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="all">Tous les commerciaux</option>
              {commercials.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Format CSV attendu :</strong> nom, siret, activite, adresse, ville, code_postal, telephone, email, site_web, statut
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Statuts possibles : A_TRAITER, A_CONTACTER, EN_DISCUSSION, A_RELANCER, RDV_PRIS, NEGO_HOT, NON_QUALIFIE
              <br />
              <em>Les statuts A_CONTACTER et suivants créent automatiquement un deal.</em>
            </p>
          </div>
        )}
      </div>

      {/* Liste des prospects */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Entreprise</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Activité</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Localisation</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Commercial</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Qualité</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : prospects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Aucun prospect. Importez un fichier CSV pour commencer.
                  </td>
                </tr>
              ) : (
                prospects.map((prospect) => (
                  <tr key={prospect.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{prospect.name}</p>
                        {prospect.siret && (
                          <p className="text-sm text-gray-500">SIRET: {prospect.siret}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{prospect.activity}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{prospect.city}</p>
                      {prospect.postalCode && (
                        <p className="text-sm text-gray-500">{prospect.postalCode}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {prospect.phone && (
                        <p className="text-sm text-gray-900">{prospect.phone}</p>
                      )}
                      {prospect.email && (
                        <p className="text-sm text-gray-500">{prospect.email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {prospect.users ? (
                        <p className="text-sm text-gray-900">
                          {prospect.users.firstName} {prospect.users.lastName}
                        </p>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Non attribué</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {prospect.qualityScore !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-violet-600 h-2 rounded-full"
                              style={{ width: `${prospect.qualityScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                            {prospect.qualityScore}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {prospect.convertedToDeal ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                          <CheckCircle className="h-3 w-3" />
                          Deal créé
                        </span>
                      ) : (
                        <select
                          value={prospect.status}
                          onChange={(e) => handleStatusChange(prospect.id, e.target.value)}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold border-0 cursor-pointer ${
                            STATUS_LABELS[prospect.status]?.color || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {Object.entries(STATUS_LABELS).map(([key, { label, isDeal }]) => (
                            <option key={key} value={key}>
                              {label} {isDeal ? '→ Deal' : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {prospect.siret && !prospect.enrichedBy && (
                        <button
                          onClick={() => handleEnrich(prospect.id, prospect.siret!)}
                          className="text-violet-600 hover:text-violet-700 text-sm font-semibold"
                        >
                          Enrichir
                        </button>
                      )}
                      {prospect.enrichedBy && (
                        <span className="text-green-600 text-sm flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Enrichi
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
