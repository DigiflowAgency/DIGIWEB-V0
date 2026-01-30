'use client';

import useSWR from 'swr';
import { useState } from 'react';
import type {
  Project,
  ProjectsResponse,
  CreateProjectData,
  UpdateProjectData,
  ProjectType,
  ProjectStatus,
} from '@/types/projects';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
};

interface UseProjectsParams {
  search?: string;
  status?: ProjectStatus;
  type?: ProjectType;
  ownerId?: string;
  clientId?: string;
  limit?: number;
  offset?: number;
}

export function useProjects(params?: UseProjectsParams) {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.type) queryParams.append('type', params.type);
  if (params?.ownerId) queryParams.append('ownerId', params.ownerId);
  if (params?.clientId) queryParams.append('clientId', params.clientId);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const url = `/api/projects${queryParams.toString() ? `?${queryParams}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<ProjectsResponse>(url, fetcher);

  return {
    projects: data?.projects || [],
    stats: data?.stats || { total: 0, planning: 0, inProgress: 0, completed: 0 },
    isLoading,
    isError: error,
    mutate,
  };
}

export function useProject(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Project>(
    id ? `/api/projects/${id}` : null,
    fetcher
  );

  return {
    project: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useProjectMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProject = async (data: CreateProjectData): Promise<Project> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects', {
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

  const updateProject = async (id: string, data: UpdateProjectData): Promise<Project> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${id}`, {
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

  const deleteProject = async (id: string, permanent = false): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const url = permanent ? `/api/projects/${id}?permanent=true` : `/api/projects/${id}`;
      const res = await fetch(url, { method: 'DELETE' });
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
    createProject,
    updateProject,
    deleteProject,
    loading,
    error,
  };
}
