'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTask, useTaskMutations } from '@/hooks/projects';
import type { UpdateTaskData, ProjectUser } from '@/types/projects';
import { TASK_TYPES, TASK_PRIORITIES, STORY_POINTS } from '@/lib/projects/constants';
import { formatDate, getTaskTypeIcon, getTaskPriorityIcon, getInitials, getAvatarColor } from '@/lib/projects/utils';
import TaskComments from './TaskComments';
import TaskLabelPicker from './TaskLabelPicker';
import {
  X,
  Calendar,
  User,
  Tag,
  Clock,
  CheckCircle,
  Layers,
  ExternalLink,
  MoreHorizontal,
  Eye,
} from 'lucide-react';

interface TaskModalProps {
  taskId: string;
  projectId: string;
  onClose: () => void;
  onUpdate?: () => void;
  statuses?: { id: string; name: string; color: string }[];
  members?: { userId: string; user?: ProjectUser }[];
}

export default function TaskModal({
  taskId,
  projectId,
  onClose,
  onUpdate,
  statuses = [],
  members = [],
}: TaskModalProps) {
  const { task, isLoading, mutate } = useTask(taskId);
  const { updateTask, deleteTask, loading } = useTaskMutations();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdateTaskData>({});

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
      });
    }
  }, [task]);

  const handleSave = async () => {
    if (!task) return;
    try {
      await updateTask(taskId, editData);
      mutate();
      onUpdate?.();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cette tâche ?')) return;
    try {
      await deleteTask(taskId);
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleFieldChange = async (field: keyof UpdateTaskData, value: unknown) => {
    try {
      await updateTask(taskId, { [field]: value });
      mutate();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update field:', error);
    }
  };

  if (isLoading || !task) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-10 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-xl">{getTaskTypeIcon(task.type)}</span>
            <div>
              <span className="text-sm font-mono text-gray-500">{task.code}</span>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="block w-full text-lg font-semibold border-b border-gray-300 focus:border-violet-500 focus:ring-0"
                />
              ) : (
                <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50"
                >
                  Enregistrer
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/dashboard/projects/${projectId}/tasks/${taskId}`}
                  className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded"
                  title="Ouvrir la page complète"
                >
                  <ExternalLink className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  Modifier
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Main Content */}
          <div className="flex-1 p-6 space-y-6">
            {/* Labels */}
            <TaskLabelPicker
              taskId={taskId}
              projectId={projectId}
              currentLabels={task.labels || []}
              onUpdate={mutate}
            />

            {/* Description */}
            <div>
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
                <p className="text-gray-600 whitespace-pre-wrap">
                  {task.description || 'Aucune description'}
                </p>
              )}
            </div>

            {/* Acceptance Criteria */}
            {(task.acceptanceCriteria || isEditing) && (
              <div>
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
                  <div className="bg-gray-50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                    {task.acceptanceCriteria}
                  </div>
                )}
              </div>
            )}

            {/* Subtasks */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Sous-tâches ({task.subtasks.length})
                </h3>
                <div className="space-y-2">
                  {task.subtasks.map(subtask => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                    >
                      <CheckCircle
                        className={`w-4 h-4 ${
                          subtask.status?.isDone ? 'text-green-500' : 'text-gray-300'
                        }`}
                      />
                      <span className={subtask.status?.isDone ? 'line-through text-gray-400' : ''}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <TaskComments taskId={taskId} comments={task.comments || []} onUpdate={mutate} projectId={projectId} />
          </div>

          {/* Sidebar */}
          <div className="w-72 border-l border-gray-200 p-4 space-y-4 bg-gray-50">
            {/* Status */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Statut
              </label>
              <select
                value={task.statusId}
                onChange={(e) => handleFieldChange('statusId', e.target.value)}
                className="mt-1 w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-violet-500 focus:border-violet-500"
              >
                {statuses.map(status => (
                  <option key={status.id} value={status.id}>{status.name}</option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <User className="w-3 h-3" /> Assigné à
              </label>
              <select
                value={task.assigneeId || ''}
                onChange={(e) => handleFieldChange('assigneeId', e.target.value || null)}
                className="mt-1 w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">Non assigné</option>
                {members.map(member => (
                  <option key={member.userId} value={member.userId}>
                    {member.user?.firstName} {member.user?.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Priorité
              </label>
              <select
                value={task.priority}
                onChange={(e) => handleFieldChange('priority', e.target.value)}
                className="mt-1 w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-violet-500 focus:border-violet-500"
              >
                {TASK_PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                ))}
              </select>
            </div>

            {/* Story Points */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <Tag className="w-3 h-3" /> Story Points
              </label>
              <select
                value={task.storyPoints || ''}
                onChange={(e) => handleFieldChange('storyPoints', e.target.value ? parseInt(e.target.value) : null)}
                className="mt-1 w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">Non estimé</option>
                {STORY_POINTS.map(pts => (
                  <option key={pts} value={pts}>{pts}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Échéance
              </label>
              <input
                type="date"
                value={task.dueDate?.split('T')[0] || ''}
                onChange={(e) => handleFieldChange('dueDate', e.target.value || null)}
                className="mt-1 w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            {/* Time Tracking */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3 h-3" /> Temps
              </label>
              <div className="mt-1 text-sm text-gray-600">
                {task.loggedHours}h / {task.estimatedHours || '?'}h
              </div>
            </div>

            {/* Watchers count */}
            {task.watchers && task.watchers.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Observateurs
                </label>
                <div className="mt-1 flex items-center gap-1">
                  {task.watchers.slice(0, 3).map(w => (
                    w.user && (
                      <div
                        key={w.id}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(w.user.id)}`}
                        title={`${w.user.firstName} ${w.user.lastName}`}
                      >
                        {getInitials(w.user.firstName, w.user.lastName)}
                      </div>
                    )
                  ))}
                  {task.watchers.length > 3 && (
                    <span className="text-xs text-gray-500">+{task.watchers.length - 3}</span>
                  )}
                </div>
              </div>
            )}

            {/* Epic */}
            {task.epic && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Epic
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: task.epic.color }}
                  />
                  <span className="text-sm">{task.epic.title}</span>
                </div>
              </div>
            )}

            {/* Sprint */}
            {task.sprint && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Sprint
                </label>
                <div className="mt-1 text-sm text-gray-600">{task.sprint.name}</div>
              </div>
            )}

            {/* Reporter */}
            {task.reporter && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Rapporteur
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(task.reporter.id)}`}
                  >
                    {getInitials(task.reporter.firstName, task.reporter.lastName)}
                  </div>
                  <span className="text-sm">
                    {task.reporter.firstName} {task.reporter.lastName}
                  </span>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-1">
              <div>Créé le {formatDate(task.createdAt)}</div>
              <div>Mis à jour le {formatDate(task.updatedAt)}</div>
              {task.completedAt && (
                <div className="text-green-600">Terminé le {formatDate(task.completedAt)}</div>
              )}
            </div>

            {/* Link to full page */}
            <div className="pt-4 border-t border-gray-200">
              <Link
                href={`/dashboard/projects/${projectId}/tasks/${taskId}`}
                className="flex items-center justify-center gap-2 w-full py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-lg border border-violet-200 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Voir la page complète
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
