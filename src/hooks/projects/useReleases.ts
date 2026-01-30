import useSWR from 'swr';
import { useState } from 'react';
import type { ProjectRelease, CreateReleaseData, UpdateReleaseData } from '@/types/projects';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
};

export function useReleases(projectId: string, status?: 'DRAFT' | 'PUBLISHED') {
  const params = new URLSearchParams();
  if (status) params.append('status', status);

  const { data, error, isLoading, mutate } = useSWR<ProjectRelease[]>(
    projectId ? `/api/projects/${projectId}/releases?${params}` : null,
    fetcher
  );

  return {
    releases: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useRelease(releaseId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ProjectRelease>(
    releaseId ? `/api/projects/releases/${releaseId}` : null,
    fetcher
  );

  return {
    release: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useReleaseMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRelease = async (projectId: string, data: CreateReleaseData): Promise<ProjectRelease> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/releases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur de création');

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRelease = async (releaseId: string, data: UpdateReleaseData): Promise<ProjectRelease> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/releases/${releaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur de mise à jour');

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRelease = async (releaseId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/releases/${releaseId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur de suppression');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const publishRelease = async (releaseId: string): Promise<ProjectRelease> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/releases/${releaseId}/publish`, {
        method: 'POST',
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur de publication');

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const unpublishRelease = async (releaseId: string): Promise<ProjectRelease> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/releases/${releaseId}/publish`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur de dépublication');

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createRelease,
    updateRelease,
    deleteRelease,
    publishRelease,
    unpublishRelease,
    loading,
    error,
  };
}
