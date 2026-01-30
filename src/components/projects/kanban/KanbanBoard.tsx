'use client';

import { useState } from 'react';
import { useKanban, useTaskMutations } from '@/hooks/projects';
import KanbanColumn from './KanbanColumn';
import KanbanFilters from './KanbanFilters';
import type { Task } from '@/types/projects';

interface KanbanBoardProps {
  projectId: string;
}

export default function KanbanBoard({ projectId }: KanbanBoardProps) {
  const [filters, setFilters] = useState({
    sprintId: null as string | null,
    epicId: null as string | null,
    assigneeId: null as string | null,
  });

  const { columns, taskCount, isLoading, isError, mutate } = useKanban({
    projectId,
    ...filters,
  });

  const { moveTask } = useTaskMutations();
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);

  const handleDragStart = (task: Task) => {
    setDraggingTask(task);
  };

  const handleDragEnd = () => {
    setDraggingTask(null);
  };

  const handleDrop = async (columnId: string, position: number) => {
    if (!draggingTask) return;

    if (draggingTask.statusId === columnId) {
      // Same column, just reorder
      await moveTask(draggingTask.id, { position });
    } else {
      // Different column, move task
      await moveTask(draggingTask.id, { statusId: columnId, position });
    }

    mutate();
    setDraggingTask(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        Erreur lors du chargement du board
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <KanbanFilters
        projectId={projectId}
        filters={filters}
        onChange={setFilters}
        taskCount={taskCount}
      />

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-4 min-h-full">
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              projectId={projectId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              isDragging={draggingTask !== null}
              draggingTaskId={draggingTask?.id}
              onTaskCreated={mutate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
