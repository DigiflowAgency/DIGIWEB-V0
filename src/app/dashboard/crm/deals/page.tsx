'use client';

import { useDeals } from '@/hooks/useDeals';
import { useState } from 'react';
import Modal from '@/components/Modal';
import { Loader2, Mail, Phone, MapPin, Calendar, Euro, Plus, Settings, ChevronDown, Pencil, Trash2 } from 'lucide-react';
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

  // Trouver le service sélectionné
  const selectedService = services.find(s => s.id === selectedServiceId);

  // Filtrer uniquement les deals qui ont atteint le stage CLOSING
  const closingDeals = deals.filter((deal) => deal.stage === 'CLOSING');

  // Filtrer les deals par service sélectionné
  const filteredDeals = selectedService
    ? closingDeals.filter(deal => deal.productionServiceId === selectedService.id)
    : closingDeals;

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
      // Vue service - filtrer par productionStageId
      return filteredDeals.filter(deal => deal.productionStageId === columnId);
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
      const updateData: any = {};

      if (targetServiceStage !== null) {
        // Déplacement vers un stage de service
        updateData.productionStageId = targetServiceStage;
      } else {
        // Déplacement vers un stage par défaut
        updateData.productionStage = targetStage;
        updateData.productionStageId = null; // Retirer du service
      }

      const response = await fetch(`/api/deals/${selectedDeal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        mutateDeals();
      } else {
        alert('Erreur lors de la mise à jour du stage de production');
      }
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

  // Changer le service d'un deal directement
  const handleChangeService = async (dealId: string, serviceId: string | null, stageId: string | null) => {
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionServiceId: serviceId,
          productionStageId: stageId,
        }),
      });
      if (response.ok) {
        mutateDeals();
      }
    } catch (error) {
      console.error('Erreur changement service:', error);
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
        </div>

        {/* Stats Cards */}
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

        {/* Production Pipeline Kanban */}
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
                    const dealService = services.find(s => s.id === deal.productionServiceId);

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
                          <h4 className="text-sm font-semibold text-gray-900 flex-1 pr-2">
                            {companyName}
                          </h4>
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

                        {/* Service selector sur la card (seulement en vue "Tous") */}
                        {!selectedService && (
                          <div className="mb-3">
                            <select
                              value={deal.productionServiceId || ''}
                              onChange={(e) => {
                                e.stopPropagation();
                                const newServiceId = e.target.value || null;
                                const newService = services.find(s => s.id === newServiceId);
                                const firstStageId = newService?.stages[0]?.id || null;
                                handleChangeService(deal.id, newServiceId, firstStageId);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                            >
                              <option value="">Aucun service</option>
                              {services.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Badge service (si assigné et en vue "Tous") */}
                        {!selectedService && dealService && (
                          <div className="mb-3">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full text-white"
                              style={{ backgroundColor: dealService.color }}
                            >
                              {dealService.name}
                            </span>
                          </div>
                        )}

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
                    Cette page affiche les deals qui ont atteint le stade <strong>CLOSING</strong>.
                    Utilisez les filtres pour afficher un service spécifique ou créez-en un nouveau.
                    Assignez un service à chaque deal via le sélecteur sur la carte.
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
    </div>
  );
}
