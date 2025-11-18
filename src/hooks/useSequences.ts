import useSWR from 'swr';
import { useState } from 'react';

interface Sequence {
  id: string;
  name: string;
  description?: string;
  emailsCount: number;
  config: string;
  enrolled: number;
  completed: number;
  openRate?: number;
  replyRate?: number;
  status: 'ACTIVE' | 'PAUSE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
}

interface SequenceStats {
  total: number;
  active: number;
  pause: number;
  archived: number;
  totalEnrolled: number;
  totalCompleted: number;
  avgOpenRate: number;
  avgReplyRate: number;
}

interface UseSequencesOptions {
  search?: string;
  status?: string;
}

interface UseSequencesReturn {
  sequences: Sequence[];
  stats: SequenceStats;
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useSequences(options: UseSequencesOptions = {}): UseSequencesReturn {
  const params = new URLSearchParams();
  if (options.search) params.append('search', options.search);
  if (options.status) params.append('status', options.status);

  const url = `/api/sequences${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, mutate } = useSWR(url, fetcher, {
    refreshInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  return {
    sequences: data?.sequences || [],
    stats: data?.stats || {
      total: 0,
      active: 0,
      pause: 0,
      archived: 0,
      totalEnrolled: 0,
      totalCompleted: 0,
      avgOpenRate: 0,
      avgReplyRate: 0,
    },
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useSequenceMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSequence = async (data: { name: string; description?: string; status: 'ACTIVE' | 'PAUSE' | 'ARCHIVED' }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSequenceStatus = async (id: string, status: 'ACTIVE' | 'PAUSE' | 'ARCHIVED') => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sequences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createSequence,
    updateSequenceStatus,
    loading,
    error,
  };
}
