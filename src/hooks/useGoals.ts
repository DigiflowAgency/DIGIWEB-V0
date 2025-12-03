import useSWR from 'swr';
import { useState } from 'react';

// Types
export interface Goal {
  id: string;
  type: 'PERSONAL' | 'SYSTEM';
  title: string;
  description: string | null;
  targetValue: number | null;
  currentValue: number;
  deadline: Date | string | null;
  completed: boolean;
  userId: string | null;
  users?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoalsResponse {
  goals: Goal[];
}

export interface CreateGoalData {
  type: 'PERSONAL' | 'SYSTEM';
  title: string;
  description?: string | null;
  targetValue?: number | null;
  currentValue?: number;
  deadline?: string | null;
  completed?: boolean;
}

// Fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Hook principal
export function useGoals(params?: {
  type?: 'PERSONAL' | 'SYSTEM';
}) {
  // Construire l'URL avec les paramètres
  const queryParams = new URLSearchParams();
  if (params?.type) queryParams.append('type', params.type);

  const url = `/api/goals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<GoalsResponse>(url, fetcher);

  return {
    goals: data?.goals || [],
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour un objectif spécifique
export function useGoal(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Goal>(
    id ? `/api/goals/${id}` : null,
    fetcher
  );

  return {
    goal: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour les mutations (create, update, delete)
export function useGoalMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGoal = async (data: CreateGoalData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const goal = await response.json();
      return goal;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateGoal = async (id: string, data: Partial<CreateGoalData>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      const goal = await response.json();
      return goal;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteGoal = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createGoal,
    updateGoal,
    deleteGoal,
    loading,
    error,
  };
}
