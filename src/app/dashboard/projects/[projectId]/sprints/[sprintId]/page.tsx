'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import BurndownChart from '@/components/projects/sprints/BurndownChart';
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Target,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  Play,
  Square,
  MoreVertical,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { Sprint, Task, ProjectCustomStatus } from '@/types/projects';
import { getTaskTypeIcon, getTaskPriorityIcon, getInitials, getAvatarColor, formatDate } from '@/lib/projects/utils';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erreur');
  return res.json();
};

interface SprintDetailData {
  sprint: Sprint & {
    tasks: Task[];
  };
  statuses: ProjectCustomStatus[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    totalPoints: number;
    completedPoints: number;
    remainingPoints: number;
    daysRemaining: number;
    daysElapsed: number;
    totalDays: number;
    dailyBurnRate: number;
  };
}

export default function SprintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const sprintId = params.sprintId as string;

  const [expandedStatuses, setExpandedStatuses] = useState<Record<string, boolean>>({});
  const [chartType, setChartType] = useState<'burndown' | 'burnup'>('burndown');
  const [isActioning, setIsActioning] = useState(false);

  const { data, isLoading, error, mutate } = useSWR<SprintDetailData>(
    `/api/projects/${projectId}/sprints/${sprintId}/details`,
    fetcher
  );

  const toggleStatus = (statusId: string) => {
    setExpandedStatuses(prev => ({
      ...prev,
      [statusId]: !prev[statusId],
    }));
  };

  const handleStartSprint = async () => {
    if (!confirm('Démarrer ce sprint ?')) return;
    setIsActioning(true);
    try {
      await fetch(`/api/projects/${projectId}/sprints/${sprintId}/start`, { method: 'POST' });
      mutate();
    } catch (err) {
      alert('Erreur lors du démarrage');
    } finally {
      setIsActioning(false);
    }
  };

  const handleCompleteSprint = async () => {
    if (!confirm('Terminer ce sprint ? Les tâches non terminées resteront au backlog.')) return;
    setIsActioning(true);
    try {
      await fetch(`/api/projects/${projectId}/sprints/${sprintId}/complete`, { method: 'POST' });
      mutate();
    } catch (err) {
      alert('Erreur lors de la completion');
    } finally {
      setIsActioning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Erreur lors du chargement du sprint</p>
      </div>
    );
  }

  const { sprint, statuses, stats } = data;

  // Group tasks by status
  const tasksByStatus = statuses.map(status => ({
    status,
    tasks: sprint.tasks.filter(t => t.statusId === status.id),
  }));

  // Initialize expanded state
  if (Object.keys(expandedStatuses).length === 0) {
    const initial: Record<string, boolean> = {};
    statuses.forEach(s => { initial[s.id] = true; });
    setExpandedStatuses(initial);
  }

  const progressPercent = stats.totalPoints > 0
    ? Math.round((stats.completedPoints / stats.totalPoints) * 100)
    : 0;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-100 text-blue-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'PLANNING': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/dashboard/projects/${projectId}/sprints`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux sprints
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{sprint.name}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(sprint.status)}`}>
                {sprint.status === 'ACTIVE' ? 'Actif' : sprint.status === 'COMPLETED' ? 'Terminé' : 'Planification'}
              </span>
            </div>
            {sprint.goal && (
              <p className="text-gray-600 max-w-2xl">{sprint.goal}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {sprint.status === 'PLANNING' && (
              <button
                onClick={handleStartSprint}
                disabled={isActioning}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Démarrer
              </button>
            )}
            {sprint.status === 'ACTIVE' && (
              <button
                onClick={handleCompleteSprint}
                disabled={isActioning}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                Terminer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Calendar className="w-4 h-4" />
            Durée
          </div>
          <div className="text-xl font-semibold">{stats.totalDays} jours</div>
          <div className="text-xs text-gray-500">
            {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Clock className="w-4 h-4" />
            Temps restant
          </div>
          <div className="text-xl font-semibold">
            {stats.daysRemaining > 0 ? `${stats.daysRemaining} jours` : 'Terminé'}
          </div>
          <div className="text-xs text-gray-500">
            {stats.daysElapsed} jours écoulés
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Target className="w-4 h-4" />
            Points planifiés
          </div>
          <div className="text-xl font-semibold">{stats.totalPoints}</div>
          <div className="text-xs text-gray-500">
            {stats.completedPoints} complétés
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <CheckCircle2 className="w-4 h-4" />
            Tâches
          </div>
          <div className="text-xl font-semibold">{stats.completedTasks}/{stats.totalTasks}</div>
          <div className="text-xs text-gray-500">
            {stats.inProgressTasks} en cours, {stats.todoTasks} à faire
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            Progression
          </div>
          <div className="text-xl font-semibold">{progressPercent}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-violet-600 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            Vélocité requise
          </div>
          <div className="text-xl font-semibold">
            {stats.daysRemaining > 0 ? `${stats.dailyBurnRate.toFixed(1)} pts/j` : '-'}
          </div>
          <div className="text-xs text-gray-500">
            {stats.remainingPoints} points restants
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tasks List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Tâches du sprint</h2>

          {tasksByStatus.map(({ status, tasks }) => (
            <div key={status.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleStatus(status.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedStatuses[status.id] ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="font-medium text-gray-900">{status.name}</span>
                  <span className="text-sm text-gray-500">({tasks.length})</span>
                </div>
                <div className="text-sm text-gray-500">
                  {tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)} pts
                </div>
              </button>

              {expandedStatuses[status.id] && tasks.length > 0 && (
                <div className="border-t border-gray-100">
                  {tasks.map(task => (
                    <Link
                      key={task.id}
                      href={`/dashboard/projects/${projectId}/tasks/${task.id}`}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-lg">{getTaskTypeIcon(task.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-400">{task.code}</span>
                          <span className="text-sm">{getTaskPriorityIcon(task.priority)}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      </div>
                      {task.epic && (
                        <div className="flex items-center gap-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: task.epic.color }}
                          />
                          <span className="text-xs text-gray-500 truncate max-w-[100px]">
                            {task.epic.title}
                          </span>
                        </div>
                      )}
                      {task.storyPoints && (
                        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {task.storyPoints} pts
                        </span>
                      )}
                      {task.assignee ? (
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(task.assignee.id)}`}
                          title={`${task.assignee.firstName} ${task.assignee.lastName}`}
                        >
                          {getInitials(task.assignee.firstName, task.assignee.lastName)}
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                          ?
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {expandedStatuses[status.id] && tasks.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-400 border-t border-gray-100">
                  Aucune tâche
                </div>
              )}
            </div>
          ))}

          {sprint.tasks.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500">Aucune tâche assignée à ce sprint</p>
              <Link
                href={`/dashboard/projects/${projectId}/backlog`}
                className="inline-block mt-4 text-violet-600 hover:text-violet-700 font-medium"
              >
                Ajouter des tâches depuis le backlog
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Burndown Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Graphique</h3>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'burndown' | 'burnup')}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1"
              >
                <option value="burndown">Burndown</option>
                <option value="burnup">Burnup</option>
              </select>
            </div>
            <BurndownChart
              projectId={projectId}
              sprintId={sprintId}
              type={chartType}
            />
          </div>

          {/* Team */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Équipe
            </h3>
            <div className="space-y-3">
              {Array.from(new Set(sprint.tasks.map(t => t.assignee).filter(Boolean))).map((assignee) => {
                if (!assignee) return null;
                const assigneeTasks = sprint.tasks.filter(t => t.assigneeId === assignee.id);
                const completedTasks = assigneeTasks.filter(t =>
                  statuses.find(s => s.id === t.statusId)?.isDone
                );
                return (
                  <div key={assignee.id} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(assignee.id)}`}
                    >
                      {getInitials(assignee.firstName, assignee.lastName)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {assignee.firstName} {assignee.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {completedTasks.length}/{assigneeTasks.length} tâches terminées
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {assigneeTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)} pts
                    </span>
                  </div>
                );
              })}
              {sprint.tasks.filter(t => !t.assigneeId).length > 0 && (
                <div className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                    ?
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">Non assigné</p>
                    <p className="text-xs">{sprint.tasks.filter(t => !t.assigneeId).length} tâches</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sprint Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-4">Informations</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Date de début</dt>
                <dd className="font-medium">{formatDate(sprint.startDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Date de fin</dt>
                <dd className="font-medium">{formatDate(sprint.endDate)}</dd>
              </div>
              {sprint.startedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Démarré le</dt>
                  <dd className="font-medium">{formatDate(sprint.startedAt)}</dd>
                </div>
              )}
              {sprint.completedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Terminé le</dt>
                  <dd className="font-medium">{formatDate(sprint.completedAt)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Créé le</dt>
                <dd className="font-medium">{formatDate(sprint.createdAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
