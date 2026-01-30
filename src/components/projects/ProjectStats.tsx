'use client';

import type { ProjectStats as ProjectStatsType } from '@/types/projects';
import { CheckCircle, Circle, Zap, ListTodo, Target, TrendingUp } from 'lucide-react';

interface ProjectStatsProps {
  stats: ProjectStatsType;
}

export default function ProjectStats({ stats }: ProjectStatsProps) {
  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  const pointsRate = stats.totalStoryPoints > 0
    ? Math.round((stats.completedStoryPoints / stats.totalStoryPoints) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {/* Tasks */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <ListTodo className="w-4 h-4" />
          <span className="text-sm">Tâches</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">{stats.completedTasks}</span>
          <span className="text-sm text-gray-400">/ {stats.totalTasks}</span>
        </div>
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 mt-1">{completionRate}% terminé</span>
      </div>

      {/* Story Points */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <Target className="w-4 h-4" />
          <span className="text-sm">Points</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">{stats.completedStoryPoints}</span>
          <span className="text-sm text-gray-400">/ {stats.totalStoryPoints}</span>
        </div>
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full"
            style={{ width: `${pointsRate}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 mt-1">{pointsRate}% livré</span>
      </div>

      {/* Velocity */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm">Vélocité</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">{stats.velocity}</span>
          <span className="text-sm text-gray-400">pts/sprint</span>
        </div>
      </div>

      {/* Epics */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <Zap className="w-4 h-4" />
          <span className="text-sm">Epics</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">{stats.completedEpics}</span>
          <span className="text-sm text-gray-400">/ {stats.totalEpics}</span>
        </div>
      </div>

      {/* Active Sprint */}
      {stats.activeSprint && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 col-span-2">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Circle className="w-4 h-4 text-blue-500 fill-blue-500" />
            <span className="text-sm">Sprint actif</span>
          </div>
          <div className="font-medium text-gray-900">{stats.activeSprint.name}</div>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>{stats.activeSprint.completedPoints}/{stats.activeSprint.plannedPoints} pts</span>
            <span>{stats.activeSprint._count?.tasks || 0} tâches</span>
          </div>
        </div>
      )}

      {/* Tasks by Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 col-span-2 md:col-span-4 lg:col-span-6">
        <div className="flex items-center gap-2 text-gray-500 mb-3">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Répartition par statut</span>
        </div>
        <div className="flex gap-2">
          {stats.tasksByStatus.map(item => (
            <div
              key={item.status}
              className="flex-1 text-center"
            >
              <div
                className="h-2 rounded-full mb-2"
                style={{ backgroundColor: item.color }}
              />
              <div className="text-lg font-bold text-gray-900">{item.count}</div>
              <div className="text-xs text-gray-500 truncate">{item.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
