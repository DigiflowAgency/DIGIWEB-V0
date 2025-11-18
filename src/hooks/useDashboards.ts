import useSWR from 'swr';
import { useState } from 'react';

export interface CustomDashboard {
  id: string;
  name: string;
  description?: string;
  widgets: number;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useDashboards() {
  const { data, error, mutate } = useSWR('/api/dashboards', fetcher);

  return {
    dashboards: (data?.dashboards || []) as CustomDashboard[],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useDashboardMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDashboard = async (data: { name: string; description?: string }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateDashboard = async (id: string, data: { name?: string; description?: string; favorite?: boolean }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDashboard = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboards/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createDashboard,
    updateDashboard,
    deleteDashboard,
    loading,
    error,
  };
}
