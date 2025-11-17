'use client';

import { Plus, Mail, MapPin, Euro, Loader2 } from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';

type DealStage = 'DECOUVERTE' | 'QUALIFICATION' | 'PROPOSITION' | 'NEGOCIATION' | 'GAGNE' | 'PERDU';

const columns: { id: DealStage; title: string; color: string }[] = [
  { id: 'DECOUVERTE', title: 'Découverte', color: 'bg-gray-100 border-gray-300' },
  { id: 'QUALIFICATION', title: 'Qualification', color: 'bg-blue-50 border-blue-300' },
  { id: 'PROPOSITION', title: 'Proposition', color: 'bg-violet-50 border-violet-300' },
  { id: 'NEGOCIATION', title: 'Négociation', color: 'bg-orange-50 border-orange-300' },
  { id: 'GAGNE', title: 'Gagné', color: 'bg-green-50 border-green-300' },
];

const getProbabilityBadge = (probability: number) => {
  if (probability >= 90) return { label: 'TRES_CHAUD', color: 'bg-red-500' };
  if (probability >= 75) return { label: 'CHAUD', color: 'bg-orange-500' };
  if (probability >= 50) return { label: 'TIEDE', color: 'bg-yellow-500' };
  return { label: 'FROID', color: 'bg-blue-500' };
};

export default function CRMPage() {
  const { deals, isLoading, isError } = useDeals();

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
            <button className="btn-primary">
              <Plus className="h-5 w-5 mr-2" />
              Nouveau Lead
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => {
            const columnDeals = getDealsByStage(column.id);
            const totalValue = columnDeals.reduce((sum, deal) => sum + deal.value, 0);

            return (
              <div
                key={column.id}
                className="flex-shrink-0 w-80 bg-gray-50 rounded-xl border-2 border-dashed"
                style={{ borderColor: column.color.split(' ')[1].replace('border-', '') }}
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
                    const contactName = deal.contact
                      ? `${deal.contact.firstName} ${deal.contact.lastName}`
                      : 'Contact non défini';
                    const companyName = deal.company?.name || deal.title;
                    const city = deal.company?.city || '';

                    return (
                      <div
                        key={deal.id}
                        className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer border border-gray-200"
                      >
                        {/* Deal Header */}
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-900 flex-1 pr-2">
                            {companyName}
                          </h4>
                          <span
                            className={`px-2 py-0.5 text-xs font-bold text-white ${badge.color} rounded flex-shrink-0`}
                          >
                            {deal.probability}%
                          </span>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-1.5 mb-3">
                          <p className="text-sm font-medium text-gray-700">{contactName}</p>
                          {deal.contact?.email && (
                            <div className="flex items-center text-xs text-gray-600">
                              <Mail className="h-3.5 w-3.5 mr-1.5" />
                              <span className="truncate">{deal.contact.email}</span>
                            </div>
                          )}
                          {city && (
                            <div className="flex items-center text-xs text-gray-600">
                              <MapPin className="h-3.5 w-3.5 mr-1.5" />
                              <span>{city}</span>
                            </div>
                          )}
                        </div>

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
      </div>
    </div>
  );
}
