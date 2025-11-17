import useSWR from 'swr';
import { useState } from 'react';

// Types
export interface Ticket {
  id: string;
  number: string;
  subject: string;
  description: string;
  type: 'INTERNAL' | 'CLIENT';
  status: 'OUVERT' | 'EN_COURS' | 'EN_ATTENTE' | 'ESCALADE' | 'RESOLU' | 'FERME';
  priority: 'HAUTE' | 'MOYENNE' | 'BASSE';
  createdById: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
  };
  assignedToId: string | null;
  assignedTo: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  clientName: string | null;
  clientEmail: string | null;
  resolvedAt: Date | string | null;
  responseTime: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketsResponse {
  tickets: Ticket[];
  stats: {
    total: number;
    ouvert: number;
    enCours: number;
    enAttente: number;
    escalade: number;
    resolu: number;
    ferme: number;
    avgResponseTime: number;
  };
}

export interface CreateTicketData {
  subject: string;
  description: string;
  type?: 'INTERNAL' | 'CLIENT';
  status?: 'OUVERT' | 'EN_COURS' | 'EN_ATTENTE' | 'ESCALADE' | 'RESOLU' | 'FERME';
  priority?: 'HAUTE' | 'MOYENNE' | 'BASSE';
  assignedToId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  resolvedAt?: string | null;
  responseTime?: number | null;
}

// Fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Hook principal
export function useTickets(params?: {
  search?: string;
  status?: string;
  priority?: string;
  type?: string;
  limit?: number;
}) {
  // Construire l'URL avec les paramètres
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.priority) queryParams.append('priority', params.priority);
  if (params?.type) queryParams.append('type', params.type);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `/api/tickets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<TicketsResponse>(url, fetcher);

  return {
    tickets: data?.tickets || [],
    stats: data?.stats || {
      total: 0,
      ouvert: 0,
      enCours: 0,
      enAttente: 0,
      escalade: 0,
      resolu: 0,
      ferme: 0,
      avgResponseTime: 0,
    },
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour un ticket spécifique
export function useTicket(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Ticket>(
    id ? `/api/tickets/${id}` : null,
    fetcher
  );

  return {
    ticket: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour les mutations (create, update, delete)
export function useTicketMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTicket = async (data: CreateTicketData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const ticket = await response.json();
      return ticket;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTicket = async (id: string, data: Partial<CreateTicketData>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      const ticket = await response.json();
      return ticket;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTicket = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tickets/${id}`, {
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
    createTicket,
    updateTicket,
    deleteTicket,
    loading,
    error,
  };
}
