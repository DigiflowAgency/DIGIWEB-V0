import useSWR from 'swr';
import { useState } from 'react';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  config: string;
  actionsCount: number;
  executions: number;
  successRate?: number;
  status: 'ACTIVE' | 'PAUSE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
}

interface WorkflowStats {
  total: number;
  active: number;
  pause: number;
  archived: number;
  totalExecutions: number;
  avgSuccessRate: number;
}

interface UseWorkflowsOptions {
  search?: string;
  status?: string;
}

interface UseWorkflowsReturn {
  workflows: Workflow[];
  stats: WorkflowStats;
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useWorkflows(options: UseWorkflowsOptions = {}): UseWorkflowsReturn {
  const params = new URLSearchParams();
  if (options.search) params.append('search', options.search);
  if (options.status) params.append('status', options.status);

  const url = `/api/workflows${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, mutate } = useSWR(url, fetcher, {
    refreshInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  return {
    workflows: data?.workflows || [],
    stats: data?.stats || {
      total: 0,
      active: 0,
      pause: 0,
      archived: 0,
      totalExecutions: 0,
      avgSuccessRate: 0,
    },
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useWorkflowMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWorkflow = async (data: { name: string; description?: string; trigger: string; status: 'ACTIVE' | 'PAUSE' | 'ARCHIVED' }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/workflows', {
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

  const updateWorkflowStatus = async (id: string, status: 'ACTIVE' | 'PAUSE' | 'ARCHIVED') => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workflows/${id}`, {
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
    createWorkflow,
    updateWorkflowStatus,
    loading,
    error,
  };
}
