'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useBacklog, useEpics, useTaskMutations, useProject } from '@/hooks/projects';
import TaskModal from '@/components/projects/tasks/TaskModal';
import TaskTypeBadge from '@/components/projects/tasks/TaskTypeBadge';
import TaskPriorityBadge from '@/components/projects/tasks/TaskPriorityBadge';
import { Loader2, Plus, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import type { Task } from '@/types/projects';

export default function BacklogPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const { groups, unassignedTasks, totalTasks, isLoading, mutate } = useBacklog(projectId);
  const { epics } = useEpics(projectId);
  const { project } = useProject(projectId);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [showUnassigned, setShowUnassigned] = useState(true);

  const toggleEpic = (epicId: string) => {
    setExpandedEpics(prev => {
      const next = new Set(prev);
      if (next.has(epicId)) {
        next.delete(epicId);
      } else {
        next.add(epicId);
      }
      return next;
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    setIsTaskModalOpen(true);
  };

  const handleModalClose = () => {
    setIsTaskModalOpen(false);
    setSelectedTaskId(null);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      </div>
    );
  }

  const totalPoints = [...(groups || []).flatMap(g => g.tasks), ...(unassignedTasks || [])]
    .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Backlog</h2>
          <p className="text-sm text-gray-500">
            {totalTasks || 0} tâches • {totalPoints} story points
          </p>
        </div>
      </div>

      {/* Backlog List */}
      <div className="space-y-4">
        {/* Unassigned Tasks (no epic) */}
        {unassignedTasks && unassignedTasks.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowUnassigned(!showUnassigned)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              {showUnassigned ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="font-medium text-gray-700">Sans Epic</span>
              <span className="text-sm text-gray-500 ml-auto">
                {unassignedTasks.length} tâches
              </span>
            </button>

            {showUnassigned && (
              <div className="divide-y divide-gray-100">
                {unassignedTasks.map((task: Task) => (
                  <TaskRow key={task.id} task={task} onClick={() => handleTaskClick(task)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tasks grouped by Epic */}
        {groups?.map(group => {
          if (!group.epic || group.tasks.length === 0) return null;

          const isExpanded = expandedEpics.has(group.epic.id);

          return (
            <div key={group.epic.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleEpic(group.epic!.id)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: group.epic.color }}
                />
                <span className="text-xs font-mono text-gray-500">{group.epic.code}</span>
                <span className="font-medium text-gray-700">{group.epic.title}</span>
                <span className="text-sm text-gray-500 ml-auto">
                  {group.tasks.length} tâches • {group.tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)} pts
                </span>
              </button>

              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {group.tasks.map((task: Task) => (
                    <TaskRow key={task.id} task={task} onClick={() => handleTaskClick(task)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty State */}
        {(!groups || groups.length === 0) && (!unassignedTasks || unassignedTasks.length === 0) && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Backlog vide</h3>
            <p className="text-gray-500 mb-6">
              Commencez par créer des tâches pour alimenter votre backlog.
            </p>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          projectId={projectId}
          onClose={handleModalClose}
          onUpdate={mutate}
          statuses={project?.statuses}
          members={project?.members}
        />
      )}
    </div>
  );
}

// Task Row Component
function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />

      <span className="text-xs font-mono text-gray-400 w-20">{task.code}</span>

      <TaskTypeBadge type={task.type} size="sm" />

      <span className="flex-1 text-sm text-gray-900 truncate">{task.title}</span>

      <TaskPriorityBadge priority={task.priority} />

      {task.storyPoints && (
        <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
          {task.storyPoints} pts
        </span>
      )}

      {task.assignee && (
        <div
          className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-xs font-medium text-violet-600"
          title={`${task.assignee.firstName} ${task.assignee.lastName}`}
        >
          {task.assignee.firstName?.[0]}{task.assignee.lastName?.[0]}
        </div>
      )}
    </div>
  );
}
