'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useEpics, useEpicMutations } from '@/hooks/projects/useEpics';
import EpicCard from '@/components/projects/epics/EpicCard';
import Modal from '@/components/Modal';
import { Loader2, Plus, Target, AlertCircle } from 'lucide-react';
import { EPIC_COLORS, EPIC_STATUSES } from '@/lib/projects/constants';
import type { Epic, EpicStatus } from '@/types/projects';

export default function EpicsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const { epics, isLoading, mutate } = useEpics(projectId);
  const { createEpic, updateEpic, deleteEpic } = useEpicMutations();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    color: EPIC_COLORS[0],
    status: 'TODO' as EpicStatus,
    startDate: '',
    endDate: '',
  });

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      color: EPIC_COLORS[0],
      status: 'TODO',
      startDate: '',
      endDate: '',
    });
    setSelectedEpic(null);
  };

  const handleOpenModal = (epic?: Epic) => {
    if (epic) {
      setSelectedEpic(epic);
      setForm({
        title: epic.title,
        description: epic.description || '',
        color: epic.color,
        status: epic.status,
        startDate: epic.startDate ? epic.startDate.split('T')[0] : '',
        endDate: epic.endDate ? epic.endDate.split('T')[0] : '',
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Le titre est requis');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (selectedEpic) {
        await updateEpic(projectId, selectedEpic.id, {
          title: form.title,
          description: form.description || undefined,
          color: form.color,
          status: form.status,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
        });
      } else {
        await createEpic(projectId, {
          title: form.title,
          description: form.description || undefined,
          color: form.color,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
        });
      }
      setIsModalOpen(false);
      resetForm();
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteEpic(projectId, deleteConfirm);
      setDeleteConfirm(null);
      mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      </div>
    );
  }

  // Group epics by status
  const epicsByStatus = {
    TODO: epics?.filter(e => e.status === 'TODO') || [],
    IN_PROGRESS: epics?.filter(e => e.status === 'IN_PROGRESS') || [],
    DONE: epics?.filter(e => e.status === 'DONE') || [],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Epics</h2>
          <p className="text-sm text-gray-500">
            Organisez vos grandes fonctionnalités et initiatives
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          Nouvel Epic
        </button>
      </div>

      {/* Epics Grid by Status */}
      <div className="space-y-8">
        {/* To Do */}
        {epicsByStatus.TODO.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">
              À faire ({epicsByStatus.TODO.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {epicsByStatus.TODO.map(epic => (
                <EpicCard
                  key={epic.id}
                  epic={epic}
                  onClick={() => handleOpenModal(epic)}
                />
              ))}
            </div>
          </div>
        )}

        {/* In Progress */}
        {epicsByStatus.IN_PROGRESS.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-blue-600 uppercase mb-4">
              En cours ({epicsByStatus.IN_PROGRESS.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {epicsByStatus.IN_PROGRESS.map(epic => (
                <EpicCard
                  key={epic.id}
                  epic={epic}
                  onClick={() => handleOpenModal(epic)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Done */}
        {epicsByStatus.DONE.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-green-600 uppercase mb-4">
              Terminés ({epicsByStatus.DONE.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {epicsByStatus.DONE.map(epic => (
                <EpicCard
                  key={epic.id}
                  epic={epic}
                  onClick={() => handleOpenModal(epic)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {(!epics || epics.length === 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-violet-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun Epic</h3>
          <p className="text-gray-500 mb-6">
            Les Epics permettent de regrouper les tâches par grandes fonctionnalités ou initiatives.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
            Créer un Epic
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedEpic ? 'Modifier l\'Epic' : 'Nouvel Epic'}
        size="md"
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              placeholder="Authentification utilisateur"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              placeholder="Décrivez cet Epic..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Couleur
              </label>
              <div className="flex flex-wrap gap-2">
                {EPIC_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    className={`w-8 h-8 rounded-full transition-all ${
                      form.color === color ? 'ring-2 ring-offset-2 ring-violet-500' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as EpicStatus })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                {EPIC_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-200">
            <div>
              {selectedEpic && (
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setDeleteConfirm(selectedEpic.id);
                  }}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Supprimer
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 font-medium flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  selectedEpic ? 'Enregistrer' : 'Créer'
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Supprimer l'Epic"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Êtes-vous sûr de vouloir supprimer cet Epic ? Les tâches associées ne seront pas supprimées
            mais perdront leur lien avec cet Epic.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
