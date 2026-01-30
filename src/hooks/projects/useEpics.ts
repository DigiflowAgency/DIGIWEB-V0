'use client';

import useSWR from 'swr';
import { useState } from 'react';
import type { Epic, CreateEpicData, UpdateEpicData } from '@/types/projects';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
};

export function useEpics(projectId: string) {
  const { data, error, isLoading, mutate } = useSWR<Epic[]>(
    `/api/projects/${projectId}/epics`,
    fetcher
  );

  return {
    epics: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useEpicMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEpic = async (projectId: string, data: CreateEpicData): Promise<Epic> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/epics`, {
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

  const updateEpic = async (projectId: string, epicId: string, data: UpdateEpicData): Promise<Epic> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/epics`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epicId, ...data }),
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

  const deleteEpic = async (projectId: string, epicId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/epics?epicId=${epicId}`, {
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
    createEpic,
    updateEpic,
    deleteEpic,
    loading,
    error,
  };
}
