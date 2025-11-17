'use client';

import { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Euro,
  Calendar,
  User,
  Building2,
  MoreVertical,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';

const stages = [
  { name: 'DECOUVERTE', displayName: 'Découverte', color: 'bg-purple-100 border-purple-300', textColor: 'text-purple-700' },
  { name: 'QUALIFICATION', displayName: 'Qualification', color: 'bg-blue-100 border-blue-300', textColor: 'text-blue-700' },
  { name: 'PROPOSITION', displayName: 'Proposition', color: 'bg-yellow-100 border-yellow-300', textColor: 'text-yellow-700' },
  { name: 'NEGOCIATION', displayName: 'Négociation', color: 'bg-orange-100 border-orange-300', textColor: 'text-orange-700' },
  { name: 'GAGNE', displayName: 'Gagné', color: 'bg-green-100 border-green-300', textColor: 'text-green-700' },
];

export default function DealsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Utiliser le hook useDeals pour récupérer les données depuis l'API
  const { deals, stats, isLoading, isError } = useDeals({
    search: searchQuery || undefined,
  });

  const statsDisplay = [
    { label: 'Valeur Totale', value: `${stats.totalValue.toLocaleString()}€`, color: 'text-orange-600' },
    { label: 'Deals Actifs', value: stats.active, color: 'text-blue-600' },
    { label: 'Deals Gagnés', value: stats.won, color: 'text-green-600' },
    { label: 'Taux de Conversion', value: stats.total > 0 ? `${Math.round((stats.won / stats.total) * 100)}%` : '0%', color: 'text-purple-600' },
  ];

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement des deals...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement des deals</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                Deals
              </h1>
              <p className="text-gray-600 mt-1">Gérez votre pipeline de ventes</p>
            </div>
            <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm">
              <Plus className="h-5 w-5" />
              Nouveau Deal
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {statsDisplay.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par titre ou entreprise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex gap-2 border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'kanban' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Liste
              </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5" />
              Filtres
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        {viewMode === 'kanban' && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const stageDeals = deals.filter(deal => deal.stage === stage.name);
              const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);

              return (
                <div key={stage.name} className="flex-shrink-0 w-80">
                  <div className={`${stage.color} border-2 rounded-lg p-4 mb-3`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold ${stage.textColor}`}>{stage.displayName}</h3>
                      <span className={`text-sm font-semibold ${stage.textColor}`}>
                        {stageDeals.length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {stageValue.toLocaleString()}€
                    </p>
                  </div>

                  <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                    {stageDeals.map((deal) => (
                      <div key={deal.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 text-sm">{deal.title}</h4>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="h-4 w-4" />
                            <span>{deal.company?.name || 'Sans entreprise'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span>{deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : 'Sans contact'}</span>
                          </div>
                          {deal.expectedCloseDate && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(deal.expectedCloseDate).toLocaleDateString('fr-FR')}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <span className="text-lg font-bold text-orange-600">
                            {deal.value.toLocaleString()}€
                          </span>
                          <span className="text-sm text-gray-600">
                            {deal.probability}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deal</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Entreprise</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Valeur</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Étape</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Probabilité</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Clôture</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-gray-900">{deal.title}</p>
                          <p className="text-sm text-gray-500">
                            {deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : 'Sans contact'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{deal.company?.name || 'Sans entreprise'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-orange-600">
                          {deal.value.toLocaleString()}€
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          deal.stage === 'DECOUVERTE' ? 'bg-purple-100 text-purple-700' :
                          deal.stage === 'QUALIFICATION' ? 'bg-blue-100 text-blue-700' :
                          deal.stage === 'PROPOSITION' ? 'bg-yellow-100 text-yellow-700' :
                          deal.stage === 'NEGOCIATION' ? 'bg-orange-100 text-orange-700' :
                          deal.stage === 'GAGNE' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {stages.find(s => s.name === deal.stage)?.displayName || deal.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                            <div
                              className="bg-orange-600 h-2 rounded-full"
                              style={{ width: `${deal.probability}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{deal.probability}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString('fr-FR') : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <ArrowRight className="h-4 w-4 text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
