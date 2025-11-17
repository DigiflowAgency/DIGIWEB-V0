import useSWR from 'swr';
import { useState } from 'react';

// Types
export interface Integration {
  id: string;
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  config: string;
  lastSync: Date | string | null;
  syncFrequency: number | null;
  errorCount: number;
  lastError: string | null;
  connectedAt: Date | string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationsResponse {
  integrations: Integration[];
}

// Fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Hook principal
export function useIntegrations() {
  const { data, error, isLoading, mutate } = useSWR<IntegrationsResponse>('/api/integrations', fetcher);

  return {
    integrations: data?.integrations || [],
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour les mutations (create, update, delete)
export function useIntegrationMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createIntegration = async (data: { name: string; status?: string; config?: Record<string, unknown> }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const integration = await response.json();
      return integration;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateIntegration = async (id: string, data: Partial<{ name: string; status: string; config: Record<string, unknown> }>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/integrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      const integration = await response.json();
      return integration;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createIntegration,
    updateIntegration,
    loading,
    error,
  };
}
