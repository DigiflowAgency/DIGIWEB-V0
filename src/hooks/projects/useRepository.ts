import useSWR from 'swr';
import { useState } from 'react';
import type { ProjectRepository, GitHubCommit, GitHubPullRequest } from '@/types/projects';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
};

export function useRepository(projectId: string) {
  const { data, error, isLoading, mutate } = useSWR<ProjectRepository | null>(
    projectId ? `/api/projects/${projectId}/repository` : null,
    fetcher
  );

  return {
    repository: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useRepositoryCommits(projectId: string, branch?: string, perPage = 20) {
  const { repository: repo } = useRepository(projectId);

  const { data, error, isLoading, mutate } = useSWR<GitHubCommit[]>(
    repo ? `/api/projects/${projectId}/repository/commits?perPage=${perPage}${branch ? `&branch=${branch}` : ''}` : null,
    fetcher
  );

  return {
    commits: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useRepositoryPulls(projectId: string, state: 'open' | 'closed' | 'all' = 'all', perPage = 20) {
  const { repository: repo } = useRepository(projectId);

  const { data, error, isLoading, mutate } = useSWR<GitHubPullRequest[]>(
    repo ? `/api/projects/${projectId}/repository/pulls?state=${state}&perPage=${perPage}` : null,
    fetcher
  );

  return {
    pulls: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useRepositoryMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectRepository = async (projectId: string, githubUrl: string, accessToken?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/repository`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl, accessToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de connexion');

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const disconnectRepository = async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/repository`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur de déconnexion');
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    connectRepository,
    disconnectRepository,
    loading,
    error,
  };
}
