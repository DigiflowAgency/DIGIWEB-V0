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
  ArrowRight
} from 'lucide-react';

const mockDeals = [
  { id: 1, title: 'Site Web Restaurant', company: 'Restaurant Le Gourmet', value: 4500, stage: 'Proposition', probability: 75, contact: 'Pierre Martin', closeDate: '2024-11-20', daysInStage: 3 },
  { id: 2, title: 'E-commerce Mode', company: 'Boutique Mode Élégance', value: 6200, stage: 'Négociation', probability: 60, contact: 'Sophie Dubois', closeDate: '2024-11-25', daysInStage: 5 },
  { id: 3, title: 'Site Vitrine Avocat', company: 'Cabinet Avocat Dupont', value: 2800, stage: 'Qualifié', probability: 40, contact: 'Jean Dupont', closeDate: '2024-11-30', daysInStage: 2 },
  { id: 4, title: 'SEO Local Coiffeur', company: 'Salon Tendance', value: 1500, stage: 'Proposition', probability: 70, contact: 'Marie Lambert', closeDate: '2024-11-22', daysInStage: 4 },
  { id: 5, title: 'Site + SEO Garage', company: 'Garage Auto Pro', value: 5800, stage: 'Découverte', probability: 30, contact: 'Thomas Bernard', closeDate: '2024-12-05', daysInStage: 1 },
  { id: 6, title: 'E-commerce Boulangerie', company: 'Boulangerie Tradition', value: 3200, stage: 'Gagné', probability: 100, contact: 'Emma Rousseau', closeDate: '2024-11-15', daysInStage: 0 },
  { id: 7, title: 'Site Web Pharmacie', company: 'Pharmacie Santé', value: 3800, stage: 'Négociation', probability: 65, contact: 'Lucas Petit', closeDate: '2024-11-28', daysInStage: 6 },
  { id: 8, title: 'Marketing Digital', company: 'Fleuriste Jardin', value: 2200, stage: 'Perdu', probability: 0, contact: 'Camille Moreau', closeDate: '2024-11-10', daysInStage: 0 },
  { id: 9, title: 'Site Restaurant', company: 'Bistrot Gourmand', value: 4100, stage: 'Proposition', probability: 80, contact: 'Antoine Leroy', closeDate: '2024-11-23', daysInStage: 2 },
  { id: 10, title: 'SEO + Ads Librairie', company: 'Librairie Lecture', value: 2900, stage: 'Qualifié', probability: 45, contact: 'Julie Blanc', closeDate: '2024-12-01', daysInStage: 3 },
  { id: 11, title: 'E-commerce Bio', company: 'Épicerie Bio', value: 4800, stage: 'Négociation', probability: 70, contact: 'Nicolas Garnier', closeDate: '2024-11-26', daysInStage: 4 },
  { id: 12, title: 'Site Web Yoga', company: 'Studio Yoga Zen', value: 2500, stage: 'Proposition', probability: 65, contact: 'Isabelle Dupuis', closeDate: '2024-11-24', daysInStage: 5 },
  { id: 13, title: 'Portail Immobilier', company: 'Agence Immobilière', value: 8900, stage: 'Négociation', probability: 85, contact: 'Maxime Fontaine', closeDate: '2024-11-21', daysInStage: 7 },
  { id: 14, title: 'Site + SEO Spa', company: 'Spa Beauté', value: 3600, stage: 'Proposition', probability: 75, contact: 'Sarah Cohen', closeDate: '2024-11-27', daysInStage: 3 },
  { id: 15, title: 'E-commerce Traiteur', company: 'Traiteur Gourmet', value: 5200, stage: 'Découverte', probability: 35, contact: 'Olivier Roux', closeDate: '2024-12-03', daysInStage: 2 },
];

const stages = [
  { name: 'Découverte', color: 'bg-purple-100 border-purple-300', textColor: 'text-purple-700' },
  { name: 'Qualifié', color: 'bg-blue-100 border-blue-300', textColor: 'text-blue-700' },
  { name: 'Proposition', color: 'bg-yellow-100 border-yellow-300', textColor: 'text-yellow-700' },
  { name: 'Négociation', color: 'bg-orange-100 border-orange-300', textColor: 'text-orange-700' },
  { name: 'Gagné', color: 'bg-green-100 border-green-300', textColor: 'text-green-700' },
];

export default function DealsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const filteredDeals = mockDeals.filter(deal =>
    deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValue = mockDeals.reduce((sum, deal) => sum + deal.value, 0);
  const wonDeals = mockDeals.filter(d => d.stage === 'Gagné');
  const activeDeals = mockDeals.filter(d => !['Gagné', 'Perdu'].includes(d.stage));

  const stats = [
    { label: 'Valeur Totale', value: `${totalValue.toLocaleString()}€`, color: 'text-orange-600' },
    { label: 'Deals Actifs', value: activeDeals.length, color: 'text-blue-600' },
    { label: 'Deals Gagnés', value: wonDeals.length, color: 'text-green-600' },
    { label: 'Taux de Conversion', value: `${Math.round((wonDeals.length / mockDeals.length) * 100)}%`, color: 'text-purple-600' },
  ];

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
          {stats.map((stat, index) => (
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
              const stageDeals = filteredDeals.filter(deal => deal.stage === stage.name);
              const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);

              return (
                <div key={stage.name} className="flex-shrink-0 w-80">
                  <div className={`${stage.color} border-2 rounded-lg p-4 mb-3`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold ${stage.textColor}`}>{stage.name}</h3>
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
                            <span>{deal.company}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span>{deal.contact}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(deal.closeDate).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <span className="text-lg font-bold text-orange-600">
                            {deal.value.toLocaleString()}€
                          </span>
                          <span className="text-sm text-gray-600">
                            {deal.probability}%
                          </span>
                        </div>

                        {deal.daysInStage > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            {deal.daysInStage} jour{deal.daysInStage > 1 ? 's' : ''} dans cette étape
                          </div>
                        )}
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
                  {filteredDeals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-gray-900">{deal.title}</p>
                          <p className="text-sm text-gray-500">{deal.contact}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{deal.company}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-orange-600">
                          {deal.value.toLocaleString()}€
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          deal.stage === 'Découverte' ? 'bg-purple-100 text-purple-700' :
                          deal.stage === 'Qualifié' ? 'bg-blue-100 text-blue-700' :
                          deal.stage === 'Proposition' ? 'bg-yellow-100 text-yellow-700' :
                          deal.stage === 'Négociation' ? 'bg-orange-100 text-orange-700' :
                          deal.stage === 'Gagné' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {deal.stage}
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
                          {new Date(deal.closeDate).toLocaleDateString('fr-FR')}
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
