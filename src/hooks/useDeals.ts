import useSWR from 'swr';
import { useState } from 'react';

// Types
export interface Deal {
  id: string;
  title: string;
  description: string | null;
  value: number;
  currency: string;
  stage: 'A_CONTACTER' | 'EN_DISCUSSION' | 'A_RELANCER' | 'RDV_PRIS' | 'NEGO_HOT' | 'CLOSING';
  productionStage?: 'PREMIER_RDV' | 'EN_PRODUCTION' | 'LIVRE' | 'ENCAISSE' | null;
  probability: number;
  expectedCloseDate: Date | null;
  closedAt: Date | null;
  contactId: string | null;
  contacts?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  } | null;
  companyId: string | null;
  companies?: {
    id: string;
    name: string;
    city: string | null;
  } | null;
  ownerId: string;
  users?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  product?: string | null;
  origin?: string | null;
  emailReminderSent?: string | null;
  smsReminderSent?: string | null;
  comments?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DealsResponse {
  deals: Deal[];
  stats: {
    total: number;
    totalValue: number;
    won: number;
    wonValue: number;
    lost: number;
    active: number;
  };
}

export interface CreateDealData {
  title: string;
  description?: string | null;
  value: number;
  currency?: string;
  stage?: 'A_CONTACTER' | 'EN_DISCUSSION' | 'A_RELANCER' | 'RDV_PRIS' | 'NEGO_HOT' | 'CLOSING';
  productionStage?: 'PREMIER_RDV' | 'EN_PRODUCTION' | 'LIVRE' | 'ENCAISSE' | null;
  probability?: number;
  expectedCloseDate?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  product?: string | null;
  origin?: string | null;
  emailReminderSent?: string | null;
  smsReminderSent?: string | null;
  comments?: string | null;
}

// Fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Hook principal
export function useDeals(params?: {
  search?: string;
  stage?: string;
  contactId?: string;
  companyId?: string;
  limit?: number;
}) {
  // Construire l'URL avec les paramètres
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.stage) queryParams.append('stage', params.stage);
  if (params?.contactId) queryParams.append('contactId', params.contactId);
  if (params?.companyId) queryParams.append('companyId', params.companyId);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `/api/deals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<DealsResponse>(url, fetcher);

  return {
    deals: data?.deals || [],
    stats: data?.stats || { total: 0, totalValue: 0, won: 0, wonValue: 0, lost: 0, active: 0 },
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour un deal spécifique
export function useDeal(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Deal>(
    id ? `/api/deals/${id}` : null,
    fetcher
  );

  return {
    deal: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour les mutations (create, update, delete)
export function useDealMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDeal = async (data: CreateDealData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const deal = await response.json();
      return deal;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateDeal = async (id: string, data: Partial<CreateDealData>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/deals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      const deal = await response.json();
      return deal;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDeal = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/deals/${id}`, {
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
    createDeal,
    updateDeal,
    deleteDeal,
    loading,
    error,
  };
}
