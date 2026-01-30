'use client';

import { useSprints, useEpics, useProjectMembers } from '@/hooks/projects';
import { Filter, X } from 'lucide-react';

interface KanbanFiltersProps {
  projectId: string;
  filters: {
    sprintId: string | null;
    epicId: string | null;
    assigneeId: string | null;
  };
  onChange: (filters: {
    sprintId: string | null;
    epicId: string | null;
    assigneeId: string | null;
  }) => void;
  taskCount: number;
}

export default function KanbanFilters({ projectId, filters, onChange, taskCount }: KanbanFiltersProps) {
  const { sprints } = useSprints(projectId);
  const { epics } = useEpics(projectId);
  const { members } = useProjectMembers(projectId);

  const hasFilters = filters.sprintId || filters.epicId || filters.assigneeId;

  const clearFilters = () => {
    onChange({ sprintId: null, epicId: null, assigneeId: null });
  };

  return (
    <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-4">
      <div className="flex items-center gap-2 text-gray-500">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filtres</span>
      </div>

      {/* Sprint Filter */}
      <select
        value={filters.sprintId || ''}
        onChange={(e) => onChange({ ...filters, sprintId: e.target.value || null })}
        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-violet-500 focus:border-violet-500"
      >
        <option value="">Tous les sprints</option>
        {sprints.map(sprint => (
          <option key={sprint.id} value={sprint.id}>
            {sprint.name} {sprint.status === 'ACTIVE' && '(Actif)'}
          </option>
        ))}
      </select>

      {/* Epic Filter */}
      <select
        value={filters.epicId || ''}
        onChange={(e) => onChange({ ...filters, epicId: e.target.value || null })}
        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-violet-500 focus:border-violet-500"
      >
        <option value="">Tous les epics</option>
        {epics.map(epic => (
          <option key={epic.id} value={epic.id}>
            {epic.code} - {epic.title}
          </option>
        ))}
      </select>

      {/* Assignee Filter */}
      <select
        value={filters.assigneeId || ''}
        onChange={(e) => onChange({ ...filters, assigneeId: e.target.value || null })}
        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-violet-500 focus:border-violet-500"
      >
        <option value="">Tous les membres</option>
        {members.map(member => (
          <option key={member.userId} value={member.userId}>
            {member.user?.firstName} {member.user?.lastName}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4" />
          Effacer
        </button>
      )}

      <div className="ml-auto text-sm text-gray-500">
        {taskCount} tâche{taskCount > 1 ? 's' : ''}
      </div>
    </div>
  );
}
