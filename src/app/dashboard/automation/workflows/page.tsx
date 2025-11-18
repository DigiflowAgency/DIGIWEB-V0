'use client';

import { useState } from 'react';
import { Zap, Plus, Search, Play, Pause, Edit, BarChart3, Loader2 } from 'lucide-react';
import { useWorkflows, useWorkflowMutations } from '@/hooks/useWorkflows';
import Modal from '@/components/Modal';

export default function WorkflowsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: 'MANUAL',
    status: 'ACTIVE' as 'ACTIVE' | 'PAUSE',
  });

  // Utiliser le hook useWorkflows pour récupérer les données depuis l'API
  const { workflows, stats, isLoading, isError, mutate } = useWorkflows({
    search: searchQuery || undefined,
  });

  const { updateWorkflowStatus, createWorkflow, loading: submitting, error: submitError } = useWorkflowMutations();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleToggleStatus = async (workflow: any) => {
    try {
      const newStatus = workflow.status === 'ACTIVE' ? 'PAUSE' : 'ACTIVE';
      await updateWorkflowStatus(workflow.id, newStatus);
      mutate();
    } catch (err) {
      console.error('Erreur changement statut:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWorkflow({
        name: formData.name,
        description: formData.description || undefined,
        trigger: formData.trigger,
        status: formData.status,
      });
      setIsModalOpen(false);
      setFormData({
        name: '',
        description: '',
        trigger: 'MANUAL',
        status: 'ACTIVE',
      });
      mutate();
    } catch (err) {
      console.error('Erreur création workflow:', err);
    }
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement des workflows...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement des workflows</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const statsDisplay = [
    { label: 'Total Workflows', value: stats.total, color: 'text-orange-600' },
    { label: 'Actifs', value: stats.active, color: 'text-green-600' },
    { label: 'Exécutions', value: stats.totalExecutions.toLocaleString(), color: 'text-blue-600' },
    { label: 'Taux Succès', value: `${Math.round(stats.avgSuccessRate)}%`, color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Zap className="h-8 w-8 text-orange-600" />
                Workflows Automation
              </h1>
              <p className="text-gray-600 mt-1">Automatisez vos processus métier</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Nouveau Workflow
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {statsDisplay.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un workflow..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex-1">{workflow.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  workflow.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {workflow.status === 'ACTIVE' ? 'Actif' : workflow.status === 'PAUSE' ? 'Pause' : 'Archivé'}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Déclencheur</span>
                  <span className="font-semibold text-gray-900">{workflow.trigger}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Actions</span>
                  <span className="font-semibold text-gray-900">{workflow.actionsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Exécutions</span>
                  <span className="font-semibold text-orange-600">{workflow.executions}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => alert(`Éditer le workflow: ${workflow.name}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </button>
                <button
                  onClick={() => handleToggleStatus(workflow)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title={workflow.status === 'ACTIVE' ? 'Mettre en pause' : 'Activer'}
                >
                  {workflow.status === 'ACTIVE' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => alert(`Statistiques du workflow: ${workflow.name}\nExécutions: ${workflow.executions}\nTaux de succès: ${workflow.successRate || 0}%`)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Voir les statistiques"
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {workflows.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">Aucun workflow trouvé</p>
            <p className="text-gray-500 text-sm">Créez votre premier workflow pour automatiser vos processus</p>
          </div>
        )}

        {/* Modal Nouveau Workflow */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Nouveau Workflow"
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {submitError}
              </div>
            )}

            {/* Nom */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom du workflow <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Envoi email de bienvenue"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Description du workflow..."
                rows={3}
              />
            </div>

            {/* Déclencheur et Statut */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Déclencheur
                </label>
                <select
                  value={formData.trigger}
                  onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="MANUAL">Manuel</option>
                  <option value="NEW_CONTACT">Nouveau contact</option>
                  <option value="NEW_DEAL">Nouveau deal</option>
                  <option value="EMAIL_RECEIVED">Email reçu</option>
                  <option value="FORM_SUBMITTED">Formulaire soumis</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Statut initial
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'PAUSE' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="ACTIVE">Actif</option>
                  <option value="PAUSE">En pause</option>
                </select>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer le workflow'
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
