'use client';

import { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  Edit,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar
} from 'lucide-react';

const mockQuotes = [
  { id: 'Q-2024-001', title: 'Site Web Restaurant', client: 'Restaurant Le Gourmet', amount: 4500, status: 'Envoyé', validUntil: '2024-12-01', createdDate: '2024-11-10', items: 5 },
  { id: 'Q-2024-002', title: 'E-commerce Mode', client: 'Boutique Mode Élégance', amount: 6200, status: 'Accepté', validUntil: '2024-11-30', createdDate: '2024-11-08', items: 8 },
  { id: 'Q-2024-003', title: 'Site Vitrine Avocat', client: 'Cabinet Avocat Dupont', amount: 2800, status: 'Brouillon', validUntil: '2024-12-05', createdDate: '2024-11-15', items: 4 },
  { id: 'Q-2024-004', title: 'SEO Local Coiffeur', client: 'Salon Tendance', amount: 1500, status: 'Envoyé', validUntil: '2024-11-28', createdDate: '2024-11-12', items: 3 },
  { id: 'Q-2024-005', title: 'Site + SEO Garage', client: 'Garage Auto Pro', amount: 5800, status: 'En Révision', validUntil: '2024-12-10', createdDate: '2024-11-14', items: 7 },
  { id: 'Q-2024-006', title: 'E-commerce Boulangerie', client: 'Boulangerie Tradition', amount: 3200, status: 'Accepté', validUntil: '2024-11-25', createdDate: '2024-11-05', items: 6 },
  { id: 'Q-2024-007', title: 'Site Web Pharmacie', client: 'Pharmacie Santé', amount: 3800, status: 'Envoyé', validUntil: '2024-12-02', createdDate: '2024-11-11', items: 5 },
  { id: 'Q-2024-008', title: 'Marketing Digital', client: 'Fleuriste Jardin', amount: 2200, status: 'Refusé', validUntil: '2024-11-20', createdDate: '2024-11-01', items: 4 },
  { id: 'Q-2024-009', title: 'Site Restaurant', client: 'Bistrot Gourmand', amount: 4100, status: 'Envoyé', validUntil: '2024-11-29', createdDate: '2024-11-13', items: 6 },
  { id: 'Q-2024-010', title: 'SEO + Ads Librairie', client: 'Librairie Lecture', amount: 2900, status: 'Brouillon', validUntil: '2024-12-08', createdDate: '2024-11-16', items: 4 },
  { id: 'Q-2024-011', title: 'E-commerce Bio', client: 'Épicerie Bio', amount: 4800, status: 'En Révision', validUntil: '2024-12-03', createdDate: '2024-11-09', items: 7 },
  { id: 'Q-2024-012', title: 'Site Web Yoga', client: 'Studio Yoga Zen', amount: 2500, status: 'Envoyé', validUntil: '2024-11-27', createdDate: '2024-11-12', items: 5 },
  { id: 'Q-2024-013', title: 'Portail Immobilier', client: 'Agence Immobilière', amount: 8900, status: 'Accepté', validUntil: '2024-11-26', createdDate: '2024-11-06', items: 10 },
  { id: 'Q-2024-014', title: 'Site + SEO Spa', client: 'Spa Beauté', amount: 3600, status: 'Envoyé', validUntil: '2024-12-04', createdDate: '2024-11-14', items: 6 },
  { id: 'Q-2024-015', title: 'E-commerce Traiteur', client: 'Traiteur Gourmet', amount: 5200, status: 'Brouillon', validUntil: '2024-12-07', createdDate: '2024-11-17', items: 8 },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Accepté': return CheckCircle2;
    case 'Envoyé': return Send;
    case 'En Révision': return Clock;
    case 'Refusé': return XCircle;
    default: return FileText;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Accepté': return 'bg-green-100 text-green-700';
    case 'Envoyé': return 'bg-blue-100 text-blue-700';
    case 'En Révision': return 'bg-yellow-100 text-yellow-700';
    case 'Refusé': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export default function QuotesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredQuotes = mockQuotes.filter(quote => {
    const matchesSearch = quote.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         quote.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         quote.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || quote.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalValue = mockQuotes.reduce((sum, quote) => sum + quote.amount, 0);
  const acceptedValue = mockQuotes.filter(q => q.status === 'Accepté').reduce((sum, q) => sum + q.amount, 0);
  const acceptanceRate = Math.round((mockQuotes.filter(q => q.status === 'Accepté').length / mockQuotes.length) * 100);

  const stats = [
    { label: 'Total Devis', value: mockQuotes.length, color: 'text-orange-600' },
    { label: 'Valeur Totale', value: `${totalValue.toLocaleString()}€`, color: 'text-blue-600' },
    { label: 'Acceptés', value: `${acceptedValue.toLocaleString()}€`, color: 'text-green-600' },
    { label: 'Taux Acceptation', value: `${acceptanceRate}%`, color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="h-8 w-8 text-orange-600" />
                Devis
              </h1>
              <p className="text-gray-600 mt-1">Gérez vos devis et propositions commerciales</p>
            </div>
            <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm">
              <Plus className="h-5 w-5" />
              Nouveau Devis
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
                placeholder="Rechercher par numéro, titre ou client..."
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
              <option value="brouillon">Brouillon</option>
              <option value="envoyé">Envoyé</option>
              <option value="en révision">En Révision</option>
              <option value="accepté">Accepté</option>
              <option value="refusé">Refusé</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5" />
              Filtres
            </button>
          </div>
        </div>

        {/* Quotes Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Numéro</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Devis</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Validité</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredQuotes.map((quote) => {
                  const StatusIcon = getStatusIcon(quote.status);
                  const statusColor = getStatusColor(quote.status);

                  return (
                    <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-semibold text-gray-900">{quote.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-gray-900">{quote.title}</p>
                          <p className="text-sm text-gray-500">{quote.items} articles</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{quote.client}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-orange-600">
                          {quote.amount.toLocaleString()}€
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${statusColor}`}>
                          <StatusIcon className="h-3 w-3" />
                          {quote.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(quote.validUntil).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Voir">
                            <Eye className="h-4 w-4 text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Modifier">
                            <Edit className="h-4 w-4 text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Dupliquer">
                            <Copy className="h-4 w-4 text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Télécharger">
                            <Download className="h-4 w-4 text-gray-600" />
                          </button>
                          {quote.status === 'Brouillon' && (
                            <button className="p-2 hover:bg-orange-100 rounded-lg transition-colors" title="Envoyer">
                              <Send className="h-4 w-4 text-orange-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Affichage de {filteredQuotes.length} sur {mockQuotes.length} devis
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              Précédent
            </button>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
              1
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              2
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
