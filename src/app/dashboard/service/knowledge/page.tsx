'use client';

import { useState } from 'react';
import { BookOpen, Plus, Search, Eye, Edit, Folder, Loader2 } from 'lucide-react';
import { useKnowledge } from '@/hooks/useKnowledge';

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { articles, stats, isLoading, isError } = useKnowledge({ search: searchQuery || undefined });

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

  const statsDisplay = [
    { label: 'Total Articles', value: stats.total, color: 'text-orange-600' },
    { label: 'Vues Totales', value: stats.totalViews.toLocaleString(), color: 'text-blue-600' },
    { label: 'Catégories', value: stats.categories, color: 'text-green-600' },
    { label: 'Vues Moyennes', value: stats.avgViews, color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-orange-600" />
                Base de Connaissances
              </h1>
              <p className="text-gray-600 mt-1">Documentation et guides pour vos clients</p>
            </div>
            <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm">
              <Plus className="h-5 w-5" />
              Nouvel Article
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {statsDisplay.map((stat, index) => (
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
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-orange-600 font-semibold">
                  <Folder className="h-4 w-4" />
                  {article.category}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Eye className="h-4 w-4" />
                  {article.views}
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">{article.title}</h3>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Mis à jour: {new Date(article.updatedAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                  <Eye className="h-4 w-4" />
                  Voir
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
