'use client';

import { useState } from 'react';
import { LayoutDashboard, Plus, Search, Eye, Edit, Copy, Star, Loader2 } from 'lucide-react';
import { useDashboards } from '@/hooks/useDashboards';

export default function DashboardsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { dashboards, isLoading, isError } = useDashboards();

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

  const stats = [
    { label: 'Total Dashboards', value: dashboards.length, color: 'text-orange-600' },
    { label: 'Favoris', value: dashboards.filter(d => d.favorite).length, color: 'text-yellow-600' },
    { label: 'Total Widgets', value: dashboards.reduce((sum, d) => sum + d.widgets, 0), color: 'text-blue-600' },
    { label: 'Actifs', value: dashboards.length, color: 'text-green-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <LayoutDashboard className="h-8 w-8 text-orange-600" />
                Dashboards Personnalisés
              </h1>
              <p className="text-gray-600 mt-1">Créez et gérez vos tableaux de bord</p>
            </div>
            <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm">
              <Plus className="h-5 w-5" />
              Nouveau Dashboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un dashboard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).map((dashboard) => (
            <div key={dashboard.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{dashboard.name}</h3>
                    {dashboard.favorite && (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{dashboard.description}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Widgets</span>
                  <span className="font-semibold text-gray-900">{dashboard.widgets}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mis à jour</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(dashboard.updatedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                  <Eye className="h-4 w-4" />
                  Voir
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
