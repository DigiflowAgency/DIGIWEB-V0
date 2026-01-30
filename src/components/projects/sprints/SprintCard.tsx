'use client';

import type { Sprint } from '@/types/projects';
import { formatDate, getSprintDay, getSprintTotalDays } from '@/lib/projects/utils';
import { SPRINT_STATUSES } from '@/lib/projects/constants';
import { Calendar, Target, CheckCircle, Clock, Play, Flag } from 'lucide-react';

interface SprintCardProps {
  sprint: Sprint;
  onStart?: () => void;
  onComplete?: () => void;
  onClick?: () => void;
}

export default function SprintCard({ sprint, onStart, onComplete, onClick }: SprintCardProps) {
  const statusConfig = SPRINT_STATUSES.find(s => s.value === sprint.status);
  const progress = sprint.plannedPoints > 0
    ? Math.round((sprint.completedPoints / sprint.plannedPoints) * 100)
    : 0;

  const isActive = sprint.status === 'ACTIVE';
  const isPlanning = sprint.status === 'PLANNING';
  const isCompleted = sprint.status === 'COMPLETED';

  const currentDay = isActive ? getSprintDay(sprint) : null;
  const totalDays = getSprintTotalDays(sprint);

  return (
    <div
      className={`bg-white rounded-lg border p-4 ${
        isActive ? 'border-blue-300 shadow-md' : 'border-gray-200 hover:border-gray-300'
      } transition-all cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{sprint.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig?.color}`}>
              {statusConfig?.label}
            </span>
          </div>
          {sprint.goal && (
            <p className="text-sm text-gray-500 line-clamp-2">{sprint.goal}</p>
          )}
        </div>

        {isPlanning && onStart && (
          <button
            onClick={(e) => { e.stopPropagation(); onStart(); }}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <Play className="w-4 h-4" />
            Démarrer
          </button>
        )}

        {isActive && onComplete && (
          <button
            onClick={(e) => { e.stopPropagation(); onComplete(); }}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
          >
            <Flag className="w-4 h-4" />
            Terminer
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">Progression</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-300'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        {/* Points */}
        <div className="flex items-center gap-1 text-gray-500">
          <Target className="w-4 h-4" />
          <span>
            {sprint.completedPoints}/{sprint.plannedPoints} pts
          </span>
        </div>

        {/* Tasks */}
        <div className="flex items-center gap-1 text-gray-500">
          <CheckCircle className="w-4 h-4" />
          <span>{sprint._count?.tasks || 0} tâches</span>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-1 text-gray-500 ml-auto">
          <Calendar className="w-4 h-4" />
          <span>
            {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
          </span>
        </div>
      </div>

      {/* Active Sprint Progress */}
      {isActive && currentDay !== null && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-blue-600">
            <Clock className="w-4 h-4" />
            <span>Jour {currentDay} / {totalDays}</span>
          </div>
          <span className="text-gray-500">
            {totalDays - currentDay} jour{totalDays - currentDay > 1 ? 's' : ''} restant{totalDays - currentDay > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
