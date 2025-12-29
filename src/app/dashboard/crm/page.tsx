'use client';

import { Plus, Mail, MapPin, Euro, Loader2, LayoutGrid, List as ListIcon, User, Building2, Phone, MessageSquare, Search, Settings2, Check, Eye, EyeOff, TrendingUp, Target, Calendar, BarChart3, Settings, Palette, X } from 'lucide-react';
import { useMemo } from 'react';
import { useDeals, useDealMutations } from '@/hooks/useDeals';
import { useStages } from '@/hooks/useStages';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import DealSidebar from '@/components/DealSidebar';
import StageSettingsModal from '@/components/StageSettingsModal';

// Les stages sont maintenant dynamiques via useStages()

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

  // Stages dynamiques
  const { stages: dynamicStages, isLoading: stagesLoading, getStageColor, wonStage } = useStages();

  // Convertir les stages en format colonne pour le Kanban
  const columns = useMemo(() => {
    return dynamicStages.map(stage => ({
      id: stage.code,
      title: stage.label,
      color: stage.color,
    }));
  }, [dynamicStages]);

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStageSettingsOpen, setIsStageSettingsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [draggedDeal, setDraggedDeal] = useState<any>(null);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [dealDetailData, setDealDetailData] = useState<{ metaLead: any; notes: any[] } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);
  const columnsMenuRef = useRef<HTMLDivElement>(null);

  // État pour le code couleur par montant (partagé avec Pipeline)
  const [colorThreshold, setColorThreshold] = useState<number>(3000);
  const [lowColor, setLowColor] = useState<string>('blue');
  const [highColor, setHighColor] = useState<string>('violet');
  const [showColorModal, setShowColorModal] = useState(false);
  const [tempThreshold, setTempThreshold] = useState<string>('3000');
  const [tempLowColor, setTempLowColor] = useState<string>('blue');
  const [tempHighColor, setTempHighColor] = useState<string>('violet');

  // Options de couleurs disponibles
  const colorOptions = [
    { id: 'blue', label: 'Bleu', border: 'border-l-blue-500', bg: 'bg-blue-50', preview: 'bg-blue-500' },
    { id: 'violet', label: 'Violet', border: 'border-l-violet-500', bg: 'bg-violet-50', preview: 'bg-violet-500' },
    { id: 'green', label: 'Vert', border: 'border-l-green-500', bg: 'bg-green-50', preview: 'bg-green-500' },
    { id: 'orange', label: 'Orange', border: 'border-l-orange-500', bg: 'bg-orange-50', preview: 'bg-orange-500' },
    { id: 'pink', label: 'Rose', border: 'border-l-pink-500', bg: 'bg-pink-50', preview: 'bg-pink-500' },
    { id: 'yellow', label: 'Jaune', border: 'border-l-yellow-500', bg: 'bg-yellow-50', preview: 'bg-yellow-500' },
    { id: 'red', label: 'Rouge', border: 'border-l-red-500', bg: 'bg-red-50', preview: 'bg-red-500' },
    { id: 'gray', label: 'Gris', border: 'border-l-gray-500', bg: 'bg-gray-50', preview: 'bg-gray-500' },
  ];

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

  // Charger les paramètres de couleur depuis localStorage
  useEffect(() => {
    const savedThreshold = localStorage.getItem('dealColorThreshold');
    const savedLowColor = localStorage.getItem('dealLowColor');
    const savedHighColor = localStorage.getItem('dealHighColor');
    if (savedThreshold) {
      setColorThreshold(Number(savedThreshold));
      setTempThreshold(savedThreshold);
    }
    if (savedLowColor) {
      setLowColor(savedLowColor);
      setTempLowColor(savedLowColor);
    }
    if (savedHighColor) {
      setHighColor(savedHighColor);
      setTempHighColor(savedHighColor);
    }
  }, []);

  // Sauvegarder les paramètres de couleur
  const saveColorSettings = () => {
    const threshold = Number(tempThreshold) || 3000;
    setColorThreshold(threshold);
    setLowColor(tempLowColor);
    setHighColor(tempHighColor);
    localStorage.setItem('dealColorThreshold', String(threshold));
    localStorage.setItem('dealLowColor', tempLowColor);
    localStorage.setItem('dealHighColor', tempHighColor);
    setShowColorModal(false);
  };

  // Fonction pour obtenir la couleur selon le montant
  const getDealColor = (value: number) => {
    const colorConfig = value < colorThreshold
      ? colorOptions.find(c => c.id === lowColor)
      : colorOptions.find(c => c.id === highColor);
    return colorConfig
      ? `border-l-4 ${colorConfig.border} ${colorConfig.bg}`
      : 'border-l-4 border-l-gray-300 bg-gray-50';
  };

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
  const toggleColumnVisibility = (columnId: string) => {
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
        // Charger le détail complet du deal (avec metaLead)
        fetch(`/api/deals/${dealIdFromUrl}`)
          .then(response => {
            if (response.ok) return response.json();
            throw new Error('Erreur API');
          })
          .then(fullDeal => {
            setDealDetailData({
              metaLead: fullDeal.metaLead || null,
              notes: fullDeal.notes || [],
            });
            setSelectedDeal(fullDeal);
          })
          .catch(error => console.error('Erreur chargement détail deal:', error));
        // Nettoyer l'URL après avoir ouvert le deal
        router.replace('/dashboard/crm', { scroll: false });
      }
    }
  }, [searchParams, deals, router]);

  // Synchroniser selectedDeal avec les données rafraîchies de la liste
  useEffect(() => {
    if (selectedDeal && deals.length > 0) {
      const updatedDeal = deals.find(d => d.id === selectedDeal.id);
      if (updatedDeal && JSON.stringify(updatedDeal) !== JSON.stringify(selectedDeal)) {
        setSelectedDeal(updatedDeal);
      }
    }
  }, [deals]);

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

    // Deals gagnés (stage wonStage ou ENCAISSE)
    const wonStageCode = wonStage?.code;
    const wonDeals = deals.filter(d => d.stage === wonStageCode || d.productionStage === 'ENCAISSE');
    const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);

    // Taux de conversion
    const conversionRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;

    // RDV (deals avec probabilité >= 50)
    const highProbabilityStages = dynamicStages.filter(s => s.probability >= 50).map(s => s.code);
    const rdvCount = deals.filter(d => highProbabilityStages.includes(d.stage)).length;

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
  }, [deals, selectedOwnerIds, users, wonStage, dynamicStages]);

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

  if (isLoading || stagesLoading) {
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

  const getDealsByStage = (stage: string) => {
    return deals.filter((deal) => deal.stage === stage);
  };

  const handleDragStart = (deal: any) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStage: string) => {
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

  const handleDealClick = async (deal: any) => {
    // Charger le détail complet du deal (avec metaLead)
    setIsSidebarOpen(true);
    setSelectedDeal(deal); // Afficher d'abord les données de base
    setDealDetailData(null); // Réinitialiser les données détaillées
    try {
      const response = await fetch(`/api/deals/${deal.id}`);
      if (response.ok) {
        const fullDeal = await response.json();
        // Stocker metaLead et notes dans un état séparé qui ne sera pas écrasé
        setDealDetailData({
          metaLead: fullDeal.metaLead || null,
          notes: fullDeal.notes || [],
        });
        setSelectedDeal(fullDeal);
      }
    } catch (error) {
      console.error('Erreur chargement détail deal:', error);
    }
  };

  // Mise à jour rapide du stage inline
  const handleInlineStageChange = async (dealId: string, newStage: string, e: React.MouseEvent) => {
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

              {/* Bouton Paramètres Pipeline (admin) */}
              <button
                onClick={() => setIsStageSettingsOpen(true)}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                title="Paramètres du pipeline"
              >
                <Settings className="h-4 w-4" />
              </button>

              {/* Bouton Configuration couleurs */}
              <button
                onClick={() => {
                  setTempThreshold(String(colorThreshold));
                  setTempLowColor(lowColor);
                  setTempHighColor(highColor);
                  setShowColorModal(true);
                }}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                title="Configurer les couleurs par montant"
              >
                <Palette className="h-4 w-4" />
              </button>

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
                        className={`p-4 rounded-lg shadow-sm hover:shadow-md transition cursor-move border border-gray-200 ${getDealColor(deal.value)}`}
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
                            onChange={(e) => handleInlineStageChange(deal.id, e.target.value, e as unknown as React.MouseEvent)}
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full px-2 py-1 rounded text-xs font-medium cursor-pointer border focus:ring-2 focus:ring-violet-500 transition-colors ${getStageColor(deal.stage)}`}
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
                            onChange={(e) => handleInlineStageChange(deal.id, e.target.value, e as unknown as React.MouseEvent)}
                            onClick={(e) => e.stopPropagation()}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-0 focus:ring-2 focus:ring-violet-500 transition-colors ${getStageColor(deal.stage)}`}
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
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {columns.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.title}
                      </option>
                    ))}
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
            deal={{
              ...selectedDeal,
              metaLead: dealDetailData?.metaLead ?? selectedDeal.metaLead,
              notes: dealDetailData?.notes ?? selectedDeal.notes,
            }}
            isOpen={isSidebarOpen}
            onClose={() => {
              setIsSidebarOpen(false);
              setSelectedDeal(null);
              setDealDetailData(null);
            }}
            onUpdate={mutate}
            onDelete={handleDeleteDeal}
          />
        )}

        {/* Modal Paramètres Pipeline */}
        <StageSettingsModal
          isOpen={isStageSettingsOpen}
          onClose={() => setIsStageSettingsOpen(false)}
        />

        {/* Modal configuration couleurs */}
        {showColorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowColorModal(false)}
            />
            <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Palette className="h-5 w-5 text-orange-600" />
                  Configuration des couleurs
                </h3>
                <button
                  onClick={() => setShowColorModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Seuil de montant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seuil de montant (€)
                  </label>
                  <input
                    type="number"
                    value={tempThreshold}
                    onChange={(e) => setTempThreshold(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="3000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Les deals en dessous de ce montant auront la première couleur
                  </p>
                </div>

                {/* Couleur pour petits montants */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur pour montants &lt; {tempThreshold}€
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setTempLowColor(color.id)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          tempLowColor === color.id
                            ? 'border-orange-500 ring-2 ring-orange-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-full h-6 rounded ${color.preview}`} />
                        <span className="text-xs text-gray-600 mt-1 block">{color.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Couleur pour gros montants */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur pour montants &ge; {tempThreshold}€
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setTempHighColor(color.id)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          tempHighColor === color.id
                            ? 'border-orange-500 ring-2 ring-orange-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-full h-6 rounded ${color.preview}`} />
                        <span className="text-xs text-gray-600 mt-1 block">{color.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aperçu */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Aperçu</p>
                  <div className="flex gap-3">
                    <div className={`flex-1 p-3 rounded-lg border-l-4 ${colorOptions.find(c => c.id === tempLowColor)?.border} ${colorOptions.find(c => c.id === tempLowColor)?.bg}`}>
                      <p className="text-sm font-semibold">Deal 2 500€</p>
                      <p className="text-xs text-gray-500">&lt; {tempThreshold}€</p>
                    </div>
                    <div className={`flex-1 p-3 rounded-lg border-l-4 ${colorOptions.find(c => c.id === tempHighColor)?.border} ${colorOptions.find(c => c.id === tempHighColor)?.bg}`}>
                      <p className="text-sm font-semibold">Deal 5 000€</p>
                      <p className="text-xs text-gray-500">&ge; {tempThreshold}€</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowColorModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={saveColorSettings}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
