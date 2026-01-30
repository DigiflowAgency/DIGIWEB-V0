'use client';

import { useState } from 'react';
import type { Project } from '@/types/projects';
import { getProjectStatusColor, getProjectStatusLabel, formatDate, getDaysRemaining } from '@/lib/projects/utils';
import { PROJECT_TYPE_COLORS, PROJECT_STATUSES } from '@/lib/projects/constants';
import { useProjectMutations } from '@/hooks/projects';
import {
  Calendar,
  Users,
  Settings,
  MoreHorizontal,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface ProjectHeaderProps {
  project: Project;
  onUpdate?: () => void;
}

export default function ProjectHeader({ project, onUpdate }: ProjectHeaderProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const { updateProject } = useProjectMutations();

  const daysRemaining = getDaysRemaining(project.deadline);
  const isOverdue = daysRemaining !== null && daysRemaining < 0;

  const handleStatusChange = async (status: typeof PROJECT_STATUSES[0]['value']) => {
    try {
      await updateProject(project.id, { status });
      setShowStatusMenu(false);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {project.code}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PROJECT_TYPE_COLORS[project.type]}`}>
                {project.type}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-gray-600 max-w-2xl">{project.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${getProjectStatusColor(project.status)}`}
              >
                {getProjectStatusLabel(project.status)}
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showStatusMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  {PROJECT_STATUSES.map(status => (
                    <button
                      key={status.value}
                      onClick={() => handleStatusChange(status.value)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                        project.status === status.value ? 'bg-gray-50 font-medium' : ''
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${status.color.replace('text-', 'bg-').split(' ')[0]}`} />
                      {status.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-4 text-sm">
          {project.deadline && (
            <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
              {isOverdue ? <AlertTriangle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
              <span>
                {isOverdue ? `En retard de ${Math.abs(daysRemaining!)} jours` : `${daysRemaining} jours restants`}
              </span>
              <span className="text-gray-400">({formatDate(project.deadline)})</span>
            </div>
          )}

          {project.startDate && (
            <div className="flex items-center gap-1.5 text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Début: {formatDate(project.startDate)}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-gray-500">
            <Users className="w-4 h-4" />
            <span>{project._count?.members || 0} membres</span>
          </div>

          {project.client && (
            <div className="text-gray-500">
              Client: <span className="font-medium text-gray-700">{project.client.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
