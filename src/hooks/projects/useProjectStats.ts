'use client';

import useSWR from 'swr';
import type { ProjectStats } from '@/types/projects';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
};

export function useProjectStats(projectId: string) {
  const { data, error, isLoading, mutate } = useSWR<ProjectStats>(
    `/api/projects/${projectId}/stats`,
    fetcher
  );

  return {
    stats: data,
    isLoading,
    isError: error,
    mutate,
  };
}
