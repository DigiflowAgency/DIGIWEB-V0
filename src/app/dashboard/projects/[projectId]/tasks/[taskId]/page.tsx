'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTask, useTaskMutations } from '@/hooks/projects';
import { useProject } from '@/hooks/projects';
import type { UpdateTaskData } from '@/types/projects';
import { TASK_TYPES, TASK_PRIORITIES, STORY_POINTS } from '@/lib/projects/constants';
import { formatDate, getTaskTypeIcon, getTaskPriorityIcon, getInitials, getAvatarColor } from '@/lib/projects/utils';
import TaskComments from '@/components/projects/tasks/TaskComments';
import TaskLabelPicker from '@/components/projects/tasks/TaskLabelPicker';
import TaskWatchers from '@/components/projects/tasks/TaskWatchers';
import TaskHistory from '@/components/projects/tasks/TaskHistory';
import TimeTracker from '@/components/projects/tasks/TimeTracker';
import TaskDependencies from '@/components/projects/tasks/TaskDependencies';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  Clock,
  CheckCircle,
  Layers,
  Link as LinkIcon,
  Edit2,
  Trash2,
  Loader2,
  ChevronRight,
  Eye,
  History,
  GitBranch,
} from 'lucide-react';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const taskId = params.taskId as string;

  const { task, isLoading, mutate } = useTask(taskId);
  const { project } = useProject(projectId);
  const { updateTask, deleteTask, loading } = useTaskMutations();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdateTaskData>({});
  const [activeTab, setActiveTab] = useState<'comments' | 'history' | 'time'>('comments');

  useEffect(() => {
    if (task) {
      setEditData({
        title: task.title,
        description: task.description || '',
        type: task.type,
        priority: task.priority,
        storyPoints: task.storyPoints || undefined,
        statusId: task.statusId,
        assigneeId: task.assigneeId || undefined,
        dueDate: task.dueDate || undefined,
        acceptanceCriteria: task.acceptanceCriteria || undefined,
      });
    }
  }, [task]);

  const handleSave = async () => {
    if (!task) return;
    try {
      await updateTask(taskId, editData);
      mutate();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cette tâche ?')) return;
    try {
      await deleteTask(taskId);
      router.push(`/dashboard/projects/${projectId}/board`);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleFieldChange = async (field: keyof UpdateTaskData, value: unknown) => {
    try {
      await updateTask(taskId, { [field]: value });
      mutate();
    } catch (error) {
      console.error('Failed to update field:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">Tâche introuvable</p>
          <Link
            href={`/dashboard/projects/${projectId}/board`}
            className="text-violet-600 hover:underline"
          >
            Retour au board
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href={`/dashboard/projects/${projectId}`} className="hover:text-gray-700">
          {project?.name || 'Projet'}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/dashboard/projects/${projectId}/board`} className="hover:text-gray-700">
          Board
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">{task.code}</span>
      </nav>

      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <span className="text-3xl">{getTaskTypeIcon(task.type)}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {task.code}
                    </span>
                    <span className="text-xl">{getTaskPriorityIcon(task.priority)}</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      className="text-2xl font-bold text-gray-900 border-b-2 border-violet-500 focus:outline-none w-full"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                    >
                      Enregistrer
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                      title="Modifier"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Labels */}
            <div className="mb-4">
              <TaskLabelPicker
                taskId={taskId}
                projectId={projectId}
                currentLabels={task.labels || []}
                onUpdate={mutate}
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              {isEditing ? (
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="Ajoutez une description..."
                />
              ) : (
                <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
                  {task.description || 'Aucune description'}
                </p>
              )}
            </div>

            {/* Acceptance Criteria */}
            {(task.acceptanceCriteria || isEditing) && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Critères d'acceptation</h3>
                {isEditing ? (
                  <textarea
                    value={editData.acceptanceCriteria || ''}
                    onChange={(e) => setEditData({ ...editData, acceptanceCriteria: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-violet-500 focus:border-violet-500"
                    placeholder="- Critère 1&#10;- Critère 2"
                  />
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm whitespace-pre-wrap">
                    {task.acceptanceCriteria}
                  </div>
                )}
              </div>
            )}

            {/* Subtasks */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Sous-tâches ({task.subtasks.length})
                </h3>
                <div className="space-y-2">
                  {task.subtasks.map(subtask => (
                    <Link
                      key={subtask.id}
                      href={`/dashboard/projects/${projectId}/tasks/${subtask.id}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <CheckCircle
                        className={`w-5 h-5 ${
                          subtask.status?.isDone ? 'text-green-500' : 'text-gray-300'
                        }`}
                      />
                      <span className="text-sm font-mono text-gray-400">{subtask.code}</span>
                      <span className={`flex-1 ${subtask.status?.isDone ? 'line-through text-gray-400' : ''}`}>
                        {subtask.title}
                      </span>
                      {subtask.assignee && (
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(subtask.assignee.id)}`}
                        >
                          {getInitials(subtask.assignee.firstName, subtask.assignee.lastName)}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Dependencies */}
            <TaskDependencies
              taskId={taskId}
              projectId={projectId}
              dependencies={task.dependencies || []}
              dependents={task.dependents || []}
              onUpdate={mutate}
            />
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex gap-1 p-1">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'comments'
                      ? 'bg-violet-100 text-violet-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>Commentaires</span>
                  <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">
                    {task.comments?.length || 0}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('time')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'time'
                      ? 'bg-violet-100 text-violet-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Temps</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'history'
                      ? 'bg-violet-100 text-violet-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Historique</span>
                </button>
              </nav>
            </div>
            <div className="p-6">
              {activeTab === 'comments' && (
                <TaskComments taskId={taskId} comments={task.comments || []} onUpdate={mutate} projectId={projectId} />
              )}
              {activeTab === 'time' && (
                <TimeTracker
                  taskId={taskId}
                  timeEntries={task.timeEntries || []}
                  estimatedHours={task.estimatedHours}
                  loggedHours={task.loggedHours}
                  onUpdate={mutate}
                />
              )}
              {activeTab === 'history' && (
                <TaskHistory taskId={taskId} />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-4">
          {/* Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Statut
            </label>
            <select
              value={task.statusId}
              onChange={(e) => handleFieldChange('statusId', e.target.value)}
              className="mt-2 w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-violet-500 focus:border-violet-500"
            >
              {project?.statuses?.map(status => (
                <option key={status.id} value={status.id}>{status.name}</option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <User className="w-3 h-3" /> Assigné à
            </label>
            <select
              value={task.assigneeId || ''}
              onChange={(e) => handleFieldChange('assigneeId', e.target.value || null)}
              className="mt-2 w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="">Non assigné</option>
              {project?.members?.map(member => (
                <option key={member.userId} value={member.userId}>
                  {member.user?.firstName} {member.user?.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Priority & Type */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Priorité
              </label>
              <select
                value={task.priority}
                onChange={(e) => handleFieldChange('priority', e.target.value)}
                className="mt-2 w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-violet-500 focus:border-violet-500"
              >
                {TASK_PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Type
              </label>
              <select
                value={task.type}
                onChange={(e) => handleFieldChange('type', e.target.value)}
                className="mt-2 w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-violet-500 focus:border-violet-500"
              >
                {TASK_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Story Points & Estimates */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <Tag className="w-3 h-3" /> Story Points
              </label>
              <select
                value={task.storyPoints || ''}
                onChange={(e) => handleFieldChange('storyPoints', e.target.value ? parseInt(e.target.value) : null)}
                className="mt-2 w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">Non estimé</option>
                {STORY_POINTS.map(pts => (
                  <option key={pts} value={pts}>{pts}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3 h-3" /> Temps
              </label>
              <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                <span className="font-medium">{task.loggedHours}h</span> / {task.estimatedHours || '?'}h estimées
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date de début
              </label>
              <input
                type="date"
                value={task.startDate?.split('T')[0] || ''}
                onChange={(e) => handleFieldChange('startDate', e.target.value || null)}
                className="mt-2 w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Échéance
              </label>
              <input
                type="date"
                value={task.dueDate?.split('T')[0] || ''}
                onChange={(e) => handleFieldChange('dueDate', e.target.value || null)}
                className="mt-2 w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>

          {/* Epic & Sprint */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            {task.epic && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Epic
                </label>
                <Link
                  href={`/dashboard/projects/${projectId}/epics`}
                  className="mt-2 flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: task.epic.color }}
                  />
                  <span className="text-sm">{task.epic.title}</span>
                </Link>
              </div>
            )}
            {task.sprint && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Sprint
                </label>
                <Link
                  href={`/dashboard/projects/${projectId}/sprints`}
                  className="mt-2 flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <span className="text-sm">{task.sprint.name}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Watchers */}
          <TaskWatchers
            taskId={taskId}
            watchers={task.watchers || []}
            projectMembers={project?.members || []}
            onUpdate={mutate}
          />

          {/* Reporter & Dates */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            {task.reporter && (
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(task.reporter.id)}`}
                >
                  {getInitials(task.reporter.firstName, task.reporter.lastName)}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Rapporteur</p>
                  <p className="text-sm">{task.reporter.firstName} {task.reporter.lastName}</p>
                </div>
              </div>
            )}
            <div className="pt-3 border-t border-gray-200 text-xs text-gray-500 space-y-1">
              <div>Créé le {formatDate(task.createdAt)}</div>
              <div>Mis à jour le {formatDate(task.updatedAt)}</div>
              {task.completedAt && (
                <div className="text-green-600">Terminé le {formatDate(task.completedAt)}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
