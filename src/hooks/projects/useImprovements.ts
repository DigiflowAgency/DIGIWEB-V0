import useSWR from 'swr';
import { useState } from 'react';
import type {
  ImprovementProposal,
  CreateImprovementData,
  UpdateImprovementData,
  ImprovementStatus,
  ImprovementComment,
} from '@/types/projects';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
};

export function useImprovements(projectId: string, status?: ImprovementStatus) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);

  const { data, error, isLoading, mutate } = useSWR<ImprovementProposal[]>(
    projectId ? `/api/projects/${projectId}/improvements?${params}` : null,
    fetcher
  );

  return {
    improvements: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useImprovement(proposalId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ImprovementProposal>(
    proposalId ? `/api/projects/improvements/${proposalId}` : null,
    fetcher
  );

  return {
    improvement: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useImprovementComments(proposalId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ImprovementComment[]>(
    proposalId ? `/api/projects/improvements/${proposalId}/comments` : null,
    fetcher
  );

  return {
    comments: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useImprovementMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createImprovement = async (
    projectId: string,
    data: CreateImprovementData
  ): Promise<ImprovementProposal> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/improvements`, {
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

  const updateImprovement = async (
    proposalId: string,
    data: UpdateImprovementData
  ): Promise<ImprovementProposal> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/improvements/${proposalId}`, {
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

  const deleteImprovement = async (proposalId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/improvements/${proposalId}`, {
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

  const submitImprovement = async (proposalId: string): Promise<ImprovementProposal> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/improvements/${proposalId}/submit`, {
        method: 'POST',
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur de soumission');

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reviewImprovement = async (
    proposalId: string,
    action: 'approve' | 'reject' | 'request_info' | 'start_review',
    reviewNote?: string
  ): Promise<ImprovementProposal & { epicId?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/improvements/${proposalId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reviewNote }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur de revue');

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (
    proposalId: string,
    content: string,
    isInternal = false
  ): Promise<ImprovementComment> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/improvements/${proposalId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, isInternal }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur d\'ajout de commentaire');

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const vote = async (proposalId: string, value: 1 | -1): Promise<{ voteScore: number }> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/improvements/${proposalId}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur de vote');

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeVote = async (proposalId: string): Promise<{ voteScore: number }> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/improvements/${proposalId}/votes`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur de suppression du vote');

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
    createImprovement,
    updateImprovement,
    deleteImprovement,
    submitImprovement,
    reviewImprovement,
    addComment,
    vote,
    removeVote,
    loading,
    error,
  };
}
