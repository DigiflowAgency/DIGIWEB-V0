'use client';

import { useState } from 'react';
import type { KanbanColumn as KanbanColumnType, Task } from '@/types/projects';
import KanbanCard from './KanbanCard';
import { Plus } from 'lucide-react';
import { useTaskMutations } from '@/hooks/projects';

interface KanbanColumnProps {
  column: KanbanColumnType;
  projectId: string;
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
  onDrop: (columnId: string, position: number) => void;
  isDragging: boolean;
  draggingTaskId?: string;
  onTaskCreated: () => void;
}

export default function KanbanColumn({
  column,
  projectId,
  onDragStart,
  onDragEnd,
  onDrop,
  isDragging,
  draggingTaskId,
  onTaskCreated,
}: KanbanColumnProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const { createTask, loading } = useTaskMutations();
  const [dropPosition, setDropPosition] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropPosition(index);
  };

  const handleDragLeave = () => {
    setDropPosition(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(column.id, dropPosition ?? column.tasks.length);
    setDropPosition(null);
  };

  const handleQuickAdd = async () => {
    if (!quickAddTitle.trim()) return;

    try {
      await createTask(projectId, { title: quickAddTitle });
      setQuickAddTitle('');
      setShowQuickAdd(false);
      onTaskCreated();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    <div
      className="flex-shrink-0 w-72 bg-gray-50 rounded-lg flex flex-col max-h-full"
      onDragOver={(e) => handleDragOver(e, column.tasks.length)}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="p-3 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-medium text-gray-900">{column.name}</h3>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {column.tasks.length}
          </span>
        </div>
        <button
          onClick={() => setShowQuickAdd(true)}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {showQuickAdd && (
          <div className="bg-white rounded-lg border border-violet-300 p-3 shadow-sm">
            <input
              type="text"
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              placeholder="Titre de la tâche..."
              className="w-full text-sm border-0 p-0 focus:ring-0 placeholder-gray-400"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickAdd();
                if (e.key === 'Escape') setShowQuickAdd(false);
              }}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowQuickAdd(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={handleQuickAdd}
                disabled={loading || !quickAddTitle.trim()}
                className="text-xs bg-violet-600 text-white px-2 py-1 rounded hover:bg-violet-700 disabled:opacity-50"
              >
                Créer
              </button>
            </div>
          </div>
        )}

        {column.tasks.map((task, index) => (
          <div
            key={task.id}
            onDragOver={(e) => handleDragOver(e, index)}
          >
            {isDragging && dropPosition === index && (
              <div className="h-1 bg-violet-400 rounded mb-2" />
            )}
            <KanbanCard
              task={task}
              projectId={projectId}
              onDragStart={() => onDragStart(task)}
              onDragEnd={onDragEnd}
              isDragging={draggingTaskId === task.id}
            />
          </div>
        ))}

        {isDragging && dropPosition === column.tasks.length && (
          <div className="h-1 bg-violet-400 rounded" />
        )}
      </div>
    </div>
  );
}
