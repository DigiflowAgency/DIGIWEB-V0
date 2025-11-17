'use client';

import { BarChart3, TrendingUp, Users, Eye, MousePointer, ArrowUpRight } from 'lucide-react';

const stats = [
  { label: 'Visiteurs Mensuels', value: '45 230', change: '+12%', trend: 'up', color: 'text-orange-600', icon: Users },
  { label: 'Pages Vues', value: '128 450', change: '+8%', trend: 'up', color: 'text-blue-600', icon: Eye },
  { label: 'Taux de Conversion', value: '3.8%', change: '+0.5%', trend: 'up', color: 'text-green-600', icon: TrendingUp },
  { label: 'Taux de Rebond', value: '42%', change: '-5%', trend: 'up', color: 'text-purple-600', icon: MousePointer },
];

const trafficSources = [
  { source: 'Recherche Organique', visitors: 18500, percentage: 41 },
  { source: 'Direct', visitors: 12800, percentage: 28 },
  { source: 'Réseaux Sociaux', visitors: 7200, percentage: 16 },
  { source: 'Référents', visitors: 4530, percentage: 10 },
  { source: 'Email', visitors: 2200, percentage: 5 },
];

const topPages = [
  { page: '/services/seo', views: 12450, bounce: 38 },
  { page: '/blog/guide-marketing', views: 8920, bounce: 42 },
  { page: '/tarifs', views: 7530, bounce: 35 },
  { page: '/contact', views: 6240, bounce: 28 },
  { page: '/a-propos', views: 5180, bounce: 45 },
];

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-orange-600" />
            Analytics Marketing
          </h1>
          <p className="text-gray-600 mt-1">Analysez vos performances marketing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
                <p className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
                <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                  <ArrowUpRight className="h-4 w-4" />
                  {stat.change}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Sources de Trafic</h2>
            <div className="space-y-4">
              {trafficSources.map((source, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">{source.source}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">{source.visitors.toLocaleString()}</span>
                      <span className="text-sm font-bold text-orange-600">{source.percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Pages Populaires</h2>
            <div className="space-y-3">
              {topPages.map((page, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono text-gray-900">{page.page}</span>
                    <span className="text-sm font-bold text-blue-600">{page.views.toLocaleString()} vues</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Taux de rebond</span>
                    <span className="font-semibold">{page.bounce}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
