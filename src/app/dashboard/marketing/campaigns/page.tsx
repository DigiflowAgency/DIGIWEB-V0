'use client';

import { useState } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Play,
  Pause,
  Eye,
  Edit,
  TrendingUp,
  Users,
  MousePointer,
  DollarSign,
  Loader2
} from 'lucide-react';
import { useCampaigns, useCampaignMutations } from '@/hooks/useCampaigns';
import Modal from '@/components/Modal';

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'EMAIL': return 'Email';
    case 'SOCIAL_MEDIA': return 'Social Media';
    case 'PAID_ADS': return 'Paid Ads';
    case 'EVENT': return 'Event';
    default: return type;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'BROUILLON': return 'Brouillon';
    case 'PLANIFIEE': return 'Planifiée';
    case 'ACTIVE': return 'Active';
    case 'TERMINEE': return 'Terminée';
    default: return status;
  }
};

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'EMAIL' as 'EMAIL' | 'SOCIAL_MEDIA' | 'PAID_ADS' | 'EVENT',
    budget: '',
    startDate: '',
    endDate: '',
  });

  // Utiliser le hook useCampaigns pour récupérer les données depuis l'API
  const { campaigns, stats, isLoading, isError, mutate } = useCampaigns({
    search: searchQuery || undefined,
    status: selectedStatus !== 'all' ? selectedStatus.toUpperCase() : undefined,
  });

  const { createCampaign, updateCampaign, loading: submitting, error: submitError } = useCampaignMutations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCampaign({
        name: formData.name,
        type: formData.type,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      });
      setIsModalOpen(false);
      setFormData({ name: '', type: 'EMAIL', budget: '', startDate: '', endDate: '' });
      mutate();
    } catch (err) {
      console.error('Erreur création campagne:', err);
    }
  };

  const handleEdit = (campaign: any) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      type: campaign.type,
      budget: campaign.budget?.toString() || '',
      startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '',
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    try {
      await updateCampaign(selectedCampaign.id, {
        name: formData.name,
        type: formData.type,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      });
      setIsEditModalOpen(false);
      setFormData({ name: '', type: 'EMAIL', budget: '', startDate: '', endDate: '' });
      setSelectedCampaign(null);
      mutate();
    } catch (err) {
      console.error('Erreur mise à jour campagne:', err);
    }
  };

  const handleViewDetails = (campaign: any) => {
    setSelectedCampaign(campaign);
    setIsDetailModalOpen(true);
  };

  const handleToggleStatus = async (campaign: any) => {
    try {
      const newStatus = campaign.status === 'ACTIVE' ? 'PLANIFIEE' : 'ACTIVE';
      await updateCampaign(campaign.id, { status: newStatus });
      mutate();
    } catch (err) {
      console.error('Erreur changement statut:', err);
    }
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement des campagnes...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement des campagnes</p>
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
    { label: 'Portée Totale', value: stats.totalReach.toLocaleString(), color: 'text-orange-600', icon: Users },
    { label: 'Total Clics', value: stats.totalClicks.toLocaleString(), color: 'text-blue-600', icon: MousePointer },
    { label: 'Conversions', value: stats.totalConversions, color: 'text-green-600', icon: TrendingUp },
    { label: 'Budget Total', value: `${stats.totalBudget.toLocaleString()}€`, color: 'text-purple-600', icon: DollarSign },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'PLANIFIEE': return 'bg-blue-100 text-blue-700';
      case 'TERMINEE': return 'bg-gray-100 text-gray-700';
      case 'BROUILLON': return 'bg-yellow-100 text-yellow-700';
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
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Nouvelle Campagne
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
              <option value="planifiee">Planifiée</option>
              <option value="brouillon">Brouillon</option>
              <option value="terminee">Terminée</option>
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tous les types</option>
              <option value="email">Email</option>
              <option value="social_media">Social Media</option>
              <option value="paid_ads">Paid Ads</option>
              <option value="event">Event</option>
            </select>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            const clickRate = campaign.reach > 0 ? ((campaign.clicks / campaign.reach) * 100).toFixed(1) : 0;
            const conversionRate = campaign.clicks > 0 ? ((campaign.conversions / campaign.clicks) * 100).toFixed(1) : 0;

            return (
              <div key={campaign.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{campaign.name}</h3>
                    <span className="text-sm text-gray-500">{getTypeLabel(campaign.type)}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(campaign.status)}`}>
                    {getStatusLabel(campaign.status)}
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
                    <span className="font-semibold text-orange-600">
                      {campaign.budget ? campaign.budget.toLocaleString() : '0'}€
                    </span>
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
                  <button
                    onClick={() => handleViewDetails(campaign)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <Eye className="h-4 w-4" />
                    Voir
                  </button>
                  <button
                    onClick={() => handleEdit(campaign)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Éditer"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(campaign)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title={campaign.status === 'ACTIVE' ? 'Mettre en pause' : 'Activer'}
                  >
                    {campaign.status === 'ACTIVE' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Nouvelle Campagne */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle Campagne" size="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{submitError}</div>}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de la campagne <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Campagne Printemps 2025" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type <span className="text-red-500">*</span></label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'EMAIL' | 'SOCIAL_MEDIA' | 'PAID_ADS' | 'EVENT' })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="EMAIL">Email</option>
                  <option value="SOCIAL_MEDIA">Social Media</option>
                  <option value="PAID_ADS">Paid Ads</option>
                  <option value="EVENT">Event</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Budget (€)</label>
                <input type="number" min="0" step="0.01" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="5000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date de début</label>
                <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date de fin</label>
                <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={submitting} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">Annuler</button>
              <button type="submit" disabled={submitting} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Création...</> : 'Créer la campagne'}</button>
            </div>
          </form>
        </Modal>

        {/* Modal Édition Campagne */}
        <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedCampaign(null); }} title="Éditer la Campagne" size="lg">
          <form onSubmit={handleUpdateSubmit} className="space-y-6">
            {submitError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{submitError}</div>}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de la campagne <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type <span className="text-red-500">*</span></label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'EMAIL' | 'SOCIAL_MEDIA' | 'PAID_ADS' | 'EVENT' })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="EMAIL">Email</option>
                  <option value="SOCIAL_MEDIA">Social Media</option>
                  <option value="PAID_ADS">Paid Ads</option>
                  <option value="EVENT">Event</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Budget (€)</label>
                <input type="number" min="0" step="0.01" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date de début</label>
                <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date de fin</label>
                <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => { setIsEditModalOpen(false); setSelectedCampaign(null); }} disabled={submitting} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">Annuler</button>
              <button type="submit" disabled={submitting} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Enregistrement...</> : 'Enregistrer'}</button>
            </div>
          </form>
        </Modal>

        {/* Modal Détails Campagne */}
        <Modal isOpen={isDetailModalOpen} onClose={() => { setIsDetailModalOpen(false); setSelectedCampaign(null); }} title="Détails de la Campagne" size="lg">
          {selectedCampaign && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nom</label>
                  <p className="text-gray-900 font-semibold">{selectedCampaign.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Type</label>
                  <p className="text-gray-900 font-semibold">{getTypeLabel(selectedCampaign.type)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Statut</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedCampaign.status)}`}>
                    {getStatusLabel(selectedCampaign.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Budget</label>
                  <p className="text-orange-600 font-bold text-lg">{selectedCampaign.budget ? `${selectedCampaign.budget.toLocaleString()}€` : 'Non défini'}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Portée</p>
                    <p className="text-blue-600 font-bold text-xl">{selectedCampaign.reach.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Clics</p>
                    <p className="text-green-600 font-bold text-xl">{selectedCampaign.clicks.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Conversions</p>
                    <p className="text-purple-600 font-bold text-xl">{selectedCampaign.conversions}</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Dépensé</p>
                    <p className="text-orange-600 font-bold text-xl">{selectedCampaign.spent.toLocaleString()}€</p>
                  </div>
                </div>
              </div>
              {(selectedCampaign.startDate || selectedCampaign.endDate) && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Dates</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedCampaign.startDate && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Date de début</p>
                        <p className="text-gray-900 font-medium">{new Date(selectedCampaign.startDate).toLocaleDateString('fr-FR')}</p>
                      </div>
                    )}
                    {selectedCampaign.endDate && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Date de fin</p>
                        <p className="text-gray-900 font-medium">{new Date(selectedCampaign.endDate).toLocaleDateString('fr-FR')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => { setIsDetailModalOpen(false); setSelectedCampaign(null); }} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">Fermer</button>
                <button onClick={() => { setIsDetailModalOpen(false); handleEdit(selectedCampaign); }} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold flex items-center gap-2"><Edit className="h-4 w-4" />Éditer</button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
