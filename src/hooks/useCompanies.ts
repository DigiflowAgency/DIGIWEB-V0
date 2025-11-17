import useSWR from 'swr';
import { useState } from 'react';

// Types
export interface Company {
  id: string;
  name: string;
  siret: string | null;
  legalForm: string | null;
  gerant: string | null;
  industry: string | null;
  employees: number | null;
  revenue: number | null;
  solvencyScore: number | null;
  solvencyDate: Date | null;
  status: 'LEAD' | 'PROSPECT' | 'CLIENT';
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  contacts?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    position: string | null;
  }[];
  deals?: {
    id: string;
    title: string;
    value: number;
    stage: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CompaniesResponse {
  companies: Company[];
  stats: {
    total: number;
    clients: number;
    prospects: number;
    leads: number;
  };
}

export interface CreateCompanyData {
  name: string;
  siret?: string | null;
  legalForm?: string | null;
  gerant?: string | null;
  industry?: string | null;
  employees?: number | null;
  revenue?: number | null;
  solvencyScore?: number | null;
  status?: 'LEAD' | 'PROSPECT' | 'CLIENT';
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
}

// Fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Hook principal
export function useCompanies(params?: {
  search?: string;
  status?: string;
  industry?: string;
  limit?: number;
}) {
  // Construire l'URL avec les paramètres
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.industry) queryParams.append('industry', params.industry);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `/api/companies${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<CompaniesResponse>(url, fetcher);

  return {
    companies: data?.companies || [],
    stats: data?.stats || { total: 0, clients: 0, prospects: 0, leads: 0 },
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour une entreprise spécifique
export function useCompany(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Company>(
    id ? `/api/companies/${id}` : null,
    fetcher
  );

  return {
    company: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour les mutations (create, update, delete)
export function useCompanyMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCompany = async (data: CreateCompanyData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const company = await response.json();
      return company;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async (id: string, data: Partial<CreateCompanyData>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      const company = await response.json();
      return company;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCompany = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/companies/${id}`, {
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
    createCompany,
    updateCompany,
    deleteCompany,
    loading,
    error,
  };
}
