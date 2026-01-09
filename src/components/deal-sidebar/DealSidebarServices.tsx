'use client';

import { useState } from 'react';
import { Briefcase, Plus, X, ChevronDown, Loader2 } from 'lucide-react';
import { useProductionServices } from '@/hooks/useProductionServices';
import { useDealServices } from '@/hooks/useDealServices';

interface Props {
  dealId: string;
  onUpdate: () => void;
}

export default function DealSidebarServices({ dealId, onUpdate }: Props) {
  const { services } = useProductionServices();
  const {
    assignments,
    isLoading,
    addService,
    removeService,
    updateServiceStage,
  } = useDealServices(dealId);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Services non encore assignés
  const availableServices = services.filter(
    (s) => !assignments.some((a) => a.serviceId === s.id)
  );

  const handleAddService = async (serviceId: string) => {
    if (!serviceId) return;
    setIsSubmitting(true);
    try {
      await addService(serviceId);
      setIsAdding(false);
      onUpdate();
    } catch (error) {
      console.error('Erreur ajout service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    setIsSubmitting(true);
    try {
      await removeService(serviceId);
      onUpdate();
    } catch (error) {
      console.error('Erreur suppression service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStageChange = async (serviceId: string, stageId: string) => {
    try {
      await updateServiceStage(serviceId, stageId || null);
      onUpdate();
    } catch (error) {
      console.error('Erreur mise à jour stage:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Briefcase className="h-5 w-5 text-violet-600" />
        Services de Production
      </h3>

      <div className="space-y-3">
        {/* Liste des services assignés */}
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              {/* Badge service */}
              <span
                className="px-2.5 py-1 text-xs font-medium text-white rounded-md"
                style={{ backgroundColor: assignment.service.color }}
              >
                {assignment.service.name}
              </span>

              {/* Bouton supprimer */}
              <button
                onClick={() => handleRemoveService(assignment.serviceId)}
                disabled={isSubmitting}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                title="Retirer ce service"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sélecteur de stage */}
            <div className="relative">
              <select
                value={assignment.stageId || ''}
                onChange={(e) =>
                  handleStageChange(assignment.serviceId, e.target.value)
                }
                className="w-full text-sm px-3 py-2 pr-8 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 appearance-none cursor-pointer"
              >
                <option value="">Non démarré</option>
                {assignment.service.stages?.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Badge du stage actuel */}
            {assignment.stage && (
              <div className="mt-2">
                <span
                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded"
                  style={{
                    backgroundColor: assignment.stage.color,
                    color:
                      assignment.stage.color === '#E5E7EB'
                        ? '#374151'
                        : '#FFFFFF',
                  }}
                >
                  {assignment.stage.name}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Aucun service */}
        {assignments.length === 0 && (
          <p className="text-gray-400 text-sm italic py-2">
            Aucun service assigné
          </p>
        )}

        {/* Bouton ajouter un service */}
        {availableServices.length > 0 && (
          <div className="pt-2">
            {isAdding ? (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    onChange={(e) => handleAddService(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full text-sm px-3 py-2 pr-8 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 appearance-none cursor-pointer disabled:opacity-50"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Sélectionner un service...
                    </option>
                    {availableServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                <button
                  onClick={() => setIsAdding(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors w-full"
              >
                <Plus className="h-4 w-4" />
                Ajouter un service
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
