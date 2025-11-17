import useSWR from 'swr';
import { useState } from 'react';

// Types
export interface Activity {
  id: string;
  title: string;
  description: string | null;
  type: 'APPEL' | 'EMAIL' | 'REUNION' | 'VISIO';
  status: 'PLANIFIEE' | 'COMPLETEE' | 'ANNULEE';
  priority: 'HAUTE' | 'MOYENNE' | 'BASSE';
  scheduledAt: Date | string;
  duration: number | null;
  completedAt: Date | string | null;
  contactId: string | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
  dealId: string | null;
  deal?: {
    id: string;
    title: string;
    value: number;
    stage: string;
  } | null;
  assignedToId: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ActivitiesResponse {
  activities: Activity[];
  stats: {
    total: number;
    planifiees: number;
    completees: number;
    aujourdhui: number;
  };
}

export interface CreateActivityData {
  title: string;
  description?: string | null;
  type: 'APPEL' | 'EMAIL' | 'REUNION' | 'VISIO';
  status?: 'PLANIFIEE' | 'COMPLETEE' | 'ANNULEE';
  priority?: 'HAUTE' | 'MOYENNE' | 'BASSE';
  scheduledAt: string;
  duration?: number | null;
  contactId?: string | null;
  dealId?: string | null;
}

// Fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Hook principal
export function useActivities(params?: {
  search?: string;
  type?: string;
  status?: string;
  priority?: string;
  contactId?: string;
  dealId?: string;
  limit?: number;
}) {
  // Construire l'URL avec les paramètres
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.type) queryParams.append('type', params.type);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.priority) queryParams.append('priority', params.priority);
  if (params?.contactId) queryParams.append('contactId', params.contactId);
  if (params?.dealId) queryParams.append('dealId', params.dealId);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `/api/activities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<ActivitiesResponse>(url, fetcher);

  return {
    activities: data?.activities || [],
    stats: data?.stats || { total: 0, planifiees: 0, completees: 0, aujourdhui: 0 },
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour une activité spécifique
export function useActivity(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Activity>(
    id ? `/api/activities/${id}` : null,
    fetcher
  );

  return {
    activity: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour les mutations (create, update, delete)
export function useActivityMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createActivity = async (data: CreateActivityData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const activity = await response.json();
      return activity;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateActivity = async (id: string, data: Partial<CreateActivityData>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/activities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      const activity = await response.json();
      return activity;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteActivity = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/activities/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createActivity,
    updateActivity,
    deleteActivity,
    loading,
    error,
  };
}
