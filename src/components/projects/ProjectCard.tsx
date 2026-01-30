'use client';

import Link from 'next/link';
import type { Project } from '@/types/projects';
import { getProjectStatusColor, getProjectStatusLabel, formatDate, getBudgetUsagePercent } from '@/lib/projects/utils';
import { PROJECT_TYPE_COLORS } from '@/lib/projects/constants';
import { Calendar, Users, FolderKanban, DollarSign } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const budgetPercent = getBudgetUsagePercent(project);
  const statusColor = getProjectStatusColor(project.status);
  const typeColor = PROJECT_TYPE_COLORS[project.type] || 'bg-gray-100 text-gray-700';

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="block bg-white rounded-lg border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-500">{project.code}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor}`}>
              {project.type}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {getProjectStatusLabel(project.status)}
        </span>
      </div>

      {project.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{project.description}</p>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        {project.deadline && (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(project.deadline)}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <FolderKanban className="w-4 h-4" />
          <span>{project._count?.tasks || 0} tâches</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{project._count?.members || 0}</span>
        </div>
      </div>

      {project.budget && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-gray-500">
              <DollarSign className="w-3 h-3" />
              Budget
            </span>
            <span className="font-medium">
              {budgetPercent}% utilisé
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                budgetPercent > 90 ? 'bg-red-500' :
                budgetPercent > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetPercent, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        {project.owner && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
              <span className="text-xs font-medium text-violet-600">
                {project.owner.firstName?.charAt(0)}{project.owner.lastName?.charAt(0)}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {project.owner.firstName} {project.owner.lastName}
            </span>
          </div>
        )}
        {project.client && (
          <span className="text-xs text-gray-400 truncate max-w-[120px]">
            {project.client.name}
          </span>
        )}
      </div>
    </Link>
  );
}
