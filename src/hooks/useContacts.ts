import useSWR from 'swr';
import { useState } from 'react';

// Types
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  status: 'LEAD' | 'PROSPECT' | 'CLIENT';
  qualityScore: number | null;
  city: string | null;
  company?: {
    id: string;
    name: string;
    siret: string | null;
  } | null;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactsResponse {
  contacts: Contact[];
  stats: {
    total: number;
    active: number;
    leads: number;
  };
}

export interface CreateContactData {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  companyId?: string | null;
  siret?: string | null;
  gerant?: string | null;
  status?: 'LEAD' | 'PROSPECT' | 'CLIENT';
  qualityScore?: number | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string;
  source?: string | null;
}

// Fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Hook principal
export function useContacts(params?: {
  search?: string;
  status?: string;
  limit?: number;
}) {
  // Construire l'URL avec les paramètres
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `/api/contacts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<ContactsResponse>(url, fetcher);

  return {
    contacts: data?.contacts || [],
    stats: data?.stats || { total: 0, active: 0, leads: 0 },
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour un contact spécifique
export function useContact(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Contact>(
    id ? `/api/contacts/${id}` : null,
    fetcher
  );

  return {
    contact: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour les mutations (create, update, delete)
export function useContactMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createContact = async (data: CreateContactData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const contact = await response.json();
      return contact;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateContact = async (id: string, data: Partial<CreateContactData>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      const contact = await response.json();
      return contact;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/contacts/${id}`, {
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
    createContact,
    updateContact,
    deleteContact,
    loading,
    error,
  };
}
