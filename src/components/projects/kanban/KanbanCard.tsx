'use client';

import Link from 'next/link';
import type { Task } from '@/types/projects';
import { getTaskTypeIcon, getTaskPriorityIcon, getInitials, getAvatarColor } from '@/lib/projects/utils';
import { MessageSquare, Layers } from 'lucide-react';

interface KanbanCardProps {
  task: Task;
  projectId: string;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export default function KanbanCard({ task, projectId, onDragStart, onDragEnd, isDragging }: KanbanCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-violet-300 hover:shadow-sm transition-all ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <Link href={`/dashboard/projects/${projectId}/tasks/${task.id}`}>
        <div className="flex items-start gap-2 mb-2">
          <span className="text-base" title={task.type}>
            {getTaskTypeIcon(task.type)}
          </span>
          <span className="text-xs font-mono text-gray-400">{task.code}</span>
          <span className="text-sm ml-auto" title={task.priority}>
            {getTaskPriorityIcon(task.priority)}
          </span>
        </div>

        <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
          {task.title}
        </h4>

        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels.slice(0, 3).map(tl => (
              <span
                key={tl.id}
                className="px-1.5 py-0.5 rounded text-xs"
                style={{
                  backgroundColor: `${tl.label?.color}20`,
                  color: tl.label?.color,
                }}
              >
                {tl.label?.name}
              </span>
            ))}
            {task.labels.length > 3 && (
              <span className="text-xs text-gray-400">+{task.labels.length - 3}</span>
            )}
          </div>
        )}

        {/* Epic */}
        {task.epic && (
          <div className="flex items-center gap-1 mb-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: task.epic.color }}
            />
            <span className="text-xs text-gray-500 truncate">{task.epic.title}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {/* Assignee */}
            {task.assignee ? (
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(task.assignee.id)}`}
                title={`${task.assignee.firstName} ${task.assignee.lastName}`}
              >
                {getInitials(task.assignee.firstName, task.assignee.lastName)}
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                ?
              </div>
            )}

            {/* Story Points */}
            {task.storyPoints && (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                {task.storyPoints} pts
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-gray-400">
            {/* Subtasks */}
            {task._count && task._count.subtasks > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <Layers className="w-3 h-3" />
                <span>{task._count.subtasks}</span>
              </div>
            )}

            {/* Comments */}
            {task._count && task._count.comments > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <MessageSquare className="w-3 h-3" />
                <span>{task._count.comments}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
