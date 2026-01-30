'use client';

import { useState } from 'react';
import { useProjects, useProjectMutations } from '@/hooks/projects';
import ProjectCard from '@/components/projects/ProjectCard';
import Modal from '@/components/Modal';
import { Plus, Search, Filter, FolderKanban, Loader2 } from 'lucide-react';
import { PROJECT_TYPES, PROJECT_STATUSES } from '@/lib/projects/constants';
import type { ProjectStatus, ProjectType } from '@/types/projects';
import Link from 'next/link';

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ProjectType | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  const { projects, isLoading, isError } = useProjects({
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    search: search || undefined,
  });

  const { deleteProject } = useProjectMutations();

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteProject(deleteConfirm);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression du projet');
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats
  const totalProjects = projects?.length || 0;
  const activeProjects = projects?.filter(p => p.status === 'IN_PROGRESS').length || 0;
  const completedProjects = projects?.filter(p => p.status === 'COMPLETED').length || 0;

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
        <p className="text-red-600">Erreur lors du chargement des projets</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 to-orange-500 bg-clip-text text-transparent">
                Projets
              </h1>
              <p className="mt-2 text-gray-600">
                Gérez vos projets et suivez leur avancement
              </p>
            </div>
            <Link
              href="/dashboard/projects/new"
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
            >
              <Plus className="h-5 w-5" />
              Nouveau projet
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                <FolderKanban className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Projets</p>
                <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              </div>
              <div>
                <p className="text-sm text-gray-500">En cours</p>
                <p className="text-2xl font-bold text-blue-600">{activeProjects}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Terminés</p>
                <p className="text-2xl font-bold text-green-600">{completedProjects}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un projet..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters ? 'bg-violet-50 border-violet-300 text-violet-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-5 w-5" />
              Filtres
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="">Tous les statuts</option>
                  {PROJECT_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as ProjectType | '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="">Tous les types</option>
                  {PROJECT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Projects Grid */}
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FolderKanban className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun projet</h3>
            <p className="text-gray-500 mb-6">
              {search || statusFilter || typeFilter
                ? 'Aucun projet ne correspond à vos critères de recherche.'
                : 'Commencez par créer votre premier projet.'}
            </p>
            {!search && !statusFilter && !typeFilter && (
              <Link
                href="/dashboard/projects/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
              >
                <Plus className="h-5 w-5" />
                Créer un projet
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Supprimer le projet"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={isDeleting}
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
