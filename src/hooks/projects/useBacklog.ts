'use client';

import useSWR from 'swr';
import type { BacklogData } from '@/types/projects';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
};

export function useBacklog(projectId: string, groupByEpic = true) {
  const url = `/api/projects/${projectId}/backlog?groupByEpic=${groupByEpic}`;

  const { data, error, isLoading, mutate } = useSWR<BacklogData>(url, fetcher);

  return {
    groups: data?.groups || [],
    unassignedTasks: data?.unassignedTasks || [],
    totalTasks: data?.totalTasks || 0,
    isLoading,
    isError: error,
    mutate,
  };
}
