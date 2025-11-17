import useSWR from 'swr';
import { useState } from 'react';

// Types
export interface Campaign {
  id: string;
  name: string;
  type: 'EMAIL' | 'SOCIAL_MEDIA' | 'PAID_ADS' | 'EVENT';
  status: 'BROUILLON' | 'PLANIFIEE' | 'ACTIVE' | 'TERMINEE';
  budget: number | null;
  spent: number;
  reach: number;
  clicks: number;
  conversions: number;
  startDate: Date | string | null;
  endDate: Date | string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignsResponse {
  campaigns: Campaign[];
  stats: {
    total: number;
    active: number;
    planifiee: number;
    terminee: number;
    totalBudget: number;
    totalSpent: number;
    totalReach: number;
    totalClicks: number;
    totalConversions: number;
  };
}

export interface CreateCampaignData {
  name: string;
  type: 'EMAIL' | 'SOCIAL_MEDIA' | 'PAID_ADS' | 'EVENT';
  status?: 'BROUILLON' | 'PLANIFIEE' | 'ACTIVE' | 'TERMINEE';
  budget?: number | null;
  spent?: number;
  reach?: number;
  clicks?: number;
  conversions?: number;
  startDate?: string | null;
  endDate?: string | null;
}

// Fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Hook principal
export function useCampaigns(params?: {
  search?: string;
  status?: string;
  type?: string;
  limit?: number;
}) {
  // Construire l'URL avec les paramètres
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.type) queryParams.append('type', params.type);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `/api/campaigns${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<CampaignsResponse>(url, fetcher);

  return {
    campaigns: data?.campaigns || [],
    stats: data?.stats || {
      total: 0,
      active: 0,
      planifiee: 0,
      terminee: 0,
      totalBudget: 0,
      totalSpent: 0,
      totalReach: 0,
      totalClicks: 0,
      totalConversions: 0,
    },
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour une campagne spécifique
export function useCampaign(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Campaign>(
    id ? `/api/campaigns/${id}` : null,
    fetcher
  );

  return {
    campaign: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour les mutations (create, update, delete)
export function useCampaignMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCampaign = async (data: CreateCampaignData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const campaign = await response.json();
      return campaign;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCampaign = async (id: string, data: Partial<CreateCampaignData>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      const campaign = await response.json();
      return campaign;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${id}`, {
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
    createCampaign,
    updateCampaign,
    deleteCampaign,
    loading,
    error,
  };
}
