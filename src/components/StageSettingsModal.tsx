'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  GripVertical,
  Trash2,
  Star,
  Trophy,
  XCircle,
  Save,
  AlertTriangle
} from 'lucide-react';
import Modal from './Modal';
import { useStages, useStageMutations, PipelineStage, CreateStageData, UpdateStageData } from '@/hooks/useStages';

// Couleurs prédéfinies pour le color picker
const PRESET_COLORS = [
  { label: 'Gris', value: 'bg-gray-100 border-gray-300', preview: 'bg-gray-200' },
  { label: 'Bleu', value: 'bg-blue-50 border-blue-300', preview: 'bg-blue-200' },
  { label: 'Jaune', value: 'bg-yellow-50 border-yellow-300', preview: 'bg-yellow-200' },
  { label: 'Violet', value: 'bg-violet-50 border-violet-300', preview: 'bg-violet-200' },
  { label: 'Orange', value: 'bg-orange-50 border-orange-300', preview: 'bg-orange-200' },
  { label: 'Vert', value: 'bg-green-50 border-green-300', preview: 'bg-green-200' },
  { label: 'Rouge', value: 'bg-red-50 border-red-300', preview: 'bg-red-200' },
  { label: 'Rose', value: 'bg-pink-50 border-pink-300', preview: 'bg-pink-200' },
  { label: 'Cyan', value: 'bg-cyan-50 border-cyan-300', preview: 'bg-cyan-200' },
  { label: 'Indigo', value: 'bg-indigo-50 border-indigo-300', preview: 'bg-indigo-200' },
];

interface StageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EditingStage extends PipelineStage {
  isNew?: boolean;
  hasChanges?: boolean;
}

export default function StageSettingsModal({ isOpen, onClose }: StageSettingsModalProps) {
  const { stages, mutate, isLoading } = useStages({ includeInactive: true });
  const { createStage, updateStage, deleteStage, reorderStages, loading: mutationLoading } = useStageMutations();

  const [editingStages, setEditingStages] = useState<EditingStage[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ stage: EditingStage; migrateToId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Synchroniser avec les stages chargés
  useEffect(() => {
    if (stages.length > 0 && isOpen) {
      setEditingStages(stages.map(s => ({ ...s, isNew: false, hasChanges: false })));
    }
  }, [stages, isOpen]);

  // Ajouter un nouveau stage
  const handleAddStage = () => {
    const maxPosition = Math.max(...editingStages.map(s => s.position), 0);
    const newStage: EditingStage = {
      id: `new-${Date.now()}`,
      code: '',
      label: 'Nouveau Stage',
      color: 'bg-gray-100 border-gray-300',
      probability: 50,
      position: maxPosition + 1,
      isDefault: false,
      isWonStage: false,
      isLostStage: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isNew: true,
      hasChanges: true,
    };
    setEditingStages([...editingStages, newStage]);
  };

  // Modifier un stage localement
  const handleUpdateStage = (id: string, updates: Partial<EditingStage>) => {
    setEditingStages(prev =>
      prev.map(s =>
        s.id === id
          ? { ...s, ...updates, hasChanges: !s.isNew }
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
      s.position = i + 1;
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
    } else if (stage.dealsCount && stage.dealsCount > 0) {
      // Demander vers quel stage migrer
      const otherStages = editingStages.filter(s => s.id !== stage.id && !s.isNew);
      setDeleteConfirm({
        stage,
        migrateToId: otherStages[0]?.id || ''
      });
    } else {
      // Supprimer directement si pas de deals
      setDeleteConfirm({ stage, migrateToId: '' });
    }
  };

  // Exécuter la suppression
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setError(null);
      await deleteStage(deleteConfirm.stage.id, deleteConfirm.migrateToId || undefined);
      setEditingStages(prev => prev.filter(s => s.id !== deleteConfirm.stage.id));
      setDeleteConfirm(null);
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  // Sauvegarder toutes les modifications
  const handleSave = async () => {
    try {
      setError(null);
      setSaveSuccess(false);

      // 1. Créer les nouveaux stages
      const newStages = editingStages.filter(s => s.isNew);
      for (const stage of newStages) {
        const newStageData: CreateStageData = {
          label: stage.label,
          color: stage.color,
          probability: stage.probability,
          position: stage.position,
          isDefault: stage.isDefault,
          isWonStage: stage.isWonStage,
          isLostStage: stage.isLostStage,
        };
        await createStage(newStageData);
      }

      // 2. Mettre à jour les stages modifiés
      const modifiedStages = editingStages.filter(s => s.hasChanges && !s.isNew);
      for (const stage of modifiedStages) {
        const updateData: UpdateStageData = {
          label: stage.label,
          color: stage.color,
          probability: stage.probability,
          isDefault: stage.isDefault,
          isWonStage: stage.isWonStage,
          isLostStage: stage.isLostStage,
          isActive: stage.isActive,
        };
        await updateStage(stage.id, updateData);
      }

      // 3. Réordonner si nécessaire
      const stageIds = editingStages.filter(s => !s.isNew).map(s => s.id);
      if (stageIds.length > 0) {
        await reorderStages(stageIds);
      }

      await mutate();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    }
  };

  // Vérifier s'il y a des modifications non sauvegardées
  const hasUnsavedChanges = editingStages.some(s => s.isNew || s.hasChanges);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Paramètres du Pipeline"
      size="lg"
    >
      <div className="space-y-4">
        {/* Header avec bouton Ajouter */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Gérez les étapes de votre pipeline commercial. Glissez-déposez pour réorganiser.
          </p>
          <button
            onClick={handleAddStage}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>

        {/* Messages d'erreur/succès */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}
        {saveSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            Modifications sauvegardées avec succès !
          </div>
        )}

        {/* Liste des stages */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : (
            editingStages.map((stage, index) => (
              <div
                key={stage.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 bg-white border rounded-lg ${
                  draggedIndex === index ? 'border-blue-400 shadow-lg' : 'border-gray-200'
                } ${!stage.isActive ? 'opacity-50' : ''}`}
              >
                {/* Handle de drag */}
                <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Couleur */}
                <div className="relative">
                  <select
                    value={stage.color}
                    onChange={(e) => handleUpdateStage(stage.id, { color: e.target.value })}
                    className={`appearance-none w-8 h-8 rounded-full border-2 ${stage.color} cursor-pointer`}
                    style={{ WebkitAppearance: 'none' }}
                  >
                    {PRESET_COLORS.map(color => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Label */}
                <input
                  type="text"
                  value={stage.label}
                  onChange={(e) => handleUpdateStage(stage.id, { label: e.target.value })}
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom de l'étape"
                />

                {/* Probabilité */}
                <div className="flex items-center gap-2 w-24">
                  <input
                    type="number"
                    value={stage.probability}
                    onChange={(e) => handleUpdateStage(stage.id, { probability: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                    className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={0}
                    max={100}
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>

                {/* Flags */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleUpdateStage(stage.id, { isDefault: !stage.isDefault })}
                    className={`p-1.5 rounded-lg transition-colors ${
                      stage.isDefault
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title="Stage par défaut"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleUpdateStage(stage.id, { isWonStage: !stage.isWonStage })}
                    className={`p-1.5 rounded-lg transition-colors ${
                      stage.isWonStage
                        ? 'bg-green-100 text-green-600'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title="Stage gagné"
                  >
                    <Trophy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleUpdateStage(stage.id, { isLostStage: !stage.isLostStage })}
                    className={`p-1.5 rounded-lg transition-colors ${
                      stage.isLostStage
                        ? 'bg-red-100 text-red-600'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title="Stage perdu"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>

                {/* Deals count + Delete */}
                <div className="flex items-center gap-2">
                  {stage.dealsCount !== undefined && stage.dealsCount > 0 && (
                    <span className="text-xs text-gray-500">
                      {stage.dealsCount} deal{stage.dealsCount > 1 ? 's' : ''}
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteClick(stage)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer avec boutons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" /> Par défaut
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-green-500" /> Gagné
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" /> Perdu
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={mutationLoading || !hasUnsavedChanges}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {mutationLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Supprimer "{deleteConfirm.stage.label}" ?
            </h3>
            {deleteConfirm.stage.dealsCount && deleteConfirm.stage.dealsCount > 0 ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Ce stage contient {deleteConfirm.stage.dealsCount} deal(s).
                  Vers quel stage souhaitez-vous les migrer ?
                </p>
                <select
                  value={deleteConfirm.migrateToId}
                  onChange={(e) => setDeleteConfirm({ ...deleteConfirm, migrateToId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {editingStages
                    .filter(s => s.id !== deleteConfirm.stage.id && !s.isNew)
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))
                  }
                </select>
              </>
            ) : (
              <p className="text-sm text-gray-600 mb-4">
                Cette action est irréversible.
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={mutationLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {mutationLoading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
