'use client';

import { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Euro
} from 'lucide-react';

const mockInvoices = [
  { id: 'INV-2024-001', client: 'Restaurant Le Gourmet', amount: 4500, status: 'Payée', dueDate: '2024-11-15', paidDate: '2024-11-10', issueDate: '2024-10-15' },
  { id: 'INV-2024-002', client: 'Boutique Mode Élégance', amount: 6200, status: 'Payée', dueDate: '2024-11-20', paidDate: '2024-11-18', issueDate: '2024-10-20' },
  { id: 'INV-2024-003', client: 'Cabinet Avocat Dupont', amount: 2800, status: 'En Attente', dueDate: '2024-11-25', paidDate: null, issueDate: '2024-11-10' },
  { id: 'INV-2024-004', client: 'Salon Tendance', amount: 1500, status: 'Payée', dueDate: '2024-11-18', paidDate: '2024-11-16', issueDate: '2024-10-18' },
  { id: 'INV-2024-005', client: 'Garage Auto Pro', amount: 5800, status: 'En Attente', dueDate: '2024-11-30', paidDate: null, issueDate: '2024-11-15' },
  { id: 'INV-2024-006', client: 'Boulangerie Tradition', amount: 3200, status: 'Payée', dueDate: '2024-11-10', paidDate: '2024-11-08', issueDate: '2024-10-10' },
  { id: 'INV-2024-007', client: 'Pharmacie Santé', amount: 3800, status: 'En Attente', dueDate: '2024-11-28', paidDate: null, issueDate: '2024-11-13' },
  { id: 'INV-2024-008', client: 'Fleuriste Jardin', amount: 2200, status: 'En Retard', dueDate: '2024-11-05', paidDate: null, issueDate: '2024-10-05' },
  { id: 'INV-2024-009', client: 'Bistrot Gourmand', amount: 4100, status: 'Payée', dueDate: '2024-11-22', paidDate: '2024-11-20', issueDate: '2024-10-22' },
  { id: 'INV-2024-010', client: 'Librairie Lecture', amount: 2900, status: 'En Attente', dueDate: '2024-12-01', paidDate: null, issueDate: '2024-11-16' },
  { id: 'INV-2024-011', client: 'Épicerie Bio', amount: 4800, status: 'Payée', dueDate: '2024-11-12', paidDate: '2024-11-10', issueDate: '2024-10-12' },
  { id: 'INV-2024-012', client: 'Studio Yoga Zen', amount: 2500, status: 'En Attente', dueDate: '2024-11-27', paidDate: null, issueDate: '2024-11-12' },
  { id: 'INV-2024-013', client: 'Agence Immobilière', amount: 8900, status: 'Payée', dueDate: '2024-11-08', paidDate: '2024-11-05', issueDate: '2024-10-08' },
  { id: 'INV-2024-014', client: 'Spa Beauté', amount: 3600, status: 'En Attente', dueDate: '2024-11-29', paidDate: null, issueDate: '2024-11-14' },
  { id: 'INV-2024-015', client: 'Traiteur Gourmet', amount: 5200, status: 'En Retard', dueDate: '2024-11-12', paidDate: null, issueDate: '2024-10-12' },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Payée': return CheckCircle2;
    case 'En Attente': return Clock;
    case 'En Retard': return AlertCircle;
    default: return Receipt;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Payée': return 'bg-green-100 text-green-700';
    case 'En Attente': return 'bg-blue-100 text-blue-700';
    case 'En Retard': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredInvoices = mockInvoices.filter(invoice => {
    const matchesSearch = invoice.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || invoice.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalAmount = mockInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = mockInvoices.filter(inv => inv.status === 'Payée').reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = mockInvoices.filter(inv => inv.status === 'En Attente').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = mockInvoices.filter(inv => inv.status === 'En Retard').reduce((sum, inv) => sum + inv.amount, 0);

  const stats = [
    { label: 'Total Factures', value: `${totalAmount.toLocaleString()}€`, color: 'text-orange-600', icon: Euro },
    { label: 'Payées', value: `${paidAmount.toLocaleString()}€`, color: 'text-green-600', icon: CheckCircle2 },
    { label: 'En Attente', value: `${pendingAmount.toLocaleString()}€`, color: 'text-blue-600', icon: Clock },
    { label: 'En Retard', value: `${overdueAmount.toLocaleString()}€`, color: 'text-red-600', icon: AlertCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Receipt className="h-8 w-8 text-orange-600" />
                Factures
              </h1>
              <p className="text-gray-600 mt-1">Gérez vos factures et paiements</p>
            </div>
            <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm">
              <Plus className="h-5 w-5" />
              Nouvelle Facture
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
                placeholder="Rechercher par numéro ou client..."
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
              <option value="payée">Payées</option>
              <option value="en attente">En Attente</option>
              <option value="en retard">En Retard</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5" />
              Filtres
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Numéro</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Émission</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Échéance</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => {
                  const StatusIcon = getStatusIcon(invoice.status);
                  const statusColor = getStatusColor(invoice.status);

                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-semibold text-gray-900">{invoice.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900">{invoice.client}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-orange-600">
                          {invoice.amount.toLocaleString()}€
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(invoice.issueDate).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${statusColor}`}>
                          <StatusIcon className="h-3 w-3" />
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Voir">
                            <Eye className="h-4 w-4 text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Télécharger">
                            <Download className="h-4 w-4 text-gray-600" />
                          </button>
                          {invoice.status !== 'Payée' && (
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
            Affichage de {filteredInvoices.length} sur {mockInvoices.length} factures
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
