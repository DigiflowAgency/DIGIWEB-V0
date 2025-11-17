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
  Calendar,
  Loader2
} from 'lucide-react';
import { useQuotes, useQuoteMutations } from '@/hooks/useQuotes';
import { useContacts } from '@/hooks/useContacts';
import Modal from '@/components/Modal';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ACCEPTE': return CheckCircle2;
    case 'ENVOYE': return Send;
    case 'REFUSE': return XCircle;
    case 'EXPIRE': return Clock;
    default: return FileText;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACCEPTE': return 'bg-green-100 text-green-700';
    case 'ENVOYE': return 'bg-blue-100 text-blue-700';
    case 'REFUSE': return 'bg-red-100 text-red-700';
    case 'EXPIRE': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'BROUILLON': return 'Brouillon';
    case 'ENVOYE': return 'Envoyé';
    case 'ACCEPTE': return 'Accepté';
    case 'REFUSE': return 'Refusé';
    case 'EXPIRE': return 'Expiré';
    default: return status;
  }
};

export default function QuotesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    subtotal: '',
    taxRate: '20',
    validityDays: '30',
    contactId: '',
  });

  // Utiliser le hook useQuotes pour récupérer les données depuis l'API
  const { quotes, stats, isLoading, isError, mutate } = useQuotes({
    search: searchQuery || undefined,
    status: selectedStatus !== 'all' ? selectedStatus.toUpperCase() : undefined,
  });

  // Hook de mutations
  const { createQuote, loading: submitting, error: submitError } = useQuoteMutations();

  // Récupérer les contacts pour le dropdown
  const { contacts } = useContacts({});

  // Gestion du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createQuote({
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientAddress: formData.clientAddress || null,
        subtotal: parseFloat(formData.subtotal),
        taxRate: parseFloat(formData.taxRate),
        validityDays: parseInt(formData.validityDays),
        contactId: formData.contactId || null,
      });
      setIsModalOpen(false);
      setFormData({
        clientName: '',
        clientEmail: '',
        clientAddress: '',
        subtotal: '',
        taxRate: '20',
        validityDays: '30',
        contactId: '',
      });
      mutate();
    } catch (err) {
      console.error('Erreur création devis:', err);
    }
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement des devis...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement des devis</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const acceptanceRate = stats.total > 0
    ? Math.round((stats.accepte / stats.total) * 100)
    : 0;

  const statsDisplay = [
    { label: 'Total Devis', value: stats.total, color: 'text-orange-600' },
    { label: 'Valeur Totale', value: `${stats.totalValue.toLocaleString()}€`, color: 'text-blue-600' },
    { label: 'Acceptés', value: stats.accepte, color: 'text-green-600' },
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
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Nouveau Devis
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {statsDisplay.map((stat, index) => (
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
              <option value="envoye">Envoyé</option>
              <option value="accepte">Accepté</option>
              <option value="refuse">Refusé</option>
              <option value="expire">Expiré</option>
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
                {quotes.map((quote) => {
                  const StatusIcon = getStatusIcon(quote.status);
                  const statusColor = getStatusColor(quote.status);

                  return (
                    <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-semibold text-gray-900">{quote.number}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-gray-900">Devis {quote.number}</p>
                          <p className="text-sm text-gray-500">{quote.products?.length || 0} articles</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{quote.clientName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-orange-600">
                          {quote.total.toLocaleString()}€
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${statusColor}`}>
                          <StatusIcon className="h-3 w-3" />
                          {getStatusLabel(quote.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(quote.expiresAt).toLocaleDateString('fr-FR')}
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
                          {quote.status === 'BROUILLON' && (
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
            Affichage de {quotes.length} devis
          </p>
        </div>

        {/* Modal Nouveau Devis */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Nouveau Devis"
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du client <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Entreprise ABC"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email client <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="contact@client.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse du client
              </label>
              <input
                type="text"
                value={formData.clientAddress}
                onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="123 Rue Example, 75001 Paris"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Montant HT (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.subtotal}
                  onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="1000.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Taux TVA (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Validité (jours)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.validityDays}
                  onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact associé
                </label>
                <select
                  value={formData.contactId}
                  onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Aucun contact</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer le devis'
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
