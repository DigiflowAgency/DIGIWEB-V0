import useSWR from 'swr';
import { useState } from 'react';

// Types
export interface Quote {
  id: string;
  number: string;
  status: 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE' | 'EXPIRE';
  contactId: string | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
  clientName: string;
  clientEmail: string;
  clientAddress: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  validityDays: number;
  expiresAt: Date | string;
  paymentTerms: string | null;
  notes: string | null;
  yousignId: string | null;
  ownerId: string;
  commitmentPeriod?: string | null;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  products?: Array<{
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  quote_products?: Array<any>;
  createdAt: string;
  updatedAt: string;
}

export interface QuotesResponse {
  quotes: Quote[];
  stats: {
    total: number;
    brouillon: number;
    envoye: number;
    accepte: number;
    totalValue: number;
  };
}

export interface CreateQuoteData {
  contactId?: string | null;
  clientName: string;
  clientEmail: string;
  clientAddress?: string | null;
  subtotal: number;
  taxRate?: number;
  validityDays?: number;
  paymentTerms?: string | null;
  notes?: string | null;
}

// Fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Hook principal
export function useQuotes(params?: {
  search?: string;
  status?: string;
  contactId?: string;
  ownerId?: string;
  limit?: number;
}) {
  // Construire l'URL avec les paramètres
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.contactId) queryParams.append('contactId', params.contactId);
  if (params?.ownerId) queryParams.append('ownerId', params.ownerId);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `/api/quotes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<QuotesResponse>(url, fetcher);

  return {
    quotes: data?.quotes || [],
    stats: data?.stats || { total: 0, brouillon: 0, envoye: 0, accepte: 0, totalValue: 0 },
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour un devis spécifique
export function useQuote(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Quote>(
    id ? `/api/quotes/${id}` : null,
    fetcher
  );

  return {
    quote: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour les mutations (create, update, delete)
export function useQuoteMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createQuote = async (data: CreateQuoteData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const quote = await response.json();
      return quote;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateQuote = async (id: string, data: Partial<CreateQuoteData>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      const quote = await response.json();
      return quote;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteQuote = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quotes/${id}`, {
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
    createQuote,
    updateQuote,
    deleteQuote,
    loading,
    error,
  };
}
