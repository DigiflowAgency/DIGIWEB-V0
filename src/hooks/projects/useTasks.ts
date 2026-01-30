'use client';

import useSWR from 'swr';
import { useState } from 'react';
import type {
  Task,
  CreateTaskData,
  UpdateTaskData,
  MoveTaskData,
  TaskPriority,
  TaskType,
} from '@/types/projects';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
};

interface UseTasksParams {
  projectId: string;
  search?: string;
  statusId?: string;
  epicId?: string;
  sprintId?: string;
  assigneeId?: string;
  priority?: TaskPriority;
  type?: TaskType;
  limit?: number;
  offset?: number;
}

export function useTasks(params: UseTasksParams) {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.statusId) queryParams.append('statusId', params.statusId);
  if (params.epicId) queryParams.append('epicId', params.epicId);
  if (params.sprintId) queryParams.append('sprintId', params.sprintId);
  if (params.assigneeId) queryParams.append('assigneeId', params.assigneeId);
  if (params.priority) queryParams.append('priority', params.priority);
  if (params.type) queryParams.append('type', params.type);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());

  const url = `/api/projects/${params.projectId}/tasks${queryParams.toString() ? `?${queryParams}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<{ tasks: Task[]; total: number }>(url, fetcher);

  return {
    tasks: data?.tasks || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useTask(taskId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Task>(
    taskId ? `/api/projects/tasks/${taskId}` : null,
    fetcher
  );

  return {
    task: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useTaskMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTask = async (projectId: string, data: CreateTaskData): Promise<Task> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur lors de la création');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId: string, data: UpdateTaskData): Promise<Task> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur lors de la mise à jour');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const moveTask = async (taskId: string, data: MoveTaskData): Promise<Task> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/tasks/${taskId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur lors du déplacement');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/tasks/${taskId}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur lors de la suppression');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createSubtask = async (taskId: string, data: CreateTaskData): Promise<Task> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur lors de la création');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    createSubtask,
    loading,
    error,
  };
}
