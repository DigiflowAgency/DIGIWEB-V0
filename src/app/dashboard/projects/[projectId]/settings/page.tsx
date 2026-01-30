'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useProject, useProjectMutations } from '@/hooks/projects';
import { useProjectMembers, useProjectMemberMutations } from '@/hooks/projects/useProjectMembers';
import Modal from '@/components/Modal';
import { Loader2, Save, Trash2, Plus, X, AlertCircle, Settings, Users, Tags, Columns, Wrench, Zap, Link2 } from 'lucide-react';
import { PROJECT_TYPES, PROJECT_STATUSES, DEFAULT_LABELS } from '@/lib/projects/constants';
import type { ProjectType, ProjectStatus, ProjectMemberRole } from '@/types/projects';
import ConnectGitHub from '@/components/projects/repository/ConnectGitHub';

type SettingsTab = 'general' | 'members' | 'labels' | 'statuses' | 'integrations' | 'tools';

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { project, isLoading, mutate } = useProject(projectId);
  const { updateProject, deleteProject } = useProjectMutations();
  const { members, mutate: mutateMembers } = useProjectMembers(projectId);
  const { addMember, removeMember, updateMemberRole } = useProjectMemberMutations();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isFixingSprint, setIsFixingSprint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'WEB' as ProjectType,
    status: 'PLANNING' as ProjectStatus,
    budget: '',
    currency: 'EUR',
    startDate: '',
    endDate: '',
    deadline: '',
  });

  // Initialize form when project loads
  useState(() => {
    if (project) {
      setForm({
        name: project.name,
        description: project.description || '',
        type: project.type,
        status: project.status,
        budget: project.budget?.toString() || '',
        currency: project.currency,
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        deadline: project.deadline ? project.deadline.split('T')[0] : '',
      });
    }
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Le nom du projet est requis');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProject(projectId, {
        name: form.name,
        description: form.description || undefined,
        type: form.type,
        status: form.status,
        budget: form.budget ? parseFloat(form.budget) : undefined,
        currency: form.currency,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        deadline: form.deadline || undefined,
      });
      setSuccess('Projet mis à jour avec succès');
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteInput !== project?.name) {
      setError('Le nom du projet ne correspond pas');
      return;
    }

    try {
      await deleteProject(projectId);
      router.push('/dashboard/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Retirer ce membre du projet ?')) return;
    try {
      await removeMember(projectId, memberId);
      mutateMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Projet non trouvé</p>
        </div>
      </div>
    );
  }

  // Update form when project changes
  if (form.name === '' && project.name) {
    setForm({
      name: project.name,
      description: project.description || '',
      type: project.type,
      status: project.status,
      budget: project.budget?.toString() || '',
      currency: project.currency,
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
      deadline: project.deadline ? project.deadline.split('T')[0] : '',
    });
  }

  const tabs = [
    { id: 'general' as const, label: 'Général', icon: Settings },
    { id: 'members' as const, label: 'Membres', icon: Users },
    { id: 'labels' as const, label: 'Labels', icon: Tags },
    { id: 'statuses' as const, label: 'Statuts', icon: Columns },
    { id: 'integrations' as const, label: 'Intégrations', icon: Link2 },
    { id: 'tools' as const, label: 'Outils', icon: Wrench },
  ];

  const handleFixSprint = async () => {
    setIsFixingSprint(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/fix-sprint`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du sprint');
      }

      if (data.sprint) {
        setSuccess(`Sprint "${data.sprint.name}" créé avec ${data.sprint.tasksCount} tâches et ${data.sprint.plannedPoints} points planifiés`);
      } else {
        setSuccess(data.message || 'Opération terminée');
      }
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du sprint');
    } finally {
      setIsFixingSprint(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Paramètres du projet</h2>
        <p className="text-sm text-gray-500">Configurez les options de votre projet</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4 text-red-600" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-700">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X className="h-4 w-4 text-green-600" />
          </button>
        </div>
      )}

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du projet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
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
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as ProjectType })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  {PROJECT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  {PROJECT_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <input
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 font-medium flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-8 pt-6 border-t border-red-200">
            <h3 className="text-lg font-medium text-red-600 mb-4">Zone de danger</h3>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-700 mb-4">
                La suppression du projet est irréversible. Toutes les tâches, epics et sprints seront supprimés.
              </p>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer le projet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-gray-900">Membres de l&apos;équipe</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 text-sm font-medium">
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>

          {members && members.length > 0 ? (
            <div className="space-y-3">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center text-sm font-medium text-violet-600">
                      {member.user?.firstName?.[0]}{member.user?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user?.firstName} {member.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{member.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={member.role}
                      onChange={(e) => {
                        updateMemberRole(projectId, member.id, e.target.value as ProjectMemberRole);
                        mutateMembers();
                      }}
                      className="text-sm border border-gray-300 rounded-lg px-2 py-1"
                    >
                      <option value="OWNER">Propriétaire</option>
                      <option value="LEAD">Lead</option>
                      <option value="MEMBER">Membre</option>
                      <option value="VIEWER">Lecteur</option>
                    </select>
                    {member.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucun membre</p>
          )}
        </div>
      )}

      {/* Labels Tab */}
      {activeTab === 'labels' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-gray-900">Labels</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 text-sm font-medium">
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>

          {project.labels && project.labels.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {project.labels.map(label => (
                <span
                  key={label.id}
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucun label configuré</p>
          )}
        </div>
      )}

      {/* Statuses Tab */}
      {activeTab === 'statuses' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-gray-900">Colonnes Kanban</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 text-sm font-medium">
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>

          {project.statuses && project.statuses.length > 0 ? (
            <div className="space-y-2">
              {project.statuses.map(status => (
                <div
                  key={status.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="font-medium text-gray-900">{status.name}</span>
                    {status.isDefault && (
                      <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded">
                        Par défaut
                      </span>
                    )}
                    {status.isDone && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        Terminé
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucun statut configuré</p>
          )}
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <ConnectGitHub projectId={projectId} />

          {/* Placeholder for future integrations */}
          <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-6 text-center">
            <Link2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">D&apos;autres intégrations seront ajoutées ici (Slack, Jira, etc.)</p>
          </div>
        </div>
      )}

      {/* Tools Tab */}
      {activeTab === 'tools' && (
        <div className="space-y-6">
          {/* Sprint Auto-Generator */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-violet-100 rounded-lg">
                <Zap className="h-6 w-6 text-violet-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Créer Sprint Automatiquement</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Crée un Sprint 1 actif et y assigne automatiquement les tâches prioritaires (CRITICAL et HIGH)
                  ainsi que les tâches en cours. Les tâches de priorité basse restent au backlog.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Logique d&apos;assignation :</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Tâches CRITICAL → Sprint 1
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      Tâches HIGH → Sprint 1
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Tâches En cours → Sprint 1
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      Tâches MEDIUM/LOW → Backlog
                    </li>
                  </ul>
                </div>
                <button
                  onClick={handleFixSprint}
                  disabled={isFixingSprint}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 font-medium flex items-center gap-2"
                >
                  {isFixingSprint ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Créer le Sprint 1
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Future tools can be added here */}
          <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-6 text-center">
            <Wrench className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">D&apos;autres outils seront ajoutés ici...</p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm}
        onClose={() => {
          setDeleteConfirm(false);
          setDeleteInput('');
        }}
        title="Supprimer le projet"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">
              Cette action est irréversible. Toutes les données du projet seront définitivement supprimées.
            </p>
          </div>

          <p className="text-gray-700">
            Pour confirmer, tapez <strong>{project.name}</strong> ci-dessous :
          </p>

          <input
            type="text"
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="Nom du projet"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setDeleteConfirm(false);
                setDeleteInput('');
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteInput !== project.name}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Supprimer définitivement
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
