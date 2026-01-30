'use client';

import useSWR from 'swr';
import { useState } from 'react';
import type { Sprint, CreateSprintData, UpdateSprintData, BurndownDataPoint } from '@/types/projects';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
};

export function useSprints(projectId: string) {
  const { data, error, isLoading, mutate } = useSWR<Sprint[]>(
    `/api/projects/${projectId}/sprints`,
    fetcher
  );

  return {
    sprints: data || [],
    activeSprint: data?.find(s => s.status === 'ACTIVE'),
    isLoading,
    isError: error,
    mutate,
  };
}

export function useSprint(projectId: string, sprintId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Sprint>(
    sprintId ? `/api/projects/${projectId}/sprints/${sprintId}` : null,
    fetcher
  );

  return {
    sprint: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useBurndown(projectId: string, sprintId: string | null, type: 'burndown' | 'burnup' = 'burndown') {
  const { data, error, isLoading, mutate } = useSWR<{
    sprint: Sprint;
    data: BurndownDataPoint[];
  }>(
    sprintId ? `/api/projects/${projectId}/sprints/${sprintId}/burndown?type=${type}` : null,
    fetcher
  );

  return {
    sprint: data?.sprint,
    chartData: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useSprintMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSprint = async (projectId: string, data: CreateSprintData): Promise<Sprint> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints`, {
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

  const updateSprint = async (projectId: string, sprintId: string, data: UpdateSprintData): Promise<Sprint> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sprintId, ...data }),
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

  const startSprint = async (projectId: string, sprintId: string): Promise<Sprint> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints/${sprintId}/start`, {
        method: 'POST',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur lors du démarrage');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const completeSprint = async (
    projectId: string,
    sprintId: string,
    moveIncompleteTo?: string | null
  ): Promise<{ sprint: Sprint; summary: unknown }> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints/${sprintId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moveIncompleteTo }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur lors de la clôture');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteSprint = async (projectId: string, sprintId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints?sprintId=${sprintId}`, {
        method: 'DELETE',
      });
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

  return {
    createSprint,
    updateSprint,
    startSprint,
    completeSprint,
    deleteSprint,
    loading,
    error,
  };
}
