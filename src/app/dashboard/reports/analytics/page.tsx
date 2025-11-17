'use client';

import { BarChart3, TrendingUp, Euro, Users, Target, Activity, ArrowUpRight } from 'lucide-react';

const stats = [
  { label: 'CA Total', value: '520 500€', change: '+18%', trend: 'up', color: 'text-orange-600', icon: Euro },
  { label: 'Nouveaux Clients', value: '34', change: '+12%', trend: 'up', color: 'text-blue-600', icon: Users },
  { label: 'Deals Gagnés', value: '89', change: '+23%', trend: 'up', color: 'text-green-600', icon: Target },
  { label: 'Taux Conversion', value: '34%', change: '+5%', trend: 'up', color: 'text-purple-600', icon: TrendingUp },
];

const monthlyRevenue = [
  { month: 'Jan', value: 42000 },
  { month: 'Fév', value: 38000 },
  { month: 'Mar', value: 51000 },
  { month: 'Avr', value: 45000 },
  { month: 'Mai', value: 48000 },
  { month: 'Jun', value: 54000 },
  { month: 'Jul', value: 47000 },
  { month: 'Aoû', value: 39000 },
  { month: 'Sep', value: 52000 },
  { month: 'Oct', value: 56000 },
  { month: 'Nov', value: 48500 },
];

const topProducts = [
  { name: 'Site Web Standard', sales: 45, revenue: 135000 },
  { name: 'E-commerce', sales: 23, revenue: 142600 },
  { name: 'SEO Premium', sales: 34, revenue: 102000 },
  { name: 'Marketing Digital', sales: 28, revenue: 84000 },
  { name: 'Maintenance', sales: 67, revenue: 56900 },
];

const recentActivities = [
  { type: 'Deal', description: 'Deal gagné - Restaurant Le Gourmet', amount: 4500, time: 'Il y a 2h' },
  { type: 'Contact', description: 'Nouveau contact créé - Sophie Martin', amount: null, time: 'Il y a 3h' },
  { type: 'Deal', description: 'Deal gagné - Agence Immobilière', amount: 8900, time: 'Il y a 5h' },
  { type: 'Invoice', description: 'Facture payée - Boutique Mode', amount: 6200, time: 'Il y a 1j' },
];

export default function AnalyticsReportPage() {
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.value));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-orange-600" />
            Analytics & Rapports
          </h1>
          <p className="text-gray-600 mt-1">Vue d&apos;ensemble de vos performances</p>
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

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Chiffre d&apos;Affaires 2024</h2>
          <div className="flex items-end justify-between h-64 gap-2">
            {monthlyRevenue.map((data) => (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg hover:from-orange-700 hover:to-orange-500 transition-all cursor-pointer relative group"
                    style={{ height: `${(data.value / maxRevenue) * 100}%` }}
                  >
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {data.value.toLocaleString()}€
                    </span>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-600">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Produits les Plus Vendus</h2>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-orange-100 text-orange-600 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sales} ventes</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-orange-600">{product.revenue.toLocaleString()}€</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Activité Récente</h2>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Activity className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{activity.description}</p>
                    {activity.amount && (
                      <p className="text-sm font-bold text-orange-600">{activity.amount.toLocaleString()}€</p>
                    )}
                    <p className="text-xs text-gray-500">{activity.time}</p>
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
