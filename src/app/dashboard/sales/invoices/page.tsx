'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Euro,
  Loader2,
  Filter
} from 'lucide-react';
import { useInvoices, useInvoiceMutations } from '@/hooks/useInvoices';
import { useContacts } from '@/hooks/useContacts';
import Modal from '@/components/Modal';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PAYEE': return CheckCircle2;
    case 'EN_ATTENTE':
    case 'ENVOYEE': return Clock;
    case 'EN_RETARD': return AlertCircle;
    default: return Receipt;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PAYEE': return 'bg-green-100 text-green-700';
    case 'EN_ATTENTE':
    case 'ENVOYEE': return 'bg-blue-100 text-blue-700';
    case 'EN_RETARD': return 'bg-red-100 text-red-700';
    case 'ANNULEE': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'BROUILLON': return 'Brouillon';
    case 'EN_ATTENTE': return 'En Attente';
    case 'ENVOYEE': return 'Envoyée';
    case 'PAYEE': return 'Payée';
    case 'EN_RETARD': return 'En Retard';
    case 'ANNULEE': return 'Annulée';
    default: return status;
  }
};

export default function InvoicesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const userId = session?.user?.id;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [advancedFilters, setAdvancedFilters] = useState({
    status: 'all',
    amountMin: '',
    amountMax: '',
    issuedFrom: '',
    issuedTo: '',
    dueFrom: '',
    dueTo: '',
  });
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    subtotal: '',
    taxRate: '20',
    dueDate: '',
    contactId: '',
  });

  // Paramètres de filtrage : les non-admins ne voient que leurs propres factures
  const invoicesParams = useMemo(() => {
    const params: { search?: string; status?: string; ownerId?: string } = {};
    if (searchQuery) params.search = searchQuery;
    if (selectedStatus !== 'all') params.status = selectedStatus.toUpperCase();
    if (!isAdmin && userId) params.ownerId = userId;
    return params;
  }, [searchQuery, selectedStatus, isAdmin, userId]);

  // Utiliser le hook useInvoices pour récupérer les données depuis l'API
  const { invoices, stats, isLoading, isError, mutate } = useInvoices(invoicesParams);

  const { createInvoice, loading: submitting, error: submitError } = useInvoiceMutations();
  const { contacts } = useContacts({});

  // Filtres avancés
  const filteredInvoices = invoices.filter(invoice => {
    if (advancedFilters.status !== 'all' && invoice.status !== advancedFilters.status.toUpperCase()) return false;
    if (advancedFilters.amountMin && invoice.total < parseFloat(advancedFilters.amountMin)) return false;
    if (advancedFilters.amountMax && invoice.total > parseFloat(advancedFilters.amountMax)) return false;
    if (advancedFilters.issuedFrom && new Date(invoice.issuedAt) < new Date(advancedFilters.issuedFrom)) return false;
    if (advancedFilters.issuedTo && new Date(invoice.issuedAt) > new Date(advancedFilters.issuedTo)) return false;
    if (advancedFilters.dueFrom && new Date(invoice.dueAt) < new Date(advancedFilters.dueFrom)) return false;
    if (advancedFilters.dueTo && new Date(invoice.dueAt) > new Date(advancedFilters.dueTo)) return false;
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
      issuedFrom: '',
      issuedTo: '',
      dueFrom: '',
      dueTo: '',
    });
  };

  // Handlers pour les actions
  const handleView = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
  };

  const handleDownload = async (invoice: any) => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture-${invoice.number}.pdf`;
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

  const handleSend = async (invoice: any) => {
    if (!confirm(`Envoyer la facture ${invoice.number} à ${invoice.clientEmail} ?`)) return;

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Facture envoyée avec succès !');
        mutate();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de l\'envoi');
      }
    } catch (err) {
      console.error('Erreur envoi facture:', err);
      alert('Erreur lors de l\'envoi de la facture');
    }
  };

  const handleMarkAsPaid = async (invoice: any) => {
    if (!confirm(`Marquer la facture ${invoice.number} comme payée ?`)) return;

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/mark-paid`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Facture marquée comme payée !');
        mutate();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      console.error('Erreur mise à jour facture:', err);
      alert('Erreur lors de la mise à jour de la facture');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInvoice({
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientAddress: formData.clientAddress || null,
        subtotal: parseFloat(formData.subtotal),
        taxRate: parseFloat(formData.taxRate),
        dueDate: formData.dueDate || undefined,
        contactId: formData.contactId || null,
      });
      setIsModalOpen(false);
      setFormData({ clientName: '', clientEmail: '', clientAddress: '', subtotal: '', taxRate: '20', dueDate: '', contactId: '' });
      mutate();
    } catch (err) {
      console.error('Erreur création facture:', err);
    }
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement des factures...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement des factures</p>
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

  const statsDisplay = [
    { label: 'Total Factures', value: `${stats.totalValue.toLocaleString()}€`, color: 'text-orange-600', icon: Euro },
    { label: 'Payées', value: `${stats.totalPaid.toLocaleString()}€`, color: 'text-green-600', icon: CheckCircle2 },
    { label: 'En Attente', value: `${stats.totalUnpaid.toLocaleString()}€`, color: 'text-blue-600', icon: Clock },
    { label: 'En Retard', value: stats.enRetard, color: 'text-red-600', icon: AlertCircle },
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
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Nouvelle Facture
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {statsDisplay.map((stat, index) => {
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
              <option value="brouillon">Brouillon</option>
              <option value="envoyee">Envoyée</option>
              <option value="en_attente">En Attente</option>
              <option value="payee">Payées</option>
              <option value="en_retard">En Retard</option>
              <option value="annulee">Annulées</option>
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
                        <span className="font-mono text-sm font-semibold text-gray-900">{invoice.number}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900">{invoice.clientName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-orange-600">
                          {invoice.total.toLocaleString()}€
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(invoice.issuedAt).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(invoice.dueAt).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${statusColor}`}>
                          <StatusIcon className="h-3 w-3" />
                          {getStatusLabel(invoice.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleView(invoice)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDownload(invoice)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4 text-gray-600" />
                          </button>
                          {invoice.status !== 'PAYEE' && (
                            <button
                              onClick={() => handleSend(invoice)}
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
            Affichage de {filteredInvoices.length} factures
          </p>
        </div>

        {/* Modal Nouvelle Facture */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle Facture" size="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{submitError}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du client <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Entreprise ABC" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email client <span className="text-red-500">*</span></label>
                <input type="email" required value={formData.clientEmail} onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="contact@client.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse</label>
              <input type="text" value={formData.clientAddress} onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="123 Rue Example, 75001 Paris" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Montant HT (€) <span className="text-red-500">*</span></label>
                <input type="number" required min="0" step="0.01" value={formData.subtotal} onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="1000.00" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Taux TVA (%)</label>
                <input type="number" min="0" max="100" step="0.1" value={formData.taxRate} onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date d&apos;échéance</label>
                <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contact associé</label>
              <select value={formData.contactId} onChange={(e) => setFormData({ ...formData, contactId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Aucun contact</option>
                {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.firstName} {contact.lastName}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={submitting} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">Annuler</button>
              <button type="submit" disabled={submitting} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Création...</> : 'Créer la facture'}</button>
            </div>
          </form>
        </Modal>

        {/* Modal Détails Facture */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedInvoice(null);
          }}
          title={`Détails de la Facture ${selectedInvoice?.number || ''}`}
          size="lg"
        >
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Informations Client</h3>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Nom:</span> {selectedInvoice.clientName}</p>
                    <p className="text-sm"><span className="font-medium">Email:</span> {selectedInvoice.clientEmail}</p>
                    {selectedInvoice.clientAddress && (
                      <p className="text-sm"><span className="font-medium">Adresse:</span> {selectedInvoice.clientAddress}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Informations Facture</h3>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Numéro:</span> {selectedInvoice.number}</p>
                    <p className="text-sm">
                      <span className="font-medium">Statut:</span>{' '}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedInvoice.status)}`}>
                        {getStatusLabel(selectedInvoice.status)}
                      </span>
                    </p>
                    <p className="text-sm"><span className="font-medium">Date d&apos;émission:</span> {new Date(selectedInvoice.issuedAt).toLocaleDateString('fr-FR')}</p>
                    <p className="text-sm"><span className="font-medium">Date d&apos;échéance:</span> {new Date(selectedInvoice.dueAt).toLocaleDateString('fr-FR')}</p>
                    {selectedInvoice.paidAt && (
                      <p className="text-sm"><span className="font-medium">Date de paiement:</span> {new Date(selectedInvoice.paidAt).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Détails Financiers</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Montant HT:</span>
                    <span className="text-sm font-semibold">{selectedInvoice.subtotal.toLocaleString()}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">TVA ({selectedInvoice.taxRate}%):</span>
                    <span className="text-sm font-semibold">{selectedInvoice.taxAmount.toLocaleString()}€</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-lg font-bold text-gray-900">Total TTC:</span>
                    <span className="text-lg font-bold text-orange-600">{selectedInvoice.total.toLocaleString()}€</span>
                  </div>
                </div>
              </div>

              {selectedInvoice.products && selectedInvoice.products.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Articles ({selectedInvoice.products.length})</h3>
                  <div className="space-y-2">
                    {selectedInvoice.products.map((product: any) => (
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
                    setSelectedInvoice(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Fermer
                </button>
                <button
                  onClick={() => handleDownload(selectedInvoice)}
                  className="px-6 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-semibold flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Télécharger PDF
                </button>
                {selectedInvoice.status !== 'PAYEE' && (
                  <button
                    onClick={() => {
                      handleMarkAsPaid(selectedInvoice);
                      setIsDetailModalOpen(false);
                      setSelectedInvoice(null);
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Marquer comme payée
                  </button>
                )}
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
                <option value="envoyee">Envoyée</option>
                <option value="en_attente">En Attente</option>
                <option value="payee">Payée</option>
                <option value="en_retard">En Retard</option>
                <option value="annulee">Annulée</option>
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

            {/* Date d'émission */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date d&apos;émission
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={advancedFilters.issuedFrom}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, issuedFrom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Du"
                />
                <input
                  type="date"
                  value={advancedFilters.issuedTo}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, issuedTo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Au"
                />
              </div>
            </div>

            {/* Date d'échéance */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date d&apos;échéance
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={advancedFilters.dueFrom}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, dueFrom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Du"
                />
                <input
                  type="date"
                  value={advancedFilters.dueTo}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, dueTo: e.target.value })}
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
