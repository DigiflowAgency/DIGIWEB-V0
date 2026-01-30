'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSprints, useSprintMutations } from '@/hooks/projects/useSprints';
import SprintCard from '@/components/projects/sprints/SprintCard';
import BurndownChart from '@/components/projects/sprints/BurndownChart';
import Modal from '@/components/Modal';
import { Loader2, Plus, Calendar, Target, AlertCircle } from 'lucide-react';

export default function SprintsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { sprints, isLoading, mutate } = useSprints(projectId);
  const { createSprint, startSprint, completeSprint } = useSprintMutations();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    goal: '',
    startDate: '',
    endDate: '',
  });

  const activeSprint = sprints?.find(s => s.status === 'ACTIVE');
  const planningSprints = sprints?.filter(s => s.status === 'PLANNING') || [];
  const completedSprints = sprints?.filter(s => s.status === 'COMPLETED') || [];

  const handleCreate = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await createSprint(projectId, {
        name: form.name,
        goal: form.goal || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      setIsCreateModalOpen(false);
      setForm({ name: '', goal: '', startDate: '', endDate: '' });
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStart = async (sprintId: string) => {
    if (activeSprint) {
      alert('Un sprint est déjà actif. Terminez-le avant d\'en démarrer un autre.');
      return;
    }

    try {
      await startSprint(projectId, sprintId);
      mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du démarrage');
    }
  };

  const handleComplete = async (sprintId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir terminer ce sprint ?')) return;

    try {
      await completeSprint(projectId, sprintId);
      mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la complétion');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Sprints</h2>
          <p className="text-sm text-gray-500">
            Planifiez et gérez vos itérations
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          Nouveau sprint
        </button>
      </div>

      {/* Active Sprint */}
      {activeSprint && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Sprint actif
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SprintCard
              sprint={activeSprint}
              onComplete={() => handleComplete(activeSprint.id)}
              onClick={() => router.push(`/dashboard/projects/${projectId}/sprints/${activeSprint.id}`)}
            />
            <BurndownChart
              projectId={projectId}
              sprintId={activeSprint.id}
              type="burndown"
            />
          </div>
        </div>
      )}

      {/* Planning Sprints */}
      {planningSprints.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            En planification ({planningSprints.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {planningSprints.map(sprint => (
              <SprintCard
                key={sprint.id}
                sprint={sprint}
                onStart={() => handleStart(sprint.id)}
                onClick={() => router.push(`/dashboard/projects/${projectId}/sprints/${sprint.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Sprints */}
      {completedSprints.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Terminés ({completedSprints.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedSprints.map(sprint => (
              <SprintCard
                key={sprint.id}
                sprint={sprint}
                onClick={() => router.push(`/dashboard/projects/${projectId}/sprints/${sprint.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!sprints || sprints.length === 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-violet-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun sprint</h3>
          <p className="text-gray-500 mb-6">
            Créez votre premier sprint pour commencer à organiser le travail en itérations.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
            Créer un sprint
          </button>
        </div>
      )}

      {/* Create Sprint Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setError(null);
        }}
        title="Nouveau sprint"
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
              Nom du sprint <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              placeholder="Sprint 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Objectif du sprint
            </label>
            <textarea
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              placeholder="Décrire l'objectif principal de ce sprint..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début <span className="text-red-500">*</span>
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
                Date de fin <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                setError(null);
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 font-medium flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le sprint'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
