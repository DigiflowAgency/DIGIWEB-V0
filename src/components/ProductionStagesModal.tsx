'use client';

import { useState, useEffect } from 'react';
import { Plus, GripVertical, Trash2, Save, AlertTriangle, Pencil, Check, X } from 'lucide-react';
import Modal from './Modal';
import { ProductionService, ProductionServiceStage, useProductionServices } from '@/hooks/useProductionServices';

// Couleurs prédéfinies pour les stages
const STAGE_COLORS = [
  { label: 'Gris', value: '#E5E7EB' },
  { label: 'Bleu', value: '#BFDBFE' },
  { label: 'Vert', value: '#BBF7D0' },
  { label: 'Jaune', value: '#FEF08A' },
  { label: 'Orange', value: '#FED7AA' },
  { label: 'Rouge', value: '#FECACA' },
  { label: 'Rose', value: '#FBCFE8' },
  { label: 'Violet', value: '#DDD6FE' },
  { label: 'Cyan', value: '#A5F3FC' },
  { label: 'Indigo', value: '#C7D2FE' },
];

interface EditingStage extends ProductionServiceStage {
  isNew?: boolean;
  hasChanges?: boolean;
  isEditing?: boolean;
}

interface ProductionStagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ProductionService;
}

export default function ProductionStagesModal({
  isOpen,
  onClose,
  service,
}: ProductionStagesModalProps) {
  const { createStage, updateStage, deleteStage, reorderStages, mutate } = useProductionServices();

  const [editingStages, setEditingStages] = useState<EditingStage[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<EditingStage | null>(null);

  // Synchroniser avec les stages du service
  useEffect(() => {
    if (isOpen && service) {
      setEditingStages(
        service.stages.map(s => ({
          ...s,
          isNew: false,
          hasChanges: false,
          isEditing: false,
        }))
      );
      setError(null);
      setSaveSuccess(false);
    }
  }, [isOpen, service]);

  // Ajouter un nouveau stage
  const handleAddStage = () => {
    const maxPosition = editingStages.length > 0
      ? Math.max(...editingStages.map(s => s.position))
      : -1;

    const newStage: EditingStage = {
      id: `new-${Date.now()}`,
      serviceId: service.id,
      name: 'Nouvelle étape',
      color: '#E5E7EB',
      position: maxPosition + 1,
      createdAt: new Date().toISOString(),
      isNew: true,
      hasChanges: true,
      isEditing: true,
    };
    setEditingStages([...editingStages, newStage]);
  };

  // Basculer le mode édition
  const toggleEditing = (id: string) => {
    setEditingStages(prev =>
      prev.map(s =>
        s.id === id ? { ...s, isEditing: !s.isEditing } : s
      )
    );
  };

  // Modifier un stage localement
  const handleUpdateStage = (id: string, updates: Partial<EditingStage>) => {
    setEditingStages(prev =>
      prev.map(s =>
        s.id === id
          ? { ...s, ...updates, hasChanges: !s.isNew ? true : s.hasChanges }
          : s
      )
    );
  };

  // Gestion du drag and drop
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newStages = [...editingStages];
    const draggedStage = newStages[draggedIndex];
    newStages.splice(draggedIndex, 1);
    newStages.splice(index, 0, draggedStage);

    // Mettre à jour les positions
    newStages.forEach((s, i) => {
      s.position = i;
      if (!s.isNew) s.hasChanges = true;
    });

    setEditingStages(newStages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Confirmer la suppression
  const handleDeleteClick = (stage: EditingStage) => {
    if (stage.isNew) {
      // Supprimer directement si c'est un nouveau stage
      setEditingStages(prev => prev.filter(s => s.id !== stage.id));
    } else {
      setDeleteConfirm(stage);
    }
  };

  // Exécuter la suppression
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    setIsSubmitting(true);
    try {
      setError(null);
      await deleteStage(service.id, deleteConfirm.id);
      setEditingStages(prev => prev.filter(s => s.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sauvegarder toutes les modifications
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      setError(null);
      setSaveSuccess(false);

      // 1. Créer les nouveaux stages
      const newStages = editingStages.filter(s => s.isNew);
      for (const stage of newStages) {
        if (!stage.name.trim()) continue;
        await createStage(service.id, {
          name: stage.name,
          color: stage.color,
        });
      }

      // 2. Mettre à jour les stages modifiés
      const modifiedStages = editingStages.filter(s => s.hasChanges && !s.isNew);
      for (const stage of modifiedStages) {
        await updateStage(service.id, stage.id, {
          name: stage.name,
          color: stage.color,
          position: stage.position,
        });
      }

      // 3. Réordonner si nécessaire
      const existingStageIds = editingStages.filter(s => !s.isNew).map(s => s.id);
      if (existingStageIds.length > 0) {
        await reorderStages(service.id, existingStageIds);
      }

      await mutate();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Réinitialiser les flags
      setEditingStages(prev =>
        prev.map(s => ({
          ...s,
          isNew: false,
          hasChanges: false,
          isEditing: false,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vérifier s'il y a des modifications non sauvegardées
  const hasUnsavedChanges = editingStages.some(s => s.isNew || s.hasChanges);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Gérer les colonnes - ${service.name}`}
      size="md"
    >
      <div className="space-y-4">
        {/* Header avec bouton Ajouter */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Glissez-déposez pour réorganiser les colonnes.
          </p>
          <button
            onClick={handleAddStage}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>

        {/* Messages d'erreur/succès */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {saveSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            Modifications sauvegardées avec succès !
          </div>
        )}

        {/* Liste des stages */}
        <div className="space-y-2 max-h-[350px] overflow-y-auto">
          {editingStages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune colonne. Ajoutez-en une pour commencer.
            </div>
          ) : (
            editingStages.map((stage, index) => (
              <div
                key={stage.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 bg-white border rounded-lg transition-all ${
                  draggedIndex === index ? 'border-violet-400 shadow-lg' : 'border-gray-200'
                } ${stage.isNew ? 'bg-violet-50' : ''}`}
              >
                {/* Handle de drag */}
                <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Couleur */}
                <div className="relative group">
                  <div
                    className="w-6 h-6 rounded-full border border-gray-300 cursor-pointer"
                    style={{ backgroundColor: stage.color }}
                  />
                  <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex flex-wrap gap-1 w-32">
                      {STAGE_COLORS.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => handleUpdateStage(stage.id, { color: c.value })}
                          className={`w-5 h-5 rounded-full border ${
                            stage.color === c.value ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Nom */}
                {stage.isEditing ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={stage.name}
                      onChange={(e) => handleUpdateStage(stage.id, { name: e.target.value })}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-violet-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') toggleEditing(stage.id);
                      }}
                    />
                    <button
                      onClick={() => toggleEditing(stage.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{stage.name}</span>
                    {stage.isNew && (
                      <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded">
                        Nouveau
                      </span>
                    )}
                    <button
                      onClick={() => toggleEditing(stage.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Delete */}
                <button
                  onClick={() => handleDeleteClick(stage)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer avec boutons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Fermer
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting || !hasUnsavedChanges}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Supprimer &quot;{deleteConfirm.name}&quot; ?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Cette action est irréversible. Les deals utilisant cette colonne devront être réassignés.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
