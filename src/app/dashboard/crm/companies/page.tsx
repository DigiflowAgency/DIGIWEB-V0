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
  Globe,
  Loader2
} from 'lucide-react';
import { useCompanies, useCompanyMutations } from '@/hooks/useCompanies';
import Modal from '@/components/Modal';

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [advancedFilters, setAdvancedFilters] = useState({
    industry: '',
    status: 'all',
    employeesMin: '',
    employeesMax: '',
    revenueMin: '',
    revenueMax: '',
    city: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    siret: '',
    industry: '',
    employees: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    postalCode: '',
    status: 'LEAD' as 'LEAD' | 'PROSPECT' | 'CLIENT',
  });

  // Utiliser le hook useCompanies pour récupérer les données depuis l'API
  const { companies, stats, isLoading, isError, mutate } = useCompanies({
    search: searchQuery || undefined,
    status: selectedStatus !== 'all' ? selectedStatus.toUpperCase() : undefined,
  });

  // Hook de mutations
  const { createCompany, updateCompany, deleteCompany, loading: submitting, error: submitError } = useCompanyMutations();

  // Filtres avancés
  const filteredCompanies = companies.filter(company => {
    if (advancedFilters.industry && !company.industry?.toLowerCase().includes(advancedFilters.industry.toLowerCase())) return false;
    if (advancedFilters.status !== 'all' && company.status !== advancedFilters.status.toUpperCase()) return false;
    if (advancedFilters.employeesMin && (company.employees || 0) < parseInt(advancedFilters.employeesMin)) return false;
    if (advancedFilters.employeesMax && (company.employees || 0) > parseInt(advancedFilters.employeesMax)) return false;
    if (advancedFilters.revenueMin && (company.revenue || 0) < parseInt(advancedFilters.revenueMin)) return false;
    if (advancedFilters.revenueMax && (company.revenue || 0) > parseInt(advancedFilters.revenueMax)) return false;
    if (advancedFilters.city && !company.city?.toLowerCase().includes(advancedFilters.city.toLowerCase())) return false;
    return true;
  });

  const handleApplyFilters = () => {
    setIsFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    setAdvancedFilters({
      industry: '',
      status: 'all',
      employeesMin: '',
      employeesMax: '',
      revenueMin: '',
      revenueMax: '',
      city: '',
    });
  };

  // Handlers pour les actions
  const handleEdit = (company: any) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      siret: company.siret || '',
      industry: company.industry || '',
      employees: company.employees?.toString() || '',
      phone: company.phone || '',
      email: company.email || '',
      website: company.website || '',
      address: company.address || '',
      city: company.city || '',
      postalCode: company.postalCode || '',
      status: company.status,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    try {
      await updateCompany(selectedCompany.id, {
        name: formData.name,
        siret: formData.siret || null,
        industry: formData.industry || null,
        employees: formData.employees ? parseInt(formData.employees) : null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        address: formData.address || null,
        city: formData.city || null,
        postalCode: formData.postalCode || null,
        status: formData.status,
      });
      setIsEditModalOpen(false);
      setSelectedCompany(null);
      mutate();
    } catch (err) {
      console.error('Erreur modification entreprise:', err);
    }
  };

  const handleDelete = async (company: any) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${company.name} ?`)) return;

    try {
      await deleteCompany(company.id);
      mutate();
    } catch (err) {
      console.error('Erreur suppression entreprise:', err);
    }
  };

  // Gestion du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createCompany({
        name: formData.name,
        siret: formData.siret || null,
        industry: formData.industry || null,
        employees: formData.employees ? parseInt(formData.employees) : null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        address: formData.address || null,
        city: formData.city || null,
        postalCode: formData.postalCode || null,
        status: formData.status,
      });
      setIsModalOpen(false);
      setFormData({
        name: '',
        siret: '',
        industry: '',
        employees: '',
        phone: '',
        email: '',
        website: '',
        address: '',
        city: '',
        postalCode: '',
        status: 'LEAD',
      });
      mutate(); // Revalider les données
    } catch (err) {
      console.error('Erreur création entreprise:', err);
    }
  };

  const statsDisplay = [
    { label: 'Total Entreprises', value: stats.total, color: 'text-orange-600' },
    { label: 'Clients', value: stats.clients, color: 'text-green-600' },
    { label: 'Prospects', value: stats.prospects, color: 'text-blue-600' },
    { label: 'Leads', value: stats.leads, color: 'text-purple-600' },
  ];

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement des entreprises...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement des entreprises</p>
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
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Nouvelle Entreprise
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
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-5 w-5" />
              Filtres Avancés
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
                    <p className="text-sm text-gray-500">{company.industry || 'Non spécifié'}</p>
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
                    <span>{company.city || 'Non spécifié'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{company.employees || 0} employés</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Euro className="h-4 w-4" />
                    <span className="font-semibold text-gray-900">
                      {company.revenue ? `${(company.revenue / 1000).toFixed(0)}K` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>{company.deals?.length || 0} deals</span>
                  </div>
                </div>

                {company.website && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="h-4 w-4" />
                    <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-orange-600 transition-colors">
                      {company.website}
                    </a>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  company.status === 'CLIENT'
                    ? 'bg-green-100 text-green-700'
                    : company.status === 'PROSPECT'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {company.status}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{company.contacts?.length || 0} contacts</span>
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(3, company.contacts?.length || 0))].map((_, i) => (
                      <div key={i} className="h-8 w-8 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center">
                        <Users className="h-4 w-4 text-orange-600" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(company)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(company)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4 text-gray-600 hover:text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Nouvelle Entreprise */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Nouvelle Entreprise"
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Erreur globale */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {submitError}
              </div>
            )}

            {/* Nom et SIRET */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom de l&apos;entreprise <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Acme Corporation"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  SIRET
                </label>
                <input
                  type="text"
                  value={formData.siret}
                  onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="123 456 789 00010"
                />
              </div>
            </div>

            {/* Secteur et Employés */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Secteur d&apos;activité
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Technologie, Commerce, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre d&apos;employés
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.employees}
                  onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="50"
                />
              </div>
            </div>

            {/* Email et Téléphone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="contact@acme.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            </div>

            {/* Site Web et Statut */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Site Web
                </label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="www.acme.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'LEAD' | 'PROSPECT' | 'CLIENT' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="LEAD">Lead</option>
                  <option value="PROSPECT">Prospect</option>
                  <option value="CLIENT">Client</option>
                </select>
              </div>
            </div>

            {/* Adresse */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="123 Rue de la Paix"
              />
            </div>

            {/* Ville et Code Postal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Paris"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Code Postal
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="75001"
                />
              </div>
            </div>

            {/* Boutons */}
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
                  'Créer l\'entreprise'
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Modifier Entreprise */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCompany(null);
          }}
          title="Modifier l'Entreprise"
          size="lg"
        >
          <form onSubmit={handleEditSubmit} className="space-y-6">
            {/* Erreur globale */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {submitError}
              </div>
            )}

            {/* Nom et SIRET */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom de l&apos;entreprise <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Acme Corporation"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  SIRET
                </label>
                <input
                  type="text"
                  value={formData.siret}
                  onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="123 456 789 00010"
                />
              </div>
            </div>

            {/* Secteur et Employés */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Secteur d&apos;activité
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Technologie, Commerce, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre d&apos;employés
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.employees}
                  onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="50"
                />
              </div>
            </div>

            {/* Email et Téléphone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="contact@acme.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            </div>

            {/* Site Web et Statut */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Site Web
                </label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="www.acme.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'LEAD' | 'PROSPECT' | 'CLIENT' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="LEAD">Lead</option>
                  <option value="PROSPECT">Prospect</option>
                  <option value="CLIENT">Client</option>
                </select>
              </div>
            </div>

            {/* Adresse */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="123 Rue de la Paix"
              />
            </div>

            {/* Ville et Code Postal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Paris"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Code Postal
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="75001"
                />
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedCompany(null);
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

        {/* Modal Filtres Avancés */}
        <Modal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          title="Filtres Avancés"
          size="md"
        >
          <div className="space-y-4">
            {/* Secteur */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Secteur d&apos;activité
              </label>
              <input
                type="text"
                value={advancedFilters.industry}
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, industry: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Technologie, Commerce..."
              />
            </div>

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
                <option value="client">Client</option>
                <option value="prospect">Prospect</option>
                <option value="lead">Lead</option>
              </select>
            </div>

            {/* Nombre d'employés */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre d&apos;employés
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  min="0"
                  value={advancedFilters.employeesMin}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, employeesMin: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Min"
                />
                <input
                  type="number"
                  min="0"
                  value={advancedFilters.employeesMax}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, employeesMax: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Chiffre d'affaires */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Chiffre d&apos;affaires (€)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  min="0"
                  value={advancedFilters.revenueMin}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, revenueMin: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Min"
                />
                <input
                  type="number"
                  min="0"
                  value={advancedFilters.revenueMax}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, revenueMax: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Ville */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ville
              </label>
              <input
                type="text"
                value={advancedFilters.city}
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Paris, Lyon..."
              />
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
