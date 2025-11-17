'use client';

import { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  MapPin,
  Users,
  Euro,
  TrendingUp,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  Globe
} from 'lucide-react';

const mockCompanies = [
  { id: 1, name: 'Restaurant Le Gourmet', industry: 'Restauration', city: 'Paris', employees: 15, revenue: '450K', contacts: 3, deals: 2, status: 'Client', website: 'legourmet.fr' },
  { id: 2, name: 'Boutique Mode Élégance', industry: 'Commerce', city: 'Lyon', employees: 8, revenue: '620K', contacts: 2, deals: 1, status: 'Prospect', website: 'elegance.com' },
  { id: 3, name: 'Cabinet Avocat Dupont', industry: 'Services Juridiques', city: 'Marseille', employees: 12, revenue: '380K', contacts: 4, deals: 3, status: 'Client', website: 'dupont-avocat.fr' },
  { id: 4, name: 'Salon Tendance', industry: 'Beauté', city: 'Toulouse', employees: 6, revenue: '180K', contacts: 2, deals: 1, status: 'Client', website: 'tendance.fr' },
  { id: 5, name: 'Garage Auto Pro', industry: 'Automobile', city: 'Nice', employees: 20, revenue: '850K', contacts: 3, deals: 2, status: 'Prospect', website: 'autopro.com' },
  { id: 6, name: 'Boulangerie Tradition', industry: 'Alimentaire', city: 'Nantes', employees: 5, revenue: '220K', contacts: 1, deals: 1, status: 'Client', website: 'tradition.fr' },
  { id: 7, name: 'Pharmacie Santé', industry: 'Santé', city: 'Strasbourg', employees: 8, revenue: '520K', contacts: 2, deals: 2, status: 'Client', website: 'pharma-sante.fr' },
  { id: 8, name: 'Fleuriste Jardin', industry: 'Commerce', city: 'Bordeaux', employees: 4, revenue: '120K', contacts: 1, deals: 0, status: 'Lead', website: 'jardin-fleurs.com' },
  { id: 9, name: 'Bistrot Gourmand', industry: 'Restauration', city: 'Lille', employees: 10, revenue: '340K', contacts: 2, deals: 1, status: 'Client', website: 'bistrot.fr' },
  { id: 10, name: 'Librairie Lecture', industry: 'Commerce', city: 'Rennes', employees: 7, revenue: '280K', contacts: 2, deals: 1, status: 'Prospect', website: 'lecture.com' },
  { id: 11, name: 'Épicerie Bio', industry: 'Alimentaire', city: 'Montpellier', employees: 6, revenue: '310K', contacts: 1, deals: 1, status: 'Client', website: 'bio-epicerie.fr' },
  { id: 12, name: 'Studio Yoga Zen', industry: 'Sport & Bien-être', city: 'Toulouse', employees: 5, revenue: '150K', contacts: 2, deals: 1, status: 'Client', website: 'yogazen.com' },
  { id: 13, name: 'Agence Immobilière', industry: 'Immobilier', city: 'Paris', employees: 18, revenue: '920K', contacts: 5, deals: 3, status: 'Client', website: 'immo-agence.fr' },
  { id: 14, name: 'Spa Beauté', industry: 'Beauté', city: 'Cannes', employees: 12, revenue: '480K', contacts: 3, deals: 2, status: 'Client', website: 'spa-beaute.com' },
  { id: 15, name: 'Traiteur Gourmet', industry: 'Restauration', city: 'Lyon', employees: 15, revenue: '560K', contacts: 2, deals: 2, status: 'Prospect', website: 'traiteur.fr' },
];

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredCompanies = mockCompanies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || company.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: 'Total Entreprises', value: mockCompanies.length, color: 'text-orange-600' },
    { label: 'Clients', value: mockCompanies.filter(c => c.status === 'Client').length, color: 'text-green-600' },
    { label: 'Prospects', value: mockCompanies.filter(c => c.status === 'Prospect').length, color: 'text-blue-600' },
    { label: 'Leads', value: mockCompanies.filter(c => c.status === 'Lead').length, color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Building2 className="h-8 w-8 text-orange-600" />
                Entreprises
              </h1>
              <p className="text-gray-600 mt-1">Gérez votre portefeuille d&apos;entreprises</p>
            </div>
            <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm">
              <Plus className="h-5 w-5" />
              Nouvelle Entreprise
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
                placeholder="Rechercher par nom ou secteur..."
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
              <option value="client">Clients</option>
              <option value="prospect">Prospects</option>
              <option value="lead">Leads</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5" />
              Filtres
            </button>
          </div>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <div key={company.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{company.name}</h3>
                    <p className="text-sm text-gray-500">{company.industry}</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{company.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{company.employees} employés</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Euro className="h-4 w-4" />
                    <span className="font-semibold text-gray-900">{company.revenue}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>{company.deals} deals</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="h-4 w-4" />
                  <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-orange-600 transition-colors">
                    {company.website}
                  </a>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  company.status === 'Client'
                    ? 'bg-green-100 text-green-700'
                    : company.status === 'Prospect'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {company.status}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{company.contacts} contacts</span>
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(3, company.contacts))].map((_, i) => (
                      <div key={i} className="h-8 w-8 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center">
                        <Users className="h-4 w-4 text-orange-600" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                  <Edit className="h-4 w-4" />
                  Modifier
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Trash2 className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
