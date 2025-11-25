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
  Filter,
  AlertCircle,
  PenTool
} from 'lucide-react';
import { useQuotes, useQuoteMutations } from '@/hooks/useQuotes';
import { useContacts } from '@/hooks/useContacts';
import Modal from '@/components/Modal';
import ServiceCalculator from '@/components/ServiceCalculator';

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
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [selectedContactForFill, setSelectedContactForFill] = useState<string>('');
  const [calculatorData, setCalculatorData] = useState<any>(null);

  // Utiliser le hook useQuotes pour récupérer les données depuis l'API
  const { quotes, stats, isLoading, isError, mutate } = useQuotes({
    search: searchQuery || undefined,
    status: selectedStatus !== 'all' ? selectedStatus.toUpperCase() : undefined,
  });

  // Hook de mutations
  const { createQuote, updateQuote, deleteQuote, loading: submitting, error: submitError } = useQuoteMutations();

  // Récupérer les contacts pour le dropdown
  const { contacts, isLoading: contactsLoading, isError: contactsError } = useContacts({});

  // Fonction pour remplir le formulaire avec les données du contact
  const handleContactSelect = (contactId: string) => {
    setSelectedContactForFill(contactId);
    setMissingFields([]);

    if (!contactId) {
      setFormData({
        clientName: '',
        clientEmail: '',
        clientAddress: '',
        subtotal: formData.subtotal,
        taxRate: formData.taxRate,
        validityDays: formData.validityDays,
        contactId: '',
      });
      return;
    }

    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    // Vérifier les champs manquants
    const missing: string[] = [];
    if (!contact.email) missing.push('Email');
    if (!contact.firstName || !contact.lastName) missing.push('Nom complet');

    setMissingFields(missing);

    // Remplir les champs disponibles
    const clientName = contact.companies?.name || `${contact.firstName} ${contact.lastName}`;
    const clientAddress = contact.city || '';

    setFormData({
      ...formData,
      clientName,
      clientEmail: contact.email || '',
      clientAddress,
      contactId: contact.id,
    });
  };

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
      // Si on a des données du calculateur, utiliser le grandTotal comme subtotal
      const subtotalValue = calculatorData
        ? calculatorData.totals.grandTotal
        : parseFloat(formData.subtotal);

      const quoteData: any = {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientAddress: formData.clientAddress || null,
        subtotal: subtotalValue,
        taxRate: parseFloat(formData.taxRate),
        validityDays: parseInt(formData.validityDays),
        contactId: formData.contactId || null,
      };

      // Ajouter les données du calculateur si disponibles
      if (calculatorData) {
        quoteData.commitmentPeriod = calculatorData.commitment === 'comptant'
          ? 'comptant'
          : calculatorData.commitment.toString();
        quoteData.isPartner = calculatorData.isPartner;
        quoteData.engagementDiscount = calculatorData.totals.engagementDiscount;
        quoteData.partnerDiscount = calculatorData.totals.partnerDiscount;
        quoteData.oneTimeTotal = calculatorData.totals.oneTimeTotal;
        quoteData.monthlyTotal = calculatorData.totals.monthlyTotal;

        // Transformer les services au format attendu par l'API
        quoteData.products = calculatorData.services.map((service: any) => ({
          name: service.name,
          description: '',
          quantity: 1,
          unitPrice: service.price,
          totalPrice: service.price,
          serviceId: service.id,
          serviceType: service.period || 'paiement unique',
          period: service.period || 'paiement unique',
          channel: service.channel,
          discount: service.discount || 0,
        }));
      }

      await updateQuote(selectedQuote.id, quoteData);
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

  const handleGenerateSignature = async (quote: any) => {
    if (!confirm(`Générer une demande de signature électronique pour ${quote.clientName} ?\n\nLe client recevra un email avec le contrat à signer.`)) return;

    try {
      const response = await fetch('/api/yousign/create-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: quote.id }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Demande de signature envoyée avec succès !\n\nLe client va recevoir un email pour signer électroniquement.');
        mutate();
      } else {
        console.error('Erreur Yousign:', data);
        alert(`❌ Erreur: ${data.error || 'Impossible de créer la signature'}\n\n${data.details ? JSON.stringify(data.details, null, 2) : ''}`);
      }
    } catch (err) {
      console.error('Erreur génération signature:', err);
      alert('❌ Erreur lors de la génération de la signature');
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
      // Si on a des données du calculateur, utiliser le grandTotal comme subtotal
      const subtotalValue = calculatorData
        ? calculatorData.totals.grandTotal
        : parseFloat(formData.subtotal);

      console.log('📝 Création devis - subtotalValue:', subtotalValue);
      console.log('📝 Création devis - calculatorData:', calculatorData);

      const quoteData: any = {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientAddress: formData.clientAddress || null,
        subtotal: subtotalValue,
        taxRate: parseFloat(formData.taxRate),
        validityDays: parseInt(formData.validityDays),
        contactId: formData.contactId || null,
      };

      // Ajouter les données du calculateur si disponibles
      if (calculatorData) {
        quoteData.commitmentPeriod = calculatorData.commitment === 'comptant'
          ? 'comptant'
          : calculatorData.commitment.toString();
        quoteData.isPartner = calculatorData.isPartner;
        quoteData.engagementDiscount = calculatorData.totals.engagementDiscount;
        quoteData.partnerDiscount = calculatorData.totals.partnerDiscount;
        quoteData.oneTimeTotal = calculatorData.totals.oneTimeTotal;
        quoteData.monthlyTotal = calculatorData.totals.monthlyTotal;

        // Transformer les services au format attendu par l'API
        quoteData.products = calculatorData.services.map((service: any) => ({
          name: service.name,
          description: '',
          quantity: 1,
          unitPrice: service.price,
          totalPrice: service.price,
          serviceId: service.id,
          serviceType: service.period || 'paiement unique',
          period: service.period || 'paiement unique',
          channel: service.channel,
          discount: service.discount || 0,
        }));
      }

      await createQuote(quoteData);
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
      setSelectedContactForFill('');
      setMissingFields([]);
      setCalculatorData(null);
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

  // Recalculer la vraie valeur totale depuis les quote_products
  const realTotalValue = filteredQuotes.reduce((sum, quote) => {
    const months = quote.commitmentPeriod && quote.commitmentPeriod !== 'comptant'
      ? parseInt(quote.commitmentPeriod)
      : 0;

    let oneTimeTotal = 0;
    const maintenanceBase = 129; // Base obligatoire

    quote.quote_products?.forEach((p: any) => {
      if (!p.period || p.period === 'paiement unique') {
        oneTimeTotal += p.totalPrice;
      }
    });

    // En mode engagement : SEULEMENT one-time + base maintenance (129€)
    const calculatedSubtotal = months > 0
      ? oneTimeTotal + (maintenanceBase * months)
      : oneTimeTotal;

    const calculatedTax = (calculatedSubtotal * quote.taxRate) / 100;
    const calculatedTotal = calculatedSubtotal + calculatedTax;
    return sum + calculatedTotal;
  }, 0);

  const acceptanceRate = stats.total > 0
    ? Math.round((stats.accepte / stats.total) * 100)
    : 0;

  const statsDisplay = [
    { label: 'Total Devis', value: filteredQuotes.length, color: 'text-orange-600' },
    { label: 'Valeur Totale', value: `${Math.round(realTotalValue).toLocaleString('fr-FR')}€`, color: 'text-blue-600' },
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
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-semibold shadow-lg shadow-orange-500/30"
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
                          <p className="text-sm text-gray-500">{quote.quote_products?.length || 0} articles</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{quote.clientName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-orange-600">
                          {(() => {
                            const months = quote.commitmentPeriod && quote.commitmentPeriod !== 'comptant'
                              ? parseInt(quote.commitmentPeriod)
                              : 0;

                            let oneTimeTotal = 0;
                            const maintenanceBase = 129; // Base obligatoire

                            quote.quote_products?.forEach((p: any) => {
                              if (!p.period || p.period === 'paiement unique') {
                                oneTimeTotal += p.totalPrice;
                              }
                            });

                            // En mode engagement : SEULEMENT one-time + base maintenance (129€)
                            const calculatedSubtotal = months > 0
                              ? oneTimeTotal + (maintenanceBase * months)
                              : oneTimeTotal;

                            const calculatedTax = (calculatedSubtotal * quote.taxRate) / 100;
                            const calculatedTotal = calculatedSubtotal + calculatedTax;
                            return Math.round(calculatedTotal).toLocaleString('fr-FR');
                          })()}€
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${statusColor}`}>
                            <StatusIcon className="h-3 w-3" />
                            {getStatusLabel(quote.status)}
                          </span>
                          {quote.yousignId && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium flex items-center gap-1 w-fit">
                              <PenTool className="h-3 w-3" />
                              Signature électronique
                            </span>
                          )}
                        </div>
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
                          <button
                            onClick={() => handleGenerateSignature(quote)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Générer signature électronique"
                          >
                            <PenTool className="h-4 w-4 text-blue-600" />
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
          onClose={() => {
            setIsModalOpen(false);
            setSelectedContactForFill('');
            setMissingFields([]);
          }}
          title="Nouveau Devis"
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {submitError}
              </div>
            )}

            {missingFields.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                      Informations manquantes dans la fiche contact
                    </h3>
                    <p className="text-sm text-yellow-700 mb-2">
                      Les champs suivants sont manquants : <strong>{missingFields.join(', ')}</strong>
                    </p>
                    <a
                      href="/dashboard/crm"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-yellow-800 hover:text-yellow-900 underline"
                    >
                      Modifier la fiche contact →
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Sélection du contact */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sélectionner un contact existant
              </label>
              <select
                value={selectedContactForFill}
                onChange={(e) => handleContactSelect(e.target.value)}
                disabled={contactsLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-orange-50 border-orange-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {contactsLoading ? 'Chargement des contacts...' : '-- Saisir manuellement --'}
                </option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName} {contact.companies?.name ? `(${contact.companies.name})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {contactsError ? (
                  <span className="text-red-600">⚠️ Erreur lors du chargement des contacts</span>
                ) : contactsLoading ? (
                  'Chargement...'
                ) : contacts.length === 0 ? (
                  <span className="text-yellow-600">Aucun contact disponible. Créez d&apos;abord un contact dans le CRM.</span>
                ) : (
                  `Sélectionnez un contact pour pré-remplir automatiquement les coordonnées (${contacts.length} contact(s) disponible(s))`
                )}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4"></div>

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

            <div className="border-t border-gray-200 pt-4"></div>

            {/* Service Calculator */}
            <ServiceCalculator
              onCalculate={(data) => {
                setCalculatorData(data);
                // Mettre à jour le subtotal avec le total mensuel
                setFormData(prev => ({
                  ...prev,
                  subtotal: data.totals.monthlyTotal.toString(),
                }));
              }}
            />

            <div className="border-t border-gray-200 pt-4"></div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            {/* Service Calculator */}
            <ServiceCalculator
              onCalculate={(data) => {
                setCalculatorData(data);
              }}
              initialServices={selectedQuote?.quote_products?.map((p: any) => p.serviceId).filter(Boolean)}
              initialCommitment={selectedQuote?.commitmentPeriod === 'comptant' ? 'comptant' : parseInt(selectedQuote?.commitmentPeriod || '0') as 24 | 36 | 48}
              initialIsPartner={selectedQuote?.isPartner || false}
            />

            <div className="border-t border-gray-200 pt-4"></div>

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
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Détails du Paiement</h3>
                <div className="space-y-2">
                  {(() => {
                    const months = selectedQuote.commitmentPeriod && selectedQuote.commitmentPeriod !== 'comptant'
                      ? parseInt(selectedQuote.commitmentPeriod)
                      : 0;

                    return (
                      <>

                        {/* Afficher les détails mensuels si engagement */}
                        {months > 0 && selectedQuote.quote_products && (
                          <>
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                              {(() => {
                                // Recalculer depuis les products en séparant les différents types
                                let oneTimeTotal = 0;
                                let maintenanceBase = 129; // TOUJOURS 129€ obligatoire
                                let maintenanceUpgrade = 0;
                                let otherMonthlyTotal = 0;
                                const maintenanceServices = ['maintenance-hosting', 'maintenance-accompagnement', 'maintenance-totale'];

                                selectedQuote.quote_products.forEach((p: any) => {
                                  if (!p.period || p.period === 'paiement unique') {
                                    oneTimeTotal += p.totalPrice;
                                  } else {
                                    if (maintenanceServices.includes(p.serviceId)) {
                                      if (p.serviceId === 'maintenance-hosting') {
                                        maintenanceBase = p.totalPrice;
                                      } else {
                                        maintenanceBase = 129;
                                        maintenanceUpgrade = p.totalPrice - 129;
                                      }
                                    } else {
                                      otherMonthlyTotal += p.totalPrice;
                                    }
                                  }
                                });

                                const totalMaintenance = maintenanceBase + maintenanceUpgrade;
                                const monthlyTotal = totalMaintenance + otherMonthlyTotal;
                                const siteMonthly = Math.round(oneTimeTotal / months);
                                const totalMonthly = siteMonthly + Math.round(monthlyTotal);
                                const coutEngage = oneTimeTotal + (maintenanceBase * months);

                                const totalEngage = siteMonthly + maintenanceBase;

                                // Obtenir les détails des produits pour affichage
                                const oneTimeProducts = selectedQuote.quote_products.filter((p: any) => !p.period || p.period === 'paiement unique');
                                const maintenanceProduct = selectedQuote.quote_products.find((p: any) =>
                                  p.serviceId === 'maintenance-accompagnement' || p.serviceId === 'maintenance-totale'
                                );
                                const maintenanceFormula = maintenanceProduct?.serviceId === 'maintenance-accompagnement'
                                  ? 'Accompagnement'
                                  : maintenanceProduct?.serviceId === 'maintenance-totale'
                                  ? 'Totale'
                                  : null;

                                // Calcul TVA et TTC
                                const taxRate = selectedQuote.taxRate || 20;
                                const totalHT = oneTimeTotal + (maintenanceBase * months) + ((maintenanceUpgrade + otherMonthlyTotal) * months);
                                const _totalTVA = (totalHT * taxRate) / 100;

                                const engageHT = coutEngage;
                                const engageTVA = (engageHT * taxRate) / 100;
                                const engageTTC = engageHT + engageTVA;

                                return (
                                  <>
                                    {/* Engagement sur X mois */}
                                    <div className="mb-4 pb-4 border-b-2 border-blue-200">
                                      <p className="text-xs text-blue-600 uppercase font-semibold mb-3 text-center">💎 Engagement {months} mois</p>

                                      {/* Services de création étalés */}
                                      <div className="mb-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-xs font-semibold text-gray-600">Services de création étalés</span>
                                          <span className="text-xs text-gray-500">({Math.round(oneTimeTotal).toLocaleString('fr-FR')}€ total)</span>
                                        </div>
                                        {oneTimeProducts.length > 0 && (
                                          <div className="bg-orange-50 rounded p-2 mb-2">
                                            {oneTimeProducts.map((p: any, idx: number) => (
                                              <div key={idx} className="text-xs text-gray-700 flex justify-between">
                                                <span>• {p.name}</span>
                                                <span className="font-medium">{Math.round(p.totalPrice).toLocaleString('fr-FR')}€</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        <p className="text-2xl font-bold text-orange-600 text-center">
                                          {siteMonthly}€<span className="text-sm font-normal">/mois</span>
                                        </p>
                                      </div>

                                      {/* Hébergement obligatoire */}
                                      <div className="mb-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-xs font-semibold text-gray-600">Hébergement & Maintenance</span>
                                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Obligatoire</span>
                                        </div>
                                        <div className="bg-red-50 rounded p-2 mb-2">
                                          <p className="text-xs text-gray-700">• Hébergement web sécurisé</p>
                                          <p className="text-xs text-gray-700">• Mises à jour & maintenance</p>
                                          <p className="text-xs text-gray-700">• Support technique</p>
                                        </div>
                                        <p className="text-2xl font-bold text-orange-600 text-center">
                                          {maintenanceBase}€<span className="text-sm font-normal">/mois</span>
                                        </p>
                                      </div>

                                      {/* Total engagé mis en avant */}
                                      <div className="bg-gradient-to-r from-orange-100 to-orange-50 -mx-4 px-4 py-3 rounded-lg">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                          <span className="text-xl font-bold text-gray-900">=</span>
                                          <p className="text-3xl font-bold text-orange-600">{totalEngage}€<span className="text-base font-normal">/mois</span></p>
                                        </div>
                                        <p className="text-xs text-center text-gray-600 font-semibold">pendant {months} mois (engagé)</p>
                                      </div>
                                    </div>

                                    {/* Services optionnels NON engagés */}
                                    {(maintenanceUpgrade > 0 || otherMonthlyTotal > 0) && (
                                      <div className="mb-4 pb-4 border-b border-gray-200">
                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-3">➕ Options modifiables (sans engagement)</p>

                                        {maintenanceUpgrade > 0 && maintenanceFormula && (
                                          <div className="bg-blue-50 rounded-lg p-3 mb-2">
                                            <div className="flex justify-between items-center mb-1">
                                              <span className="text-sm font-semibold text-blue-900">Formule {maintenanceFormula}</span>
                                              <span className="text-lg font-bold text-blue-700">{maintenanceUpgrade}€/mois</span>
                                            </div>
                                            <p className="text-xs text-blue-700">Comprend la base (129€) + services premium</p>
                                            <p className="text-xs text-gray-500 mt-1 italic">Modifiable ou résiliable à tout moment</p>
                                          </div>
                                        )}

                                        {otherMonthlyTotal > 0 && (
                                          <div className="bg-green-50 rounded-lg p-3">
                                            <div className="flex justify-between items-center mb-1">
                                              <span className="text-sm font-semibold text-green-900">Services complémentaires</span>
                                              <span className="text-lg font-bold text-green-700">{Math.round(otherMonthlyTotal)}€/mois</span>
                                            </div>
                                            <p className="text-xs text-gray-500 italic">Sans engagement, résiliables à tout moment</p>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Récapitulatif des totaux */}
                                    <div className="space-y-3">
                                      {/* Total mensuel si options */}
                                      {(maintenanceUpgrade > 0 || otherMonthlyTotal > 0) && (
                                        <div className="flex justify-between items-center text-sm bg-gray-50 px-3 py-2 rounded">
                                          <span className="text-gray-700 font-medium">Total mensuel (avec options)</span>
                                          <span className="font-bold text-gray-900 text-lg">{totalMonthly}€/mois</span>
                                        </div>
                                      )}

                                      {/* Coût total engagé HT */}
                                      <div className="bg-orange-50 rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-1">
                                          <div>
                                            <p className="text-sm font-bold text-orange-900">Coût total ENGAGÉ (HT)</p>
                                            <p className="text-xs text-gray-600">
                                              {Math.round(oneTimeTotal).toLocaleString('fr-FR')}€ + ({maintenanceBase}€ × {months} mois)
                                            </p>
                                          </div>
                                          <p className="text-2xl font-bold text-orange-600">{Math.round(engageHT).toLocaleString('fr-FR')}€</p>
                                        </div>
                                        <div className="flex justify-between text-xs mt-2 pt-2 border-t border-orange-200">
                                          <span className="text-gray-600">TVA ({taxRate}%)</span>
                                          <span className="font-semibold text-gray-700">+{Math.round(engageTVA).toLocaleString('fr-FR')}€</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1 pt-2 border-t border-orange-300">
                                          <span className="text-sm font-bold text-orange-900">Total TTC engagé</span>
                                          <span className="text-xl font-bold text-orange-600">{Math.round(engageTTC).toLocaleString('fr-FR')}€</span>
                                        </div>
                                      </div>

                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {selectedQuote.quote_products && selectedQuote.quote_products.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Services & Produits ({selectedQuote.quote_products.length})</h3>
                  <div className="space-y-2">
                    {selectedQuote.quote_products.map((product: any) => (
                      <div key={product.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-gray-600 mt-1">{product.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-gray-500">Quantité: {product.quantity}</p>
                            <p className="text-xs text-gray-500">Prix unitaire: {product.unitPrice.toLocaleString()}€</p>
                            {product.period && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                {product.period}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-orange-600 ml-4">{product.totalPrice.toLocaleString()}€</span>
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
