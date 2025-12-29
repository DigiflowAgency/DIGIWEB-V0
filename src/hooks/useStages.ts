import useSWR from 'swr';
import { useState, useMemo, useCallback } from 'react';

// Types
export interface PipelineStage {
  id: string;
  code: string;
  label: string;
  color: string;
  probability: number;
  position: number;
  isDefault: boolean;
  isWonStage: boolean;
  isLostStage: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  dealsCount?: number;
}

export interface StagesResponse {
  stages: PipelineStage[];
}

export interface CreateStageData {
  code?: string;
  label: string;
  color: string;
  probability?: number;
  position?: number;
  isDefault?: boolean;
  isWonStage?: boolean;
  isLostStage?: boolean;
}

export interface UpdateStageData {
  label?: string;
  color?: string;
  probability?: number;
  position?: number;
  isDefault?: boolean;
  isWonStage?: boolean;
  isLostStage?: boolean;
  isActive?: boolean;
}

// Fetcher function
const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error || 'Erreur de chargement');
  }

  if (!data.stages || !Array.isArray(data.stages)) {
    throw new Error('Format de réponse invalide');
  }

  return data;
};

// Hook principal
export function useStages(options?: { includeInactive?: boolean }) {
  const queryParams = new URLSearchParams();
  if (options?.includeInactive) {
    queryParams.append('activeOnly', 'false');
  }

  const url = `/api/pipeline-stages${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<StagesResponse>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // Cache 1 minute
  });

  const stages = useMemo(() => {
    return Array.isArray(data?.stages) ? data.stages : [];
  }, [data?.stages]);

  // Helpers mémoïsés
  const getStageByCode = useCallback((code: string): PipelineStage | undefined => {
    return stages.find(s => s.code === code);
  }, [stages]);

  const getStageLabel = useCallback((code: string): string => {
    return stages.find(s => s.code === code)?.label || code;
  }, [stages]);

  const getStageColor = useCallback((code: string): string => {
    return stages.find(s => s.code === code)?.color || 'bg-gray-100 border-gray-300';
  }, [stages]);

  const getStageProbability = useCallback((code: string): number => {
    return stages.find(s => s.code === code)?.probability ?? 50;
  }, [stages]);

  const activeStages = useMemo(() => {
    return stages.filter(s => s.isActive);
  }, [stages]);

  const defaultStage = useMemo(() => {
    return stages.find(s => s.isDefault);
  }, [stages]);

  const wonStage = useMemo(() => {
    return stages.find(s => s.isWonStage);
  }, [stages]);

  const lostStage = useMemo(() => {
    return stages.find(s => s.isLostStage);
  }, [stages]);

  // Stages triés par position
  const sortedStages = useMemo(() => {
    return [...stages].sort((a, b) => a.position - b.position);
  }, [stages]);

  // Liste des codes de stages pour la validation
  const stageCodes = useMemo(() => {
    return stages.map(s => s.code);
  }, [stages]);

  return {
    stages: sortedStages,
    allStages: stages,
    activeStages,
    isLoading,
    isError: error,
    mutate,
    // Helpers
    getStageByCode,
    getStageLabel,
    getStageColor,
    getStageProbability,
    defaultStage,
    wonStage,
    lostStage,
    stageCodes,
  };
}

// Hook pour un stage spécifique
export function useStage(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<PipelineStage>(
    id ? `/api/pipeline-stages/${id}` : null,
    async (url: string) => {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erreur de chargement');
      }
      return data;
    }
  );

  return {
    stage: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour les mutations
export function useStageMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStage = async (data: CreateStageData): Promise<PipelineStage> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pipeline-stages', {
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

  const updateStage = async (id: string, data: UpdateStageData): Promise<PipelineStage> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pipeline-stages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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

  const deleteStage = async (id: string, migrateToStageId?: string): Promise<{ message: string; migratedDeals: number }> => {
    setLoading(true);
    setError(null);

    try {
      const url = migrateToStageId
        ? `/api/pipeline-stages/${id}?migrateToStageId=${migrateToStageId}`
        : `/api/pipeline-stages/${id}`;

      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
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

  const reorderStages = async (stageIds: string[]): Promise<PipelineStage[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pipeline-stages/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du réordonnancement');
      }

      const data = await response.json();
      return data.stages;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
    loading,
    error,
  };
}
