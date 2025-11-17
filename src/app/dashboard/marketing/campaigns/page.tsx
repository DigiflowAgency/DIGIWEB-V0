'use client';

import { useState } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  Eye,
  Edit,
  TrendingUp,
  Users,
  MousePointer,
  DollarSign
} from 'lucide-react';

const mockCampaigns = [
  { id: 1, name: 'Lancement Automne 2024', type: 'Email', status: 'Active', startDate: '2024-11-01', endDate: '2024-11-30', reach: 2500, clicks: 420, conversions: 38, budget: 1200 },
  { id: 2, name: 'Promotion Black Friday', type: 'Social Media', status: 'Planifiée', startDate: '2024-11-25', endDate: '2024-11-29', reach: 5000, clicks: 0, conversions: 0, budget: 2500 },
  { id: 3, name: 'Newsletter Hebdo', type: 'Email', status: 'Active', startDate: '2024-11-01', endDate: '2024-12-31', reach: 3200, clicks: 580, conversions: 52, budget: 800 },
  { id: 4, name: 'Google Ads Q4', type: 'Paid Ads', status: 'Active', startDate: '2024-10-01', endDate: '2024-12-31', reach: 12000, clicks: 1850, conversions: 145, budget: 5000 },
  { id: 5, name: 'LinkedIn B2B', type: 'Social Media', status: 'Active', startDate: '2024-11-01', endDate: '2024-11-30', reach: 1800, clicks: 340, conversions: 28, budget: 1500 },
  { id: 6, name: 'Webinaire SEO', type: 'Event', status: 'Terminée', startDate: '2024-10-15', endDate: '2024-10-15', reach: 450, clicks: 380, conversions: 67, budget: 800 },
  { id: 7, name: 'Facebook Retargeting', type: 'Paid Ads', status: 'Active', startDate: '2024-11-10', endDate: '2024-12-10', reach: 4200, clicks: 680, conversions: 54, budget: 1800 },
  { id: 8, name: 'Instagram Stories', type: 'Social Media', status: 'Active', startDate: '2024-11-01', endDate: '2024-11-30', reach: 3500, clicks: 520, conversions: 41, budget: 900 },
  { id: 9, name: 'Campagne SEO Local', type: 'Content', status: 'Active', startDate: '2024-09-01', endDate: '2024-12-31', reach: 8500, clicks: 1250, conversions: 98, budget: 2200 },
  { id: 10, name: 'Email Réactivation', type: 'Email', status: 'Planifiée', startDate: '2024-12-01', endDate: '2024-12-15', reach: 1500, clicks: 0, conversions: 0, budget: 600 },
];

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredCampaigns = mockCampaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || campaign.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalReach = mockCampaigns.reduce((sum, c) => sum + c.reach, 0);
  const totalClicks = mockCampaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalConversions = mockCampaigns.reduce((sum, c) => sum + c.conversions, 0);
  const totalBudget = mockCampaigns.reduce((sum, c) => sum + c.budget, 0);

  const stats = [
    { label: 'Portée Totale', value: totalReach.toLocaleString(), color: 'text-orange-600', icon: Users },
    { label: 'Total Clics', value: totalClicks.toLocaleString(), color: 'text-blue-600', icon: MousePointer },
    { label: 'Conversions', value: totalConversions, color: 'text-green-600', icon: TrendingUp },
    { label: 'Budget Total', value: `${totalBudget.toLocaleString()}€`, color: 'text-purple-600', icon: DollarSign },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Planifiée': return 'bg-blue-100 text-blue-700';
      case 'Terminée': return 'bg-gray-100 text-gray-700';
      case 'En Pause': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Megaphone className="h-8 w-8 text-orange-600" />
                Campagnes Marketing
              </h1>
              <p className="text-gray-600 mt-1">Gérez toutes vos campagnes marketing</p>
            </div>
            <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm">
              <Plus className="h-5 w-5" />
              Nouvelle Campagne
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Active</option>
              <option value="planifiée">Planifiée</option>
              <option value="en pause">En Pause</option>
              <option value="terminée">Terminée</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5" />
              Filtres
            </button>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => {
            const clickRate = campaign.reach > 0 ? ((campaign.clicks / campaign.reach) * 100).toFixed(1) : 0;
            const conversionRate = campaign.clicks > 0 ? ((campaign.conversions / campaign.clicks) * 100).toFixed(1) : 0;

            return (
              <div key={campaign.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{campaign.name}</h3>
                    <span className="text-sm text-gray-500">{campaign.type}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Portée</span>
                    <span className="font-semibold text-gray-900">{campaign.reach.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Clics</span>
                    <span className="font-semibold text-gray-900">{campaign.clicks.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Conversions</span>
                    <span className="font-semibold text-green-600">{campaign.conversions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Budget</span>
                    <span className="font-semibold text-orange-600">{campaign.budget.toLocaleString()}€</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Taux de clic</span>
                    <span className="font-semibold text-blue-600">{clickRate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Taux de conversion</span>
                    <span className="font-semibold text-green-600">{conversionRate}%</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    <Eye className="h-4 w-4" />
                    Voir
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    {campaign.status === 'Active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
