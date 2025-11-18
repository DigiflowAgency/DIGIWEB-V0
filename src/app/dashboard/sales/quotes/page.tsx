'use client';

import { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Download,
  Send,
  Eye,
  Edit,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Loader2,
  Filter
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [advancedFilters, setAdvancedFilters] = useState({
    status: 'all',
    amountMin: '',
    amountMax: '',
    createdFrom: '',
    createdTo: '',
    expiresFrom: '',
    expiresTo: '',
  });
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
  const { createQuote, updateQuote, deleteQuote, loading: submitting, error: submitError } = useQuoteMutations();

  // Récupérer les contacts pour le dropdown
  const { contacts } = useContacts({});

  // Filtres avancés
  const filteredQuotes = quotes.filter(quote => {
    if (advancedFilters.status !== 'all' && quote.status !== advancedFilters.status.toUpperCase()) return false;
    if (advancedFilters.amountMin && quote.total < parseFloat(advancedFilters.amountMin)) return false;
    if (advancedFilters.amountMax && quote.total > parseFloat(advancedFilters.amountMax)) return false;
    if (advancedFilters.createdFrom && new Date(quote.createdAt) < new Date(advancedFilters.createdFrom)) return false;
    if (advancedFilters.createdTo && new Date(quote.createdAt) > new Date(advancedFilters.createdTo)) return false;
    if (advancedFilters.expiresFrom && new Date(quote.expiresAt) < new Date(advancedFilters.expiresFrom)) return false;
    if (advancedFilters.expiresTo && new Date(quote.expiresAt) > new Date(advancedFilters.expiresTo)) return false;
    return true;
  });

  const handleApplyFilters = () => {
    setIsFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    setAdvancedFilters({
      status: 'all',
      amountMin: '',
      amountMax: '',
      createdFrom: '',
      createdTo: '',
      expiresFrom: '',
      expiresTo: '',
    });
  };

  // Handlers pour les actions
  const handleView = (quote: any) => {
    setSelectedQuote(quote);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (quote: any) => {
    setSelectedQuote(quote);
    setFormData({
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      clientAddress: quote.clientAddress || '',
      subtotal: quote.subtotal.toString(),
      taxRate: quote.taxRate.toString(),
      validityDays: quote.validityDays.toString(),
      contactId: quote.contactId || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote) return;

    try {
      await updateQuote(selectedQuote.id, {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientAddress: formData.clientAddress || null,
        subtotal: parseFloat(formData.subtotal),
        taxRate: parseFloat(formData.taxRate),
        validityDays: parseInt(formData.validityDays),
        contactId: formData.contactId || null,
      });
      setIsEditModalOpen(false);
      setSelectedQuote(null);
      mutate();
    } catch (err) {
      console.error('Erreur modification devis:', err);
    }
  };

  const handleDuplicate = async (quote: any) => {
    try {
      await createQuote({
        clientName: quote.clientName,
        clientEmail: quote.clientEmail,
        clientAddress: quote.clientAddress,
        subtotal: quote.subtotal,
        taxRate: quote.taxRate,
        validityDays: quote.validityDays,
        contactId: quote.contactId,
      });
      mutate();
    } catch (err) {
      console.error('Erreur duplication devis:', err);
    }
  };

  const handleDownload = async (quote: any) => {
    try {
      const response = await fetch(`/api/quotes/${quote.id}/pdf`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `devis-${quote.number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Erreur lors du téléchargement du PDF');
      }
    } catch (err) {
      console.error('Erreur téléchargement PDF:', err);
      alert('Erreur lors du téléchargement du PDF');
    }
  };

  const handleSend = async (quote: any) => {
    if (!confirm(`Envoyer le devis ${quote.number} à ${quote.clientEmail} ?`)) return;

    try {
      const response = await fetch(`/api/quotes/${quote.id}/send`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Devis envoyé avec succès !');
        mutate();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de l\'envoi');
      }
    } catch (err) {
      console.error('Erreur envoi devis:', err);
      alert('Erreur lors de l\'envoi du devis');
    }
  };

  // Handler non utilisé actuellement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _handleDelete = async (quote: any) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le devis ${quote.number} ?`)) return;

    try {
      await deleteQuote(quote.id);
      mutate();
    } catch (err) {
      console.error('Erreur suppression devis:', err);
    }
  };
  void _handleDelete; // Éviter warning

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
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-5 w-5" />
              Filtres Avancés
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
                          <button
                            onClick={() => handleView(quote)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleEdit(quote)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(quote)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Dupliquer"
                          >
                            <Copy className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDownload(quote)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4 text-gray-600" />
                          </button>
                          {quote.status === 'BROUILLON' && (
                            <button
                              onClick={() => handleSend(quote)}
                              className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                              title="Envoyer"
                            >
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

        {/* Modal Modifier Devis */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedQuote(null);
          }}
          title="Modifier le Devis"
          size="lg"
        >
          <form onSubmit={handleEditSubmit} className="space-y-6">
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
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedQuote(null);
                }}
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
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Détails Devis */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedQuote(null);
          }}
          title={`Détails du Devis ${selectedQuote?.number || ''}`}
          size="lg"
        >
          {selectedQuote && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Informations Client</h3>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Nom:</span> {selectedQuote.clientName}</p>
                    <p className="text-sm"><span className="font-medium">Email:</span> {selectedQuote.clientEmail}</p>
                    {selectedQuote.clientAddress && (
                      <p className="text-sm"><span className="font-medium">Adresse:</span> {selectedQuote.clientAddress}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Informations Devis</h3>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Numéro:</span> {selectedQuote.number}</p>
                    <p className="text-sm">
                      <span className="font-medium">Statut:</span>{' '}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedQuote.status)}`}>
                        {getStatusLabel(selectedQuote.status)}
                      </span>
                    </p>
                    <p className="text-sm"><span className="font-medium">Date de création:</span> {new Date(selectedQuote.createdAt).toLocaleDateString('fr-FR')}</p>
                    <p className="text-sm"><span className="font-medium">Expire le:</span> {new Date(selectedQuote.expiresAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Détails Financiers</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Montant HT:</span>
                    <span className="text-sm font-semibold">{selectedQuote.subtotal.toLocaleString()}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">TVA ({selectedQuote.taxRate}%):</span>
                    <span className="text-sm font-semibold">{selectedQuote.taxAmount.toLocaleString()}€</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-lg font-bold text-gray-900">Total TTC:</span>
                    <span className="text-lg font-bold text-orange-600">{selectedQuote.total.toLocaleString()}€</span>
                  </div>
                </div>
              </div>

              {selectedQuote.products && selectedQuote.products.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Articles ({selectedQuote.products.length})</h3>
                  <div className="space-y-2">
                    {selectedQuote.products.map((product: any) => (
                      <div key={product.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-gray-600 mt-1">{product.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">Quantité: {product.quantity} × {product.unitPrice.toLocaleString()}€</p>
                        </div>
                        <span className="text-sm font-semibold text-orange-600">{product.total.toLocaleString()}€</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedQuote(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleEdit(selectedQuote);
                  }}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal Filtres Avancés */}
        <Modal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          title="Filtres Avancés"
          size="md"
        >
          <div className="space-y-4">
            {/* Statut */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={advancedFilters.status}
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="brouillon">Brouillon</option>
                <option value="envoye">Envoyé</option>
                <option value="accepte">Accepté</option>
                <option value="refuse">Refusé</option>
                <option value="expire">Expiré</option>
              </select>
            </div>

            {/* Montant */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Montant (€)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={advancedFilters.amountMin}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, amountMin: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Min"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={advancedFilters.amountMax}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, amountMax: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Date de création */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date de création
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={advancedFilters.createdFrom}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, createdFrom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Du"
                />
                <input
                  type="date"
                  value={advancedFilters.createdTo}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, createdTo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Au"
                />
              </div>
            </div>

            {/* Date d'expiration */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date d&apos;expiration
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={advancedFilters.expiresFrom}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, expiresFrom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Du"
                />
                <input
                  type="date"
                  value={advancedFilters.expiresTo}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, expiresTo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Au"
                />
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleResetFilters}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Réinitialiser
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
              >
                Appliquer
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
