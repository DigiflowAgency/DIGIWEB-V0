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
  Euro,
  Loader2
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    subtotal: '',
    taxRate: '20',
    dueDate: '',
    contactId: '',
  });

  // Utiliser le hook useInvoices pour récupérer les données depuis l'API
  const { invoices, stats, isLoading, isError, mutate } = useInvoices({
    search: searchQuery || undefined,
    status: selectedStatus !== 'all' ? selectedStatus.toUpperCase() : undefined,
  });

  const { createInvoice, loading: submitting, error: submitError } = useInvoiceMutations();
  const { contacts } = useContacts({});

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
                {invoices.map((invoice) => {
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
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Voir">
                            <Eye className="h-4 w-4 text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Télécharger">
                            <Download className="h-4 w-4 text-gray-600" />
                          </button>
                          {invoice.status !== 'PAYEE' && (
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
            Affichage de {invoices.length} factures
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
      </div>
    </div>
  );
}
