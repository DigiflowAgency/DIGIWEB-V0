'use client';

import type { Epic } from '@/types/projects';
import { getEpicStatusLabel, getEpicStatusColor } from '@/lib/projects/utils';
import { ChevronRight, Target } from 'lucide-react';

interface EpicCardProps {
  epic: Epic & { totalPoints?: number; completedPoints?: number };
  onClick?: () => void;
}

export default function EpicCard({ epic, onClick }: EpicCardProps) {
  const statusColor = getEpicStatusColor(epic.status);

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 hover:border-violet-300 hover:shadow-sm transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: epic.color }}
          />
          <div>
            <span className="text-xs font-mono text-gray-500">{epic.code}</span>
            <h3 className="font-medium text-gray-900">{epic.title}</h3>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
          {getEpicStatusLabel(epic.status)}
        </span>
      </div>

      {epic.description && (
        <p className="text-sm text-gray-500 line-clamp-2 mb-3 ml-7">
          {epic.description}
        </p>
      )}

      {/* Progress */}
      <div className="ml-7">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">Progression</span>
          <span className="font-medium">{epic.progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${epic.progress}%`, backgroundColor: epic.color }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 ml-7 text-sm">
        <div className="flex items-center gap-3 text-gray-500">
          <span>{epic._count?.tasks || 0} tâches</span>
          {(epic.totalPoints !== undefined) && (
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {epic.completedPoints || 0}/{epic.totalPoints} pts
            </span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}
