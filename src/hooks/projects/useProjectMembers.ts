'use client';

import useSWR from 'swr';
import { useState } from 'react';
import type { ProjectMember, AddMemberData, ProjectMemberRole } from '@/types/projects';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
};

export function useProjectMembers(projectId: string) {
  const { data, error, isLoading, mutate } = useSWR<ProjectMember[]>(
    `/api/projects/${projectId}/members`,
    fetcher
  );

  return {
    members: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useProjectMemberMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMember = async (projectId: string, data: AddMemberData): Promise<ProjectMember> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur lors de l\'ajout');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateMemberRole = async (
    projectId: string,
    memberId: string,
    role: ProjectMemberRole
  ): Promise<ProjectMember> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role }),
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

  const removeMember = async (projectId: string, memberId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members?memberId=${memberId}`, {
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
    addMember,
    updateMemberRole,
    removeMember,
    loading,
    error,
  };
}
