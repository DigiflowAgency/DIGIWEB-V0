'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GitBranch, Plus, X, ArrowRight, Link as LinkIcon, Copy, Ban } from 'lucide-react';
import type { TaskDependency, DependencyType } from '@/types/projects';
import { DEPENDENCY_TYPES } from '@/lib/projects/constants';
import useSWR from 'swr';

interface TaskDependenciesProps {
  taskId: string;
  projectId: string;
  dependencies: TaskDependency[];
  dependents: TaskDependency[];
  onUpdate: () => void;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
};

const getDependencyIcon = (type: DependencyType) => {
  switch (type) {
    case 'BLOCKS':
      return <Ban className="w-4 h-4 text-red-500" />;
    case 'RELATES_TO':
      return <LinkIcon className="w-4 h-4 text-blue-500" />;
    case 'DUPLICATES':
      return <Copy className="w-4 h-4 text-yellow-500" />;
    default:
      return <GitBranch className="w-4 h-4 text-gray-500" />;
  }
};

const getDependencyLabel = (type: DependencyType) => {
  return DEPENDENCY_TYPES.find(d => d.value === type)?.label || type;
};

export default function TaskDependencies({
  taskId,
  projectId,
  dependencies,
  dependents,
  onUpdate,
}: TaskDependenciesProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<DependencyType>('BLOCKS');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: searchResults } = useSWR(
    searchQuery.length >= 2
      ? `/api/projects/${projectId}/tasks?search=${encodeURIComponent(searchQuery)}&limit=10`
      : null,
    fetcher
  );

  const handleAddDependency = async (toTaskId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/tasks/${taskId}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toTaskId, type: selectedType }),
      });

      if (!res.ok) throw new Error('Erreur');
      setShowAddForm(false);
      setSearchQuery('');
      onUpdate();
    } catch (error) {
      console.error('Failed to add dependency:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    if (!confirm('Supprimer cette dépendance ?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/tasks/${taskId}/dependencies?dependencyId=${dependencyId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erreur');
      onUpdate();
    } catch (error) {
      console.error('Failed to remove dependency:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = searchResults?.tasks?.filter(
    (t: { id: string }) => t.id !== taskId &&
    !dependencies.some(d => d.toTaskId === t.id)
  );

  const hasDependencies = dependencies.length > 0 || dependents.length > 0;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          Dépendances
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Ajouter
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-violet-50 rounded-lg p-4 mb-4">
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Type de dépendance
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DependencyType)}
              className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-violet-500 focus:border-violet-500"
            >
              {DEPENDENCY_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Rechercher une tâche
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-violet-500 focus:border-violet-500"
              placeholder="Tapez le code ou le titre de la tâche..."
            />
          </div>
          {filteredResults && filteredResults.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
              {filteredResults.map((task: { id: string; code: string; title: string }) => (
                <button
                  key={task.id}
                  onClick={() => handleAddDependency(task.id)}
                  disabled={loading}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left disabled:opacity-50"
                >
                  <span className="text-xs font-mono text-gray-500">{task.code}</span>
                  <span className="flex-1 truncate">{task.title}</span>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => { setShowAddForm(false); setSearchQuery(''); }}
            className="mt-3 text-xs text-gray-500 hover:text-gray-700"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Dependencies List */}
      {hasDependencies ? (
        <div className="space-y-4">
          {/* This task blocks */}
          {dependencies.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Cette tâche...</p>
              <div className="space-y-2">
                {dependencies.map(dep => (
                  <div
                    key={dep.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg group"
                  >
                    {getDependencyIcon(dep.type)}
                    <span className="text-xs text-gray-500 font-medium">
                      {getDependencyLabel(dep.type)}
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <Link
                      href={`/dashboard/projects/${projectId}/tasks/${dep.toTaskId}`}
                      className="flex-1 flex items-center gap-2 hover:text-violet-600"
                    >
                      <span className="text-xs font-mono text-gray-400">
                        {dep.toTask?.code}
                      </span>
                      <span className="text-sm truncate">{dep.toTask?.title}</span>
                    </Link>
                    <button
                      onClick={() => handleRemoveDependency(dep.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500"
                      disabled={loading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blocked by */}
          {dependents.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Bloquée par...</p>
              <div className="space-y-2">
                {dependents.map(dep => (
                  <div
                    key={dep.id}
                    className="flex items-center gap-2 p-2 bg-red-50 rounded-lg"
                  >
                    {getDependencyIcon(dep.type)}
                    <Link
                      href={`/dashboard/projects/${projectId}/tasks/${dep.fromTaskId}`}
                      className="flex-1 flex items-center gap-2 hover:text-violet-600"
                    >
                      <span className="text-xs font-mono text-gray-400">
                        {dep.fromTask?.code}
                      </span>
                      <span className="text-sm truncate">{dep.fromTask?.title}</span>
                    </Link>
                    <span className="text-xs text-gray-500 font-medium">
                      {getDependencyLabel(dep.type)}
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">cette tâche</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        !showAddForm && (
          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 text-center">
            Aucune dépendance
          </p>
        )
      )}
    </div>
  );
}
