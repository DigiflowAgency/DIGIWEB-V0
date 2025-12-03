'use client';

import { Plus, Mail, MapPin, Euro, Loader2, LayoutGrid, List as ListIcon, User, Building2, Phone, MessageSquare, Search, Settings2, Check, Eye, EyeOff, TrendingUp, Target, Calendar, BarChart3 } from 'lucide-react';
import { useMemo } from 'react';
import { useDeals, useDealMutations } from '@/hooks/useDeals';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import DealSidebar from '@/components/DealSidebar';

type DealStage = 'A_CONTACTER' | 'EN_DISCUSSION' | 'A_RELANCER' | 'RDV_PRIS' | 'NEGO_HOT' | 'CLOSING' | 'REFUSE';

const columns: { id: DealStage; title: string; color: string }[] = [
  { id: 'A_CONTACTER', title: 'À Contacter', color: 'bg-gray-100 border-gray-300' },
  { id: 'EN_DISCUSSION', title: 'En Discussion', color: 'bg-blue-50 border-blue-300' },
  { id: 'A_RELANCER', title: 'À Relancer', color: 'bg-yellow-50 border-yellow-300' },
  { id: 'RDV_PRIS', title: 'RDV Pris', color: 'bg-violet-50 border-violet-300' },
  { id: 'NEGO_HOT', title: 'Négo Hot 🔥', color: 'bg-orange-50 border-orange-300' },
  { id: 'CLOSING', title: 'Closing', color: 'bg-green-50 border-green-300' },
  { id: 'REFUSE', title: 'Refusé', color: 'bg-red-50 border-red-300' },
];

const getProbabilityBadge = (probability: number) => {
  if (probability >= 90) return { label: 'TRES_CHAUD', color: 'bg-red-500' };
  if (probability >= 75) return { label: 'CHAUD', color: 'bg-orange-500' };
  if (probability >= 50) return { label: 'TIEDE', color: 'bg-yellow-500' };
  return { label: 'FROID', color: 'bg-blue-500' };
};

// Configuration des badges produits avec couleurs distinctes
const productConfig: Record<string, { label: string; color: string; bgColor: string; emoji: string }> = {
  'DIGIFLOW': { label: 'Digiflow', color: 'text-violet-700', bgColor: 'bg-violet-100', emoji: '🚀' },
  'BEHYPE': { label: 'BeHype', color: 'text-pink-700', bgColor: 'bg-pink-100', emoji: '🔥' },
  'PISTACHE': { label: 'Pistache', color: 'text-green-700', bgColor: 'bg-green-100', emoji: '🌿' },
  'COMPTES_FOOD': { label: 'Comptes Food', color: 'text-orange-700', bgColor: 'bg-orange-100', emoji: '🍽️' },
};

export default function CRMPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [draggedDeal, setDraggedDeal] = useState<any>(null);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [hiddenColumns, setHiddenColumns] = useState<DealStage[]>([]);
  const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);
  const columnsMenuRef = useRef<HTMLDivElement>(null);

  // Charger les colonnes cachées depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('crm-hidden-columns');
    if (saved) {
      try {
        setHiddenColumns(JSON.parse(saved));
      } catch (e) {
        console.error('Erreur parsing colonnes cachées:', e);
      }
    }
  }, []);

  // Sauvegarder les colonnes cachées dans localStorage
  useEffect(() => {
    localStorage.setItem('crm-hidden-columns', JSON.stringify(hiddenColumns));
  }, [hiddenColumns]);

  // Fermer le menu des colonnes au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(event.target as Node)) {
        setIsColumnsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle la visibilité d'une colonne
  const toggleColumnVisibility = (columnId: DealStage) => {
    setHiddenColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  // Toggle le filtre produit
  const toggleProductFilter = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Colonnes visibles
  const visibleColumns = columns.filter(col => !hiddenColumns.includes(col.id));

  // Debounce la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Hook avec filtre par utilisateurs et recherche
  const { deals: rawDeals, isLoading, isError, mutate } = useDeals({
    ownerIds: selectedOwnerIds.length > 0 ? selectedOwnerIds : undefined,
    search: debouncedSearch || undefined,
  });

  // Filtrage côté client par produit
  const deals = useMemo(() => {
    if (selectedProducts.length === 0) return rawDeals;
    return rawDeals.filter(deal => deal.product && selectedProducts.includes(deal.product));
  }, [rawDeals, selectedProducts]);

  // Hook pour les mutations (supprimer)
  const { deleteDeal } = useDealMutations();

  // Supprimer un deal
  const handleDeleteDeal = async (dealId: string) => {
    await deleteDeal(dealId);
    setIsSidebarOpen(false);
    setSelectedDeal(null);
    mutate();
  };

  // Ouvrir automatiquement la sidebar si dealId est dans l'URL
  useEffect(() => {
    const dealIdFromUrl = searchParams.get('dealId');
    if (dealIdFromUrl && deals.length > 0) {
      const deal = deals.find(d => d.id === dealIdFromUrl);
      if (deal) {
        setSelectedDeal(deal);
        setIsSidebarOpen(true);
        // Nettoyer l'URL après avoir ouvert le deal
        router.replace('/dashboard/crm', { scroll: false });
      }
    }
  }, [searchParams, deals, router]);

  // Synchroniser selectedDeal avec les données rafraîchies
  useEffect(() => {
    if (selectedDeal && deals.length > 0) {
      const updatedDeal = deals.find(d => d.id === selectedDeal.id);
      if (updatedDeal && JSON.stringify(updatedDeal) !== JSON.stringify(selectedDeal)) {
        setSelectedDeal(updatedDeal);
      }
    }
  }, [deals, selectedDeal]);

  // Toggle filtre utilisateur
  const toggleOwnerFilter = (userId: string) => {
    setSelectedOwnerIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  useEffect(() => {
    // Récupérer la liste des utilisateurs
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        // L'API retourne { users: [...] }
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
          console.log('✅ Utilisateurs chargés:', data.users.length);
        } else {
          console.error('Format invalide pour users:', data);
          setUsers([]);
        }
      })
      .catch(err => {
        console.error('Erreur chargement users:', err);
        setUsers([]);
      });
  }, []);

  // Stats des commerciaux filtrés (doit être avant les early returns)
  const filteredStats = useMemo(() => {
    if (selectedOwnerIds.length === 0) return null;

    // Total des deals
    const totalDeals = deals.length;

    // Valeur totale du pipeline
    const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

    // Deals gagnés (CLOSING ou ENCAISSE)
    const wonDeals = deals.filter(d => d.stage === 'CLOSING' || d.productionStage === 'ENCAISSE');
    const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);

    // Taux de conversion
    const conversionRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;

    // RDV (deals au stage RDV_PRIS ou plus)
    const rdvStages = ['RDV_PRIS', 'NEGO_HOT', 'CLOSING'];
    const rdvCount = deals.filter(d => rdvStages.includes(d.stage)).length;

    // Noms des commerciaux filtrés
    const filteredUserNames = users
      .filter(u => selectedOwnerIds.includes(u.id))
      .map(u => `${u.firstName} ${u.lastName}`)
      .join(', ');

    return {
      totalDeals,
      totalValue,
      wonDeals: wonDeals.length,
      wonValue,
      conversionRate,
      rdvCount,
      userNames: filteredUserNames,
    };
  }, [deals, selectedOwnerIds, users]);

  const [formData, setFormData] = useState({
    // Contact
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // Company
    companyName: '',
    city: '',
    siret: '',
    website: '',
    instagram: '',
    // Deal
    assignedTo: '',
    stage: 'A_CONTACTER' as DealStage,
    product: '',
    value: '',
    meetingDate: '',
    nextFollowUp: '',
    origin: '',
    emailReminderSent: '',
    smsReminderSent: '',
    comments: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/crm/create-unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          companyName: '',
          city: '',
          siret: '',
          website: '',
          instagram: '',
          assignedTo: '',
          stage: 'A_CONTACTER',
          product: '',
          value: '',
          meetingDate: '',
          nextFollowUp: '',
          origin: '',
          emailReminderSent: '',
          smsReminderSent: '',
          comments: '',
        });
        mutate();
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Erreur lors du chargement</p>
      </div>
    );
  }

  const getDealsByStage = (stage: DealStage) => {
    return deals.filter((deal) => deal.stage === stage);
  };

  const handleDragStart = (deal: any) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStage: DealStage) => {
    if (!draggedDeal || draggedDeal.stage === targetStage) {
      setDraggedDeal(null);
      return;
    }

    try {
      const response = await fetch(`/api/deals/${draggedDeal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: targetStage }),
      });

      if (response.ok) {
        mutate();
      } else {
        alert('Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setDraggedDeal(null);
    }
  };

  const handleDealClick = (deal: any) => {
    setSelectedDeal(deal);
    setIsSidebarOpen(true);
  };

  // Mise à jour rapide du stage inline
  const handleInlineStageChange = async (dealId: string, newStage: DealStage, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher l'ouverture de la sidebar
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      if (response.ok) {
        mutate();
      } else {
        alert('Erreur lors de la mise à jour du stage');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="min-h-screen gradient-mesh py-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 to-orange-500 bg-clip-text text-transparent">
                CRM Pipeline
              </h1>
              <p className="mt-2 text-gray-600">
                Gérez vos leads et suivez vos opportunités commerciales
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un prospect..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
              {/* View Mode Toggle */}
              <div className="flex items-center bg-white rounded-lg border border-gray-300 p-1">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                    viewMode === 'kanban'
                      ? 'bg-violet-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Kanban
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                    viewMode === 'list'
                      ? 'bg-violet-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ListIcon className="h-4 w-4" />
                  Liste
                </button>
              </div>

              {/* Gestion des colonnes (mode Kanban uniquement) */}
              {viewMode === 'kanban' && (
                <div className="relative" ref={columnsMenuRef}>
                  <button
                    onClick={() => setIsColumnsMenuOpen(!isColumnsMenuOpen)}
                    className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                      hiddenColumns.length > 0
                        ? 'bg-orange-50 border-orange-300 text-orange-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Gérer les colonnes"
                  >
                    <Settings2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Colonnes</span>
                    {hiddenColumns.length > 0 && (
                      <span className="px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                        {hiddenColumns.length}
                      </span>
                    )}
                  </button>

                  {/* Dropdown menu */}
                  {isColumnsMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-2">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">Afficher/Masquer</p>
                        <p className="text-xs text-gray-500">Sélectionnez les colonnes visibles</p>
                      </div>
                      <div className="py-1">
                        {columns.map((column) => {
                          const isHidden = hiddenColumns.includes(column.id);
                          return (
                            <button
                              key={column.id}
                              onClick={() => toggleColumnVisibility(column.id)}
                              className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {isHidden ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-violet-600" />
                                )}
                                <span className={`text-sm ${isHidden ? 'text-gray-400' : 'text-gray-700'}`}>
                                  {column.title}
                                </span>
                              </div>
                              {!isHidden && <Check className="h-4 w-4 text-green-500" />}
                            </button>
                          );
                        })}
                      </div>
                      {hiddenColumns.length > 0 && (
                        <div className="px-3 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => setHiddenColumns([])}
                            className="w-full py-2 text-sm text-violet-600 hover:text-violet-700 font-medium"
                          >
                            Afficher toutes les colonnes
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => setIsModalOpen(true)} className="btn-primary">
                <Plus className="h-5 w-5 mr-2" />
                New
              </button>
            </div>
          </div>
        </div>

        {/* Filtre par commercial */}
        {users.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 mr-2">Filtrer par :</span>
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => toggleOwnerFilter(user.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  selectedOwnerIds.includes(user.id)
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                {user.firstName} {user.lastName}
              </button>
            ))}
            {selectedOwnerIds.length > 0 && (
              <button
                onClick={() => setSelectedOwnerIds([])}
                className="text-sm text-gray-400 hover:text-gray-600 ml-2 underline"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        )}

        {/* Filtre par produit */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 mr-2">Produit :</span>
          {Object.entries(productConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => toggleProductFilter(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                selectedProducts.includes(key)
                  ? `${config.bgColor} ${config.color} ring-2 ring-offset-1 ring-violet-400`
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span>{config.emoji}</span>
              {config.label}
            </button>
          ))}
          {selectedProducts.length > 0 && (
            <button
              onClick={() => setSelectedProducts([])}
              className="text-sm text-gray-400 hover:text-gray-600 ml-2 underline"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Stats du commercial filtré */}
        {filteredStats && (
          <div className="mb-6 bg-gradient-to-r from-violet-50 to-orange-50 rounded-xl p-4 border border-violet-100">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-5 w-5 text-violet-600" />
              <h3 className="font-semibold text-gray-900">
                Stats : {filteredStats.userNames}
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Deals actifs
                </div>
                <p className="text-xl font-bold text-gray-900">{filteredStats.totalDeals}</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Euro className="h-3.5 w-3.5" />
                  Pipeline
                </div>
                <p className="text-xl font-bold text-violet-700">{filteredStats.totalValue.toLocaleString()} €</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  RDV
                </div>
                <p className="text-xl font-bold text-orange-600">{filteredStats.rdvCount}</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Target className="h-3.5 w-3.5" />
                  Gagnés
                </div>
                <p className="text-xl font-bold text-green-600">{filteredStats.wonDeals}</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Euro className="h-3.5 w-3.5" />
                  CA Gagné
                </div>
                <p className="text-xl font-bold text-green-700">{filteredStats.wonValue.toLocaleString()} €</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Conversion
                </div>
                <p className="text-xl font-bold text-blue-600">{filteredStats.conversionRate}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Kanban Board View */}
        {viewMode === 'kanban' && (
          <div className="flex gap-4 overflow-x-auto pb-4">
          {visibleColumns.map((column) => {
            const columnDeals = getDealsByStage(column.id);
            const totalValue = columnDeals.reduce((sum, deal) => sum + deal.value, 0);

            return (
              <div
                key={column.id}
                className="flex-shrink-0 w-80 bg-gray-50 rounded-xl border-2 border-dashed"
                style={{ borderColor: column.color.split(' ')[1].replace('border-', '') }}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
              >
                {/* Column Header */}
                <div className={`px-4 py-3 rounded-t-xl ${column.color}`}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">{column.title}</h3>
                    <span className="px-2 py-1 text-xs font-bold bg-white rounded-full">
                      {columnDeals.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">
                    {totalValue.toLocaleString()} €
                  </p>
                </div>

                {/* Column Content */}
                <div className="p-3 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {columnDeals.map((deal) => {
                    const badge = getProbabilityBadge(deal.probability);
                    const contactName = deal.contacts
                      ? `${deal.contacts.firstName} ${deal.contacts.lastName}`
                      : 'Contact non défini';
                    const companyName = deal.companies?.name || deal.title;
                    const city = deal.companies?.city || '';

                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={() => handleDragStart(deal)}
                        onClick={() => handleDealClick(deal)}
                        className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition cursor-move border border-gray-200"
                      >
                        {/* Deal Header */}
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-900 flex-1 pr-2">
                            {companyName}
                          </h4>
                          <span
                            className={`px-2 py-0.5 text-xs font-bold text-white ${badge.color} rounded flex-shrink-0`}
                          >
                            {deal.probability}%
                          </span>
                        </div>

                        {/* Stage Quick Edit */}
                        <div className="mb-3">
                          <select
                            value={deal.stage}
                            onChange={(e) => handleInlineStageChange(deal.id, e.target.value as DealStage, e as unknown as React.MouseEvent)}
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full px-2 py-1 rounded text-xs font-medium cursor-pointer border focus:ring-2 focus:ring-violet-500 transition-colors ${
                              deal.stage === 'A_CONTACTER'
                                ? 'bg-gray-50 text-gray-700 border-gray-200'
                                : deal.stage === 'EN_DISCUSSION'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : deal.stage === 'RDV_PRIS'
                                ? 'bg-violet-50 text-violet-700 border-violet-200'
                                : deal.stage === 'NEGO_HOT'
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : deal.stage === 'A_RELANCER'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : deal.stage === 'CLOSING'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {columns.map((col) => (
                              <option key={col.id} value={col.id}>
                                {col.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-1.5 mb-3">
                          <p className="text-sm font-medium text-gray-700">{contactName}</p>
                          {deal.contacts?.email && (
                            <div className="flex items-center text-xs text-gray-600">
                              <Mail className="h-3.5 w-3.5 mr-1.5" />
                              <span className="truncate">{deal.contacts.email}</span>
                            </div>
                          )}
                          {deal.contacts?.phone && (
                            <div className="flex items-center text-xs text-gray-600">
                              <Phone className="h-3.5 w-3.5 mr-1.5" />
                              <span>{deal.contacts.phone}</span>
                            </div>
                          )}
                          {city && (
                            <div className="flex items-center text-xs text-gray-600">
                              <MapPin className="h-3.5 w-3.5 mr-1.5" />
                              <span>{city}</span>
                            </div>
                          )}
                        </div>

                        {/* Product Badge */}
                        {deal.product && productConfig[deal.product] && (
                          <div className="mb-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${productConfig[deal.product].bgColor} ${productConfig[deal.product].color}`}>
                              <span>{productConfig[deal.product].emoji}</span>
                              {productConfig[deal.product].label}
                            </span>
                          </div>
                        )}

                        {/* Description & Value */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <span className="text-xs text-gray-500 truncate flex-1 pr-2">
                            {deal.description || deal.title}
                          </span>
                          <div className="flex items-center text-sm font-bold text-violet-700 flex-shrink-0">
                            <Euro className="h-4 w-4 mr-1" />
                            <span>{deal.value.toLocaleString()} {deal.currency}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {columnDeals.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Aucun deal dans cette colonne
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Deal / Entreprise
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Téléphone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ville
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Probabilité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Valeur
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {deals.map((deal) => {
                    const badge = getProbabilityBadge(deal.probability);
                    const contactName = deal.contacts
                      ? `${deal.contacts.firstName} ${deal.contacts.lastName}`
                      : 'Contact non défini';
                    const companyName = deal.companies?.name || deal.title;
                    const city = deal.companies?.city || '';

                    return (
                      <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{companyName}</p>
                            <p className="text-xs text-gray-500">{deal.description || deal.title}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">{contactName}</p>
                            {deal.contacts?.email && (
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <Mail className="h-3 w-3 mr-1" />
                                {deal.contacts.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {deal.contacts?.phone ? (
                            <a
                              href={`tel:${deal.contacts.phone}`}
                              className="flex items-center text-sm text-violet-600 hover:text-violet-800 hover:underline"
                            >
                              <Phone className="h-4 w-4 mr-1.5" />
                              {deal.contacts.phone}
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {city && (
                            <div className="flex items-center text-sm text-gray-700">
                              <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                              {city}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {deal.product && productConfig[deal.product] ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${productConfig[deal.product].bgColor} ${productConfig[deal.product].color}`}>
                              <span>{productConfig[deal.product].emoji}</span>
                              {productConfig[deal.product].label}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={deal.stage}
                            onChange={(e) => handleInlineStageChange(deal.id, e.target.value as DealStage, e as unknown as React.MouseEvent)}
                            onClick={(e) => e.stopPropagation()}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-0 focus:ring-2 focus:ring-violet-500 transition-colors ${
                              deal.stage === 'A_CONTACTER'
                                ? 'bg-gray-100 text-gray-700'
                                : deal.stage === 'EN_DISCUSSION'
                                ? 'bg-blue-100 text-blue-700'
                                : deal.stage === 'RDV_PRIS'
                                ? 'bg-violet-100 text-violet-700'
                                : deal.stage === 'NEGO_HOT'
                                ? 'bg-orange-100 text-orange-700'
                                : deal.stage === 'A_RELANCER'
                                ? 'bg-yellow-100 text-yellow-700'
                                : deal.stage === 'CLOSING'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {columns.map((col) => (
                              <option key={col.id} value={col.id}>
                                {col.title}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-bold text-white ${badge.color} rounded`}>
                            {deal.probability}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm font-bold text-violet-700">
                            <Euro className="h-4 w-4 mr-1" />
                            {deal.value.toLocaleString()} {deal.currency}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {deals.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p>Aucun deal à afficher</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Nouveau Lead Unifié */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Nouveau Lead"
          size="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section Contact */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-violet-600" />
                Contact
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Dupont"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="jean.dupont@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>
            </div>

            {/* Section Entreprise */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-violet-600" />
                Entreprise
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'entreprise
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="ACME Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Paris"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SIREN
                  </label>
                  <input
                    type="text"
                    value={formData.siret}
                    onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Web
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="https://example.com"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="@username"
                  />
                </div>
              </div>
            </div>

            {/* Section Deal */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Euro className="h-5 w-5 text-violet-600" />
                Opportunité
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignation
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Sélectionner...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    État
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as DealStage })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="A_CONTACTER">À Contacter</option>
                    <option value="EN_DISCUSSION">En Discussion</option>
                    <option value="A_RELANCER">À Relancer</option>
                    <option value="RDV_PRIS">RDV Pris</option>
                    <option value="NEGO_HOT">Négo Hot 🔥</option>
                    <option value="CLOSING">Closing</option>
                    <option value="REFUSE">Refusé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Produit
                  </label>
                  <select
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="DIGIFLOW">DIGIFLOW</option>
                    <option value="BEHYPE">BEHYPE</option>
                    <option value="PISTACHE">PISTACHE</option>
                    <option value="COMPTES_FOOD">COMPTES FOOD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valeur (€)
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="5000"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de RDV
                  </label>
                  <input
                    type="date"
                    value={formData.meetingDate}
                    onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prochaine relance
                  </label>
                  <input
                    type="date"
                    value={formData.nextFollowUp}
                    onChange={(e) => setFormData({ ...formData, nextFollowUp: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origine
                  </label>
                  <select
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="SITE_WEB">Site web</option>
                    <option value="TELEPROS_CAM">TÉLÉPROS CAM</option>
                    <option value="DM_INSTA">DM INSTA</option>
                    <option value="LINKEDIN">LINKEDIN</option>
                    <option value="RECOMMANDATION">RECOMMANDATION</option>
                    <option value="CLIENT_BEHYPE">CLIENT BEHYPE</option>
                    <option value="CONNAISSANCE">CONNAISSANCE</option>
                    <option value="ADS">ADS</option>
                    <option value="COLD_CALL">COLD CALL</option>
                    <option value="COLD_MAIL">COLD MAIL</option>
                    <option value="COLD_SMS">COLD SMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mail de relance envoyé
                  </label>
                  <select
                    value={formData.emailReminderSent}
                    onChange={(e) => setFormData({ ...formData, emailReminderSent: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="A_ENVOYER">À envoyer</option>
                    <option value="OUI">Oui</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMS de relance envoyé
                  </label>
                  <select
                    value={formData.smsReminderSent}
                    onChange={(e) => setFormData({ ...formData, smsReminderSent: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="NON">Non</option>
                    <option value="OUI">Oui</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section Commentaires */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-violet-600" />
                Commentaires
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes / Commentaires
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Ajouter des notes sur ce lead..."
                  rows={4}
                />
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Créer le lead
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Deal Sidebar */}
        {selectedDeal && (
          <DealSidebar
            deal={selectedDeal}
            isOpen={isSidebarOpen}
            onClose={() => {
              setIsSidebarOpen(false);
              setSelectedDeal(null);
            }}
            onUpdate={mutate}
            onDelete={handleDeleteDeal}
          />
        )}
      </div>
    </div>
  );
}
