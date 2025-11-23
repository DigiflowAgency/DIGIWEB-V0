'use client';

import { useDeals } from '@/hooks/useDeals';
import { useState } from 'react';
import Modal from '@/components/Modal';
import { Loader2, Mail, Phone, MapPin, Calendar, Euro } from 'lucide-react';

type ProductionStage = 'PREMIER_RDV' | 'EN_PRODUCTION' | 'LIVRE' | 'ENCAISSE';

const productionColumns: { id: ProductionStage | null; title: string; color: string; description: string }[] = [
  { id: null, title: 'À Démarrer', color: 'bg-gray-100 border-gray-300', description: 'Deals CLOSING sans production' },
  { id: 'PREMIER_RDV', title: 'Premier RDV', color: 'bg-blue-50 border-blue-300', description: 'Premier rendez-vous de production' },
  { id: 'EN_PRODUCTION', title: 'En Production', color: 'bg-violet-50 border-violet-300', description: 'Projet en cours de réalisation' },
  { id: 'LIVRE', title: 'Livré', color: 'bg-orange-50 border-orange-300', description: 'Livraison effectuée, en attente d\'encaissement' },
  { id: 'ENCAISSE', title: 'Encaissé', color: 'bg-green-50 border-green-300', description: 'Paiement reçu - intégré au dashboard' },
];

export default function DealsPage() {
  const { deals, isLoading, isError } = useDeals();
  const [isDragModalOpen, setIsDragModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [targetStage, setTargetStage] = useState<ProductionStage | null>(null);

  // Filtrer uniquement les deals qui ont atteint le stage CLOSING
  const closingDeals = deals.filter((deal) => deal.stage === 'CLOSING');

  if (isLoading) {
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

  const getDealsByProductionStage = (stage: ProductionStage | null) => {
    return closingDeals.filter((deal) => deal.productionStage === stage);
  };

  const handleDragStart = (deal: any) => {
    setSelectedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stage: ProductionStage | null) => {
    if (!selectedDeal) return;

    setTargetStage(stage);
    setIsDragModalOpen(true);
  };

  const confirmStageChange = async () => {
    if (!selectedDeal || targetStage === undefined) return;

    try {
      const response = await fetch(`/api/deals/${selectedDeal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productionStage: targetStage }),
      });

      if (response.ok) {
        window.location.reload();
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
                Deals en Production
              </h1>
              <p className="mt-2 text-gray-600">
                Suivi des deals CLOSING - Du premier RDV à l'encaissement
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Deals CLOSING</p>
              <p className="text-3xl font-bold text-violet-700">{closingDeals.length}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {productionColumns.map((column) => {
            const columnDeals = getDealsByProductionStage(column.id);
            const totalValue = columnDeals.reduce((sum, deal) => sum + deal.value, 0);

            return (
              <div key={column.id || 'null'} className="bg-white rounded-lg border-2 border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">{column.title}</h3>
                <p className="text-2xl font-bold text-violet-700 mb-1">{columnDeals.length}</p>
                <p className="text-xs text-gray-500">{totalValue.toLocaleString()} €</p>
              </div>
            );
          })}
        </div>

        {/* Production Pipeline Kanban */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {productionColumns.map((column) => {
            const columnDeals = getDealsByProductionStage(column.id);
            const totalValue = columnDeals.reduce((sum, deal) => sum + deal.value, 0);

            return (
              <div
                key={column.id || 'null'}
                className="flex-shrink-0 w-80 bg-gray-50 rounded-xl border-2 border-dashed"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
              >
                {/* Column Header */}
                <div className={`px-4 py-3 rounded-t-xl ${column.color}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{column.title}</h3>
                      <p className="text-xs text-gray-600">{column.description}</p>
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
                        className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition cursor-move border border-gray-200"
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
                Cette page affiche uniquement les deals qui ont atteint le stade <strong>CLOSING</strong>.
                Glissez-déposez les cartes pour mettre à jour le statut de production.
                Les deals <strong>ENCAISSÉS</strong> sont automatiquement intégrés au dashboard principal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      <Modal
        isOpen={isDragModalOpen}
        onClose={() => {
          setIsDragModalOpen(false);
          setSelectedDeal(null);
          setTargetStage(null);
        }}
        title="Confirmer le changement de stage"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Voulez-vous déplacer le deal <strong>{selectedDeal?.company?.name || selectedDeal?.title}</strong> vers le stage{' '}
            <strong>
              {productionColumns.find((c) => c.id === targetStage)?.title || 'À Démarrer'}
            </strong> ?
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsDragModalOpen(false);
                setSelectedDeal(null);
                setTargetStage(null);
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
    </div>
  );
}
