'use client';

import { useDeals } from '@/hooks/useDeals';
import { useState, useMemo } from 'react';
import Modal from '@/components/Modal';
import { Loader2, Mail, Phone, MapPin, Calendar, Euro, Plus, Settings, ChevronDown, Pencil, Trash2, ArrowUp, ArrowDown, AlertCircle, X } from 'lucide-react';
import DealSidebarContainer from '@/components/deal-sidebar/DealSidebarContainer';
import { useProductionServices, ProductionService } from '@/hooks/useProductionServices';
import ProductionServiceModal from '@/components/ProductionServiceModal';
import ProductionStagesModal from '@/components/ProductionStagesModal';

type ProductionStage = 'PREMIER_RDV' | 'EN_PRODUCTION' | 'LIVRE' | 'ENCAISSE';

// Colonnes par défaut pour la vue "Tous"
const defaultProductionColumns: { id: ProductionStage | null; title: string; color: string; description: string }[] = [
  { id: null, title: 'À Démarrer', color: 'bg-gray-100 border-gray-300', description: 'Deals CLOSING sans production' },
  { id: 'PREMIER_RDV', title: 'Premier RDV', color: 'bg-blue-50 border-blue-300', description: 'Premier rendez-vous de production' },
  { id: 'EN_PRODUCTION', title: 'En Production', color: 'bg-violet-50 border-violet-300', description: 'Projet en cours de réalisation' },
  { id: 'LIVRE', title: 'Livré', color: 'bg-orange-50 border-orange-300', description: 'Livraison effectuée, en attente d\'encaissement' },
  { id: 'ENCAISSE', title: 'Encaissé', color: 'bg-green-50 border-green-300', description: 'Paiement reçu - intégré au dashboard' },
];

export default function DealsPage() {
  const { deals, isLoading, isError, mutate: mutateDeals } = useDeals();
  const { services, isLoading: servicesLoading, deleteService } = useProductionServices();

  const [isDragModalOpen, setIsDragModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [targetStage, setTargetStage] = useState<ProductionStage | null>(null);
  const [targetServiceStage, setTargetServiceStage] = useState<string | null>(null);

  // States pour le sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarDeal, setSidebarDeal] = useState<any>(null);
  const [dealDetailData, setDealDetailData] = useState<any>(null);

  // States pour les services
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ProductionService | null>(null);
  const [isStagesModalOpen, setIsStagesModalOpen] = useState(false);
  const [serviceMenuOpen, setServiceMenuOpen] = useState<string | null>(null);
  const [deleteConfirmService, setDeleteConfirmService] = useState<ProductionService | null>(null);

  // States pour le tri de la vue tableau
  const [sortColumn, setSortColumn] = useState<string>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // State pour exclure les deals manuels
  const [excludeManualDeals, setExcludeManualDeals] = useState(false);

  // States pour la modal de création manuelle (BeHype/BeBook)
  const [isManualDealModalOpen, setIsManualDealModalOpen] = useState(false);
  const [isCreatingManualDeal, setIsCreatingManualDeal] = useState(false);
  const [manualDealForm, setManualDealForm] = useState({
    // Contact
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // Entreprise
    companyName: '',
    city: '',
    siret: '',
    website: '',
    instagram: '',
    // Deal
    title: '',
    description: '',
    value: '',
    stage: 'CLOSING',
    expectedCloseDate: '',
    origin: '',
    comments: '',
  });

  // Trouver le service sélectionné
  const selectedService = services.find(s => s.id === selectedServiceId);

  // Filtrer uniquement les deals qui ont atteint le stage CLOSING
  const closingDeals = deals.filter((deal) => {
    // Filtre stage CLOSING
    if (deal.stage !== 'CLOSING') return false;
    // Filtre exclusion deals manuels
    if (excludeManualDeals && deal.isManual) return false;
    return true;
  });

  // Filtrer les deals par service sélectionné (multi-services)
  const filteredDeals = selectedService
    ? closingDeals.filter(deal =>
        deal.deal_service_assignments?.some(a => a.serviceId === selectedService.id)
      )
    : closingDeals;

  // Fonction de tri pour la vue tableau
  const sortedDeals = useMemo(() => {
    return [...closingDeals].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'company':
          comparison = (a.companies?.name || '').localeCompare(b.companies?.name || '');
          break;
        case 'contact':
          const nameA = a.contacts ? `${a.contacts.firstName} ${a.contacts.lastName}` : '';
          const nameB = b.contacts ? `${b.contacts.firstName} ${b.contacts.lastName}` : '';
          comparison = nameA.localeCompare(nameB);
          break;
        case 'city':
          comparison = (a.companies?.city || '').localeCompare(b.companies?.city || '');
          break;
        case 'value':
          comparison = a.value - b.value;
          break;
        case 'stage':
          const stageOrder: Record<string, number> = { 'null': 0, 'PREMIER_RDV': 1, 'EN_PRODUCTION': 2, 'LIVRE': 3, 'ENCAISSE': 4 };
          comparison = (stageOrder[a.productionStage || 'null'] || 0) - (stageOrder[b.productionStage || 'null'] || 0);
          break;
        case 'date':
          const dateA = a.expectedCloseDate ? new Date(a.expectedCloseDate).getTime() : 0;
          const dateB = b.expectedCloseDate ? new Date(b.expectedCloseDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'owner':
          const ownerA = a.users ? `${a.users.firstName} ${a.users.lastName}` : '';
          const ownerB = b.users ? `${b.users.firstName} ${b.users.lastName}` : '';
          comparison = ownerA.localeCompare(ownerB);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [closingDeals, sortColumn, sortOrder]);

  // Composant TableHeader pour les colonnes triables
  const TableHeader = ({ column, label, sortable = true }: { column: string; label: string; sortable?: boolean }) => (
    <th
      onClick={() => {
        if (!sortable) return;
        if (sortColumn === column) {
          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
          setSortColumn(column);
          setSortOrder('desc');
        }
      }}
      className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase ${sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortable && sortColumn === column && (
          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        )}
      </div>
    </th>
  );

  // Fonction pour obtenir le badge de stage
  const getStageBadge = (stage: ProductionStage | null | undefined) => {
    const stageConfig: Record<string, { label: string; classes: string }> = {
      'null': { label: 'A Démarrer', classes: 'bg-gray-100 text-gray-700' },
      'PREMIER_RDV': { label: 'Premier RDV', classes: 'bg-blue-100 text-blue-700' },
      'EN_PRODUCTION': { label: 'En Production', classes: 'bg-violet-100 text-violet-700' },
      'LIVRE': { label: 'Livré', classes: 'bg-orange-100 text-orange-700' },
      'ENCAISSE': { label: 'Encaissé', classes: 'bg-green-100 text-green-700' },
    };
    const config = stageConfig[stage || 'null'];
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.classes}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading || servicesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
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

  // Obtenir les colonnes à afficher
  const getColumns = () => {
    if (selectedService && selectedService.stages.length > 0) {
      return selectedService.stages.map(stage => ({
        id: stage.id,
        title: stage.name,
        color: `border-2`,
        bgColor: stage.color,
        description: stage.description || '',
        isServiceStage: true,
      }));
    }
    return defaultProductionColumns.map(col => ({
      ...col,
      bgColor: undefined,
      isServiceStage: false,
    }));
  };

  const columns = getColumns();

  const getDealsByColumn = (columnId: string | ProductionStage | null) => {
    if (selectedService) {
      // Vue service - filtrer par stageId de l'assignation du service
      return filteredDeals.filter(deal => {
        const assignment = deal.deal_service_assignments?.find(
          a => a.serviceId === selectedService.id
        );
        return assignment?.stageId === columnId;
      });
    }
    // Vue "Tous" - filtrer par productionStage classique
    return closingDeals.filter(deal => deal.productionStage === columnId);
  };

  // Handler pour ouvrir le sidebar au clic sur une card
  const handleDealClick = async (deal: any) => {
    setIsSidebarOpen(true);
    setSidebarDeal(deal);
    setDealDetailData(null);

    try {
      const response = await fetch(`/api/deals/${deal.id}`);
      if (response.ok) {
        const fullDeal = await response.json();
        setDealDetailData({
          metaLead: fullDeal.metaLead || null,
          notes: fullDeal.notes || [],
        });
        setSidebarDeal(fullDeal);
      }
    } catch (error) {
      console.error('Erreur chargement détail deal:', error);
    }
  };

  // Handler pour supprimer un deal
  const handleDeleteDeal = async (dealId: string) => {
    const response = await fetch(`/api/deals/${dealId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Erreur suppression');
    mutateDeals();
  };

  const handleDragStart = (deal: any) => {
    setSelectedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (columnId: string | ProductionStage | null, isServiceStage: boolean) => {
    if (!selectedDeal) return;

    if (isServiceStage) {
      setTargetServiceStage(columnId as string);
      setTargetStage(null);
    } else {
      setTargetStage(columnId as ProductionStage | null);
      setTargetServiceStage(null);
    }
    setIsDragModalOpen(true);
  };

  const confirmStageChange = async () => {
    if (!selectedDeal) return;

    try {
      if (targetServiceStage !== null && selectedService) {
        // Déplacement vers un stage de service - utiliser l'API des services
        const response = await fetch(`/api/deals/${selectedDeal.id}/services`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: selectedService.id,
            stageId: targetServiceStage,
          }),
        });

        if (!response.ok) {
          throw new Error('Erreur mise à jour stage service');
        }
      } else {
        // Déplacement vers un stage par défaut (vue "Tous")
        const response = await fetch(`/api/deals/${selectedDeal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productionStage: targetStage,
          }),
        });

        if (!response.ok) {
          throw new Error('Erreur mise à jour stage par défaut');
        }
      }

      mutateDeals();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setIsDragModalOpen(false);
      setSelectedDeal(null);
      setTargetStage(null);
      setTargetServiceStage(null);
    }
  };

  // Supprimer un service
  const handleDeleteService = async () => {
    if (!deleteConfirmService) return;
    try {
      await deleteService(deleteConfirmService.id);
      if (selectedServiceId === deleteConfirmService.id) {
        setSelectedServiceId(null);
      }
      setDeleteConfirmService(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    }
  };

  // Nom de la colonne cible pour la modal
  const getTargetColumnName = () => {
    if (targetServiceStage && selectedService) {
      const stage = selectedService.stages.find(s => s.id === targetServiceStage);
      return stage?.name || 'Colonne';
    }
    return defaultProductionColumns.find(c => c.id === targetStage)?.title || 'À Démarrer';
  };

  // Reset du formulaire de deal manuel
  const resetManualDealForm = () => {
    setManualDealForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      companyName: '',
      city: '',
      siret: '',
      website: '',
      instagram: '',
      title: '',
      description: '',
      value: '',
      stage: 'CLOSING',
      expectedCloseDate: '',
      origin: '',
      comments: '',
    });
  };

  // Handler création deal manuel
  const handleCreateManualDeal = async () => {
    if (!manualDealForm.firstName || !manualDealForm.lastName || !manualDealForm.value) {
      alert('Veuillez remplir les champs obligatoires (Prénom, Nom, Valeur)');
      return;
    }

    setIsCreatingManualDeal(true);
    try {
      const response = await fetch('/api/crm/create-unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Contact
          firstName: manualDealForm.firstName,
          lastName: manualDealForm.lastName,
          email: manualDealForm.email || null,
          phone: manualDealForm.phone || null,
          // Entreprise
          companyName: manualDealForm.companyName || null,
          city: manualDealForm.city || null,
          siret: manualDealForm.siret || null,
          website: manualDealForm.website || null,
          instagram: manualDealForm.instagram || null,
          // Deal
          title: manualDealForm.title || manualDealForm.companyName || `${manualDealForm.firstName} ${manualDealForm.lastName}`,
          description: manualDealForm.description || null,
          value: parseFloat(manualDealForm.value) || 0,
          stage: manualDealForm.stage || 'CLOSING',
          expectedCloseDate: manualDealForm.expectedCloseDate || null,
          origin: manualDealForm.origin || null,
          comments: manualDealForm.comments || null,
          // Marqueur manuel
          isManual: true,
          // Assigner au service sélectionné
          serviceId: selectedService?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur création');
      }

      // Forcer le rechargement des données AVANT de fermer la modal
      await mutateDeals();
      // Puis reset et fermer
      resetManualDealForm();
      setIsManualDealModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la création du deal');
    } finally {
      setIsCreatingManualDeal(false);
    }
  };

  // Vérifier si le service sélectionné est BeHype ou BeBook
  const isManualDealAllowed = selectedService &&
    ['behype', 'bebook'].includes(selectedService.name.toLowerCase());

  return (
    <div className="min-h-screen gradient-mesh py-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 to-orange-500 bg-clip-text text-transparent">
                Deals en Production
              </h1>
              <p className="mt-2 text-gray-600">
                {selectedService
                  ? `Service: ${selectedService.name} - ${filteredDeals.length} deal(s)`
                  : `Suivi des deals CLOSING - Du premier RDV à l'encaissement`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {selectedService ? 'Deals dans ce service' : 'Total Deals CLOSING'}
              </p>
              <p className="text-3xl font-bold text-violet-700">
                {selectedService ? filteredDeals.length : closingDeals.length}
              </p>
            </div>
          </div>
        </div>

        {/* Filtres par service */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Filtrer par service:</span>

          {/* Bouton "Tous" */}
          <button
            onClick={() => setSelectedServiceId(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !selectedServiceId
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Tous
          </button>

          {/* Boutons des services */}
          {services.map(service => (
            <div key={service.id} className="relative">
              <button
                onClick={() => setSelectedServiceId(service.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedServiceId === service.id
                    ? 'text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: selectedServiceId === service.id ? service.color : undefined,
                }}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: service.color }}
                />
                {service.name}
                {service._count && service._count.deals > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    selectedServiceId === service.id
                      ? 'bg-white/20'
                      : 'bg-gray-100'
                  }`}>
                    {service._count.deals}
                  </span>
                )}
              </button>

              {/* Menu contextuel pour modifier/supprimer */}
              {selectedServiceId === service.id && (
                <div className="absolute right-0 top-full mt-1 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setServiceMenuOpen(serviceMenuOpen === service.id ? null : service.id);
                    }}
                    className="p-1 hover:bg-white/20 rounded"
                  >
                    <ChevronDown className="h-4 w-4 text-white" />
                  </button>
                  {serviceMenuOpen === service.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                      <button
                        onClick={() => {
                          setEditingService(service);
                          setIsServiceModalOpen(true);
                          setServiceMenuOpen(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        Modifier
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirmService(service);
                          setServiceMenuOpen(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Bouton Nouveau Service */}
          <button
            onClick={() => {
              setEditingService(null);
              setIsServiceModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouveau service
          </button>

          {/* Bouton Gérer colonnes (si service sélectionné) */}
          {selectedService && (
            <button
              onClick={() => setIsStagesModalOpen(true)}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Gérer colonnes
            </button>
          )}

          {/* Bouton création manuelle - visible seulement pour BeHype/BeBook */}
          {isManualDealAllowed && (
            <button
              onClick={() => setIsManualDealModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-green-600 transition-all flex items-center gap-2 shadow-md"
            >
              <Plus className="h-4 w-4" />
              Créer deal manuel
            </button>
          )}

          {/* Séparateur */}
          <div className="h-8 w-px bg-gray-300 mx-2" />

          {/* Toggle pour exclure les deals manuels */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                checked={excludeManualDeals}
                onChange={(e) => setExcludeManualDeals(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-10 h-5 rounded-full transition-colors ${excludeManualDeals ? 'bg-violet-600' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${excludeManualDeals ? 'translate-x-5' : ''}`} />
              </div>
            </div>
            <span className="text-sm text-gray-700">Exclure les deals manuels</span>
          </label>
        </div>

        {/* Stats Cards */}
        {!selectedServiceId ? (
          /* Stats pour vue "Tous" - résumé par stage de production */
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {defaultProductionColumns.map((column) => {
              const columnDeals = closingDeals.filter(deal => deal.productionStage === column.id);
              const totalValue = columnDeals.reduce((sum, deal) => sum + deal.value, 0);
              const stageColors: Record<string, string> = {
                'null': 'border-l-gray-400',
                'PREMIER_RDV': 'border-l-blue-500',
                'EN_PRODUCTION': 'border-l-violet-500',
                'LIVRE': 'border-l-orange-500',
                'ENCAISSE': 'border-l-green-500',
              };

              return (
                <div
                  key={column.id || 'null'}
                  className={`bg-white rounded-lg border-2 border-gray-200 border-l-4 ${stageColors[column.id || 'null']} p-4`}
                >
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">{column.title}</h3>
                  <p className="text-2xl font-bold text-violet-700 mb-1">{columnDeals.length}</p>
                  <p className="text-xs text-gray-500">{totalValue.toLocaleString()} €</p>
                </div>
              );
            })}
          </div>
        ) : (
          /* Stats pour vue service */
          <div className={`grid gap-4 mb-8`} style={{ gridTemplateColumns: `repeat(${Math.min(columns.length, 5)}, 1fr)` }}>
            {columns.slice(0, 5).map((column) => {
              const columnDeals = getDealsByColumn(column.id);
              const totalValue = columnDeals.reduce((sum, deal) => sum + deal.value, 0);

              return (
                <div
                  key={column.id || 'null'}
                  className="bg-white rounded-lg border-2 border-gray-200 p-4"
                  style={column.bgColor ? { borderLeftColor: column.bgColor, borderLeftWidth: '4px' } : undefined}
                >
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">{column.title}</h3>
                  <p className="text-2xl font-bold text-violet-700 mb-1">{columnDeals.length}</p>
                  <p className="text-xs text-gray-500">{totalValue.toLocaleString()} €</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Vue conditionnelle : Tableau (Tous) ou Kanban (Service) */}
        {!selectedServiceId ? (
          /* Vue Tableau pour "Tous" */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <TableHeader column="company" label="Entreprise" />
                    <TableHeader column="contact" label="Contact" />
                    <TableHeader column="city" label="Ville" />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Services</th>
                    <TableHeader column="stage" label="Stage" />
                    <TableHeader column="value" label="Montant" />
                    <TableHeader column="date" label="Date" />
                    <TableHeader column="owner" label="Commercial" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedDeals.map((deal) => {
                    const contactName = deal.contacts
                      ? `${deal.contacts.firstName} ${deal.contacts.lastName}`
                      : 'Contact non défini';
                    const companyName = deal.companies?.name || deal.title;
                    const city = deal.companies?.city || '';
                    const ownerName = deal.users ? `${deal.users.firstName} ${deal.users.lastName}` : '-';

                    return (
                      <tr
                        key={deal.id}
                        onClick={() => handleDealClick(deal)}
                        className="hover:bg-violet-50 cursor-pointer transition-colors"
                      >
                        {/* Entreprise */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">{companyName}</span>
                            {deal.isManual && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">
                                Manuel
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{contactName}</div>
                          {deal.contacts?.email && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">{deal.contacts.email}</span>
                            </div>
                          )}
                          {deal.contacts?.phone && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{deal.contacts.phone}</span>
                            </div>
                          )}
                        </td>

                        {/* Ville */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-gray-600">{city || '-'}</span>
                        </td>

                        {/* Services */}
                        <td className="px-4 py-3">
                          {deal.deal_service_assignments && deal.deal_service_assignments.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {deal.deal_service_assignments.map(assignment => (
                                <span
                                  key={assignment.id}
                                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full text-white"
                                  style={{ backgroundColor: assignment.service.color }}
                                  title={assignment.stage ? `${assignment.service.name} - ${assignment.stage.name}` : assignment.service.name}
                                >
                                  {assignment.service.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">-</span>
                          )}
                        </td>

                        {/* Stage */}
                        <td className="px-4 py-3">
                          {getStageBadge(deal.productionStage)}
                        </td>

                        {/* Montant */}
                        <td className="px-4 py-3">
                          <div className="flex items-center text-sm font-bold text-violet-700">
                            <Euro className="h-4 w-4 mr-1" />
                            <span>{deal.value.toLocaleString()}</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3">
                          {deal.expectedCloseDate ? (
                            <span className="text-sm text-gray-600">
                              {new Date(deal.expectedCloseDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>

                        {/* Commercial */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-gray-600">{ownerName}</span>
                        </td>
                      </tr>
                    );
                  })}

                  {sortedDeals.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                        Aucun deal en production
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Vue Kanban pour les services sélectionnés */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((column) => {
              const columnDeals = getDealsByColumn(column.id);
              const totalValue = columnDeals.reduce((sum, deal) => sum + deal.value, 0);

              return (
                <div
                  key={column.id || 'null'}
                  className="flex-shrink-0 w-80 bg-gray-50 rounded-xl border-2 border-dashed"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column.id, column.isServiceStage)}
                >
                  {/* Column Header */}
                  <div
                    className={`px-4 py-3 rounded-t-xl ${column.bgColor ? '' : column.color}`}
                    style={column.bgColor ? { backgroundColor: column.bgColor } : undefined}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{column.title}</h3>
                        {column.description && (
                          <p className="text-xs text-gray-600">{column.description}</p>
                        )}
                      </div>
                      <span className="px-2 py-1 text-xs font-bold bg-white rounded-full">
                        {columnDeals.length}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      {totalValue.toLocaleString()} €
                    </p>
                  </div>

                  {/* Column Content */}
                  <div className="p-3 space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                    {columnDeals.map((deal) => {
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
                          className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer border border-gray-200"
                        >
                          {/* Deal Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 pr-2">
                              <h4 className="text-sm font-semibold text-gray-900">
                                {companyName}
                              </h4>
                              {deal.isManual && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">
                                  Manuel
                                </span>
                              )}
                            </div>
                            <span className="px-2 py-0.5 text-xs font-bold text-white bg-violet-600 rounded flex-shrink-0">
                              {deal.probability}%
                            </span>
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

                          {/* Expected Close Date */}
                          {deal.expectedCloseDate && (
                            <div className="flex items-center text-xs text-gray-500 mb-3">
                              <Calendar className="h-3.5 w-3.5 mr-1.5" />
                              <span>
                                Clôture prévue: {new Date(deal.expectedCloseDate).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          )}

                          {/* Value */}
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

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">i</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Workflow de Production
              </h3>
              <p className="text-sm text-blue-700">
                {selectedService ? (
                  <>
                    Vous visualisez les deals du service <strong>{selectedService.name}</strong>.
                    Utilisez le bouton <strong>Gérer colonnes</strong> pour ajouter ou modifier les étapes.
                    Glissez-déposez les cartes pour changer leur statut.
                  </>
                ) : (
                  <>
                    Vue tableau de tous les deals en <strong>CLOSING</strong>.
                    Cliquez sur les en-têtes de colonnes pour trier.
                    Cliquez sur une ligne pour voir les détails du deal.
                    Sélectionnez un service pour afficher la vue Kanban.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmation de déplacement */}
      <Modal
        isOpen={isDragModalOpen}
        onClose={() => {
          setIsDragModalOpen(false);
          setSelectedDeal(null);
          setTargetStage(null);
          setTargetServiceStage(null);
        }}
        title="Confirmer le changement de stage"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Voulez-vous déplacer le deal <strong>{selectedDeal?.companies?.name || selectedDeal?.title}</strong> vers le stage{' '}
            <strong>{getTargetColumnName()}</strong> ?
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsDragModalOpen(false);
                setSelectedDeal(null);
                setTargetStage(null);
                setTargetServiceStage(null);
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={confirmStageChange}
              className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-semibold"
            >
              Confirmer
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmation suppression service */}
      {deleteConfirmService && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmService(null)}
          title="Supprimer le service"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Voulez-vous vraiment supprimer le service <strong>{deleteConfirmService.name}</strong> ?
            </p>
            {deleteConfirmService._count && deleteConfirmService._count.deals > 0 && (
              <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                Ce service contient {deleteConfirmService._count.deals} deal(s). Vous devez d&apos;abord les réassigner.
              </p>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setDeleteConfirmService(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteService}
                disabled={deleteConfirmService._count && deleteConfirmService._count.deals > 0}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Supprimer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal création/édition service */}
      <ProductionServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          setEditingService(null);
        }}
        service={editingService}
      />

      {/* Modal gestion colonnes */}
      {selectedService && (
        <ProductionStagesModal
          isOpen={isStagesModalOpen}
          onClose={() => setIsStagesModalOpen(false)}
          service={selectedService}
        />
      )}

      {/* Deal Sidebar */}
      {sidebarDeal && (
        <DealSidebarContainer
          deal={{
            ...sidebarDeal,
            metaLead: dealDetailData?.metaLead ?? sidebarDeal.metaLead,
            notes: dealDetailData?.notes ?? sidebarDeal.notes,
          }}
          isOpen={isSidebarOpen}
          onClose={() => {
            setIsSidebarOpen(false);
            setSidebarDeal(null);
            setDealDetailData(null);
          }}
          onUpdate={() => mutateDeals()}
          onDelete={handleDeleteDeal}
          showNotesTab={true}
        />
      )}

      {/* Modal création deal manuel (BeHype/BeBook) */}
      <Modal
        isOpen={isManualDealModalOpen}
        onClose={() => {
          setIsManualDealModalOpen(false);
          resetManualDealForm();
        }}
        title={`Créer un deal manuel - ${selectedService?.name || 'Service'}`}
        size="lg"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Avertissement */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <span className="text-sm text-amber-700">
              Ce deal sera marqué comme &quot;créé manuellement&quot; et pourra être exclu des statistiques automatiques.
            </span>
          </div>

          {/* Section Contact */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-xs">1</span>
              Contact
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualDealForm.firstName}
                  onChange={(e) => setManualDealForm({ ...manualDealForm, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualDealForm.lastName}
                  onChange={(e) => setManualDealForm({ ...manualDealForm, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={manualDealForm.email}
                  onChange={(e) => setManualDealForm({ ...manualDealForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="jean@exemple.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={manualDealForm.phone}
                  onChange={(e) => setManualDealForm({ ...manualDealForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>
          </div>

          {/* Section Entreprise */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-xs">2</span>
              Entreprise
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;entreprise</label>
                <input
                  type="text"
                  value={manualDealForm.companyName}
                  onChange={(e) => setManualDealForm({ ...manualDealForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="Entreprise SAS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={manualDealForm.city}
                  onChange={(e) => setManualDealForm({ ...manualDealForm, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="Paris"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SIREN/SIRET</label>
                <input
                  type="text"
                  value={manualDealForm.siret}
                  onChange={(e) => setManualDealForm({ ...manualDealForm, siret: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="123 456 789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Web</label>
                <input
                  type="url"
                  value={manualDealForm.website}
                  onChange={(e) => setManualDealForm({ ...manualDealForm, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="https://exemple.com"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                <input
                  type="text"
                  value={manualDealForm.instagram}
                  onChange={(e) => setManualDealForm({ ...manualDealForm, instagram: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="@entreprise"
                />
              </div>
            </div>
          </div>

          {/* Section Deal */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-xs">3</span>
              Opportunité
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre du deal</label>
                <input
                  type="text"
                  value={manualDealForm.title}
                  onChange={(e) => setManualDealForm({ ...manualDealForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="Auto-généré depuis le nom de l'entreprise si vide"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={manualDealForm.description}
                  onChange={(e) => setManualDealForm({ ...manualDealForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  rows={2}
                  placeholder="Description du projet..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valeur (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={manualDealForm.value}
                  onChange={(e) => setManualDealForm({ ...manualDealForm, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="1500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select
                  value={manualDealForm.stage}
                  onChange={(e) => setManualDealForm({ ...manualDealForm, stage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="A_CONTACTER">À Contacter</option>
                  <option value="EN_DISCUSSION">En Discussion</option>
                  <option value="A_RELANCER">À Relancer</option>
                  <option value="RDV_PRIS">RDV Pris</option>
                  <option value="NEGO_HOT">Négo Hot</option>
                  <option value="CLOSING">Closing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origine</label>
                <select
                  value={manualDealForm.origin}
                  onChange={(e) => setManualDealForm({ ...manualDealForm, origin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="SITE_WEB">Site Web</option>
                  <option value="ADS">Publicités</option>
                  <option value="DM_INSTA">DM Instagram</option>
                  <option value="BOUCHE_A_OREILLE">Bouche à oreille</option>
                  <option value="PARTENAIRE">Partenaire</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de clôture prévue</label>
                <input
                  type="date"
                  value={manualDealForm.expectedCloseDate}
                  onChange={(e) => setManualDealForm({ ...manualDealForm, expectedCloseDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaires</label>
                <textarea
                  value={manualDealForm.comments}
                  onChange={(e) => setManualDealForm({ ...manualDealForm, comments: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  rows={3}
                  placeholder="Notes additionnelles..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsManualDealModalOpen(false);
                resetManualDealForm();
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={isCreatingManualDeal}
            >
              Annuler
            </button>
            <button
              onClick={handleCreateManualDeal}
              disabled={isCreatingManualDeal || !manualDealForm.firstName || !manualDealForm.lastName || !manualDealForm.value}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreatingManualDeal ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le deal'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
