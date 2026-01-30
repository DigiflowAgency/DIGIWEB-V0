'use client';

import useSWR from 'swr';
import type { KanbanData } from '@/types/projects';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
};

interface UseKanbanParams {
  projectId: string;
  sprintId?: string | null;
  epicId?: string | null;
  assigneeId?: string | null;
}

export function useKanban(params: UseKanbanParams) {
  const queryParams = new URLSearchParams();
  if (params.sprintId) queryParams.append('sprintId', params.sprintId);
  if (params.epicId) queryParams.append('epicId', params.epicId);
  if (params.assigneeId) queryParams.append('assigneeId', params.assigneeId);

  const url = `/api/projects/${params.projectId}/board${queryParams.toString() ? `?${queryParams}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<KanbanData>(url, fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  return {
    columns: data?.columns || [],
    taskCount: data?.taskCount || 0,
    isLoading,
    isError: error,
    mutate,
  };
}
