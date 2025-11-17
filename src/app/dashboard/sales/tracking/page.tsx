'use client';

import {
  TrendingUp,
  Euro,
  Target,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const monthlyData = [
  { month: 'Jan', revenue: 42000, deals: 8, contacts: 45 },
  { month: 'Fév', revenue: 38000, deals: 7, contacts: 52 },
  { month: 'Mar', revenue: 51000, deals: 10, contacts: 58 },
  { month: 'Avr', revenue: 45000, deals: 9, contacts: 61 },
  { month: 'Mai', revenue: 48000, deals: 9, contacts: 67 },
  { month: 'Jun', revenue: 54000, deals: 11, contacts: 73 },
  { month: 'Jul', revenue: 47000, deals: 8, contacts: 78 },
  { month: 'Aoû', revenue: 39000, deals: 7, contacts: 82 },
  { month: 'Sep', revenue: 52000, deals: 10, contacts: 89 },
  { month: 'Oct', revenue: 56000, deals: 11, contacts: 95 },
  { month: 'Nov', revenue: 48500, deals: 9, contacts: 102 },
  { month: 'Déc', revenue: 0, deals: 0, contacts: 0 },
];

const topPerformers = [
  { name: 'Sophie Martin', deals: 15, revenue: 85000, conversion: 68 },
  { name: 'Pierre Dubois', deals: 12, revenue: 72000, conversion: 63 },
  { name: 'Marie Lambert', deals: 10, revenue: 58000, conversion: 58 },
  { name: 'Jean Dupont', deals: 8, revenue: 45000, conversion: 52 },
  { name: 'Lucas Petit', deals: 7, revenue: 38000, conversion: 48 },
];

export default function TrackingPage() {
  const currentMonth = monthlyData[10]; // Nov
  const previousMonth = monthlyData[9]; // Oct
  const revenueChange = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100).toFixed(1);
  const dealsChange = ((currentMonth.deals - previousMonth.deals) / previousMonth.deals * 100).toFixed(1);

  const yearTotal = monthlyData.slice(0, 11).reduce((sum, m) => sum + m.revenue, 0);
  const yearDeals = monthlyData.slice(0, 11).reduce((sum, m) => sum + m.deals, 0);

  const stats = [
    { label: 'CA Novembre', value: `${currentMonth.revenue.toLocaleString()}€`, change: `${revenueChange}%`, trend: parseFloat(revenueChange) > 0 ? 'up' : 'down', color: 'text-orange-600' },
    { label: 'Deals Novembre', value: currentMonth.deals, change: `${dealsChange}%`, trend: parseFloat(dealsChange) > 0 ? 'up' : 'down', color: 'text-blue-600' },
    { label: 'CA Annuel', value: `${yearTotal.toLocaleString()}€`, change: '+18%', trend: 'up', color: 'text-green-600' },
    { label: 'Total Deals 2024', value: yearDeals, change: '+12%', trend: 'up', color: 'text-purple-600' },
  ];

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            Suivi des Ventes
          </h1>
          <p className="text-gray-600 mt-1">Analysez vos performances commerciales</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color} mb-2`}>{stat.value}</p>
              <div className={`flex items-center gap-1 text-sm font-semibold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {stat.change}
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Chiffre d&apos;Affaires 2024</h2>
          <div className="flex items-end justify-between h-64 gap-2">
            {monthlyData.slice(0, 11).map((data, index) => (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg hover:from-orange-700 hover:to-orange-500 transition-all cursor-pointer relative group"
                    style={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                  >
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {data.revenue.toLocaleString()}€
                    </span>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-600">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Top Performers</h2>
            <div className="space-y-4">
              {topPerformers.map((performer, index) => (
                <div key={performer.name} className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-100 text-orange-600 font-bold text-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{performer.name}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{performer.deals} deals</span>
                      <span>•</span>
                      <span className="font-semibold text-orange-600">{performer.revenue.toLocaleString()}€</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">{performer.conversion}%</p>
                    <p className="text-xs text-gray-500">conversion</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Goals */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Objectifs Mensuels</h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">Chiffre d&apos;Affaires</span>
                  <span className="text-sm font-bold text-orange-600">
                    {currentMonth.revenue.toLocaleString()}€ / 60 000€
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${(currentMonth.revenue / 60000) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((currentMonth.revenue / 60000) * 100)}% de l&apos;objectif
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">Nouveaux Deals</span>
                  <span className="text-sm font-bold text-blue-600">
                    {currentMonth.deals} / 12
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${(currentMonth.deals / 12) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((currentMonth.deals / 12) * 100)}% de l&apos;objectif
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">Nouveaux Contacts</span>
                  <span className="text-sm font-bold text-purple-600">
                    {currentMonth.contacts} / 120
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                    style={{ width: `${(currentMonth.contacts / 120) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((currentMonth.contacts / 120) * 100)}% de l&apos;objectif
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
