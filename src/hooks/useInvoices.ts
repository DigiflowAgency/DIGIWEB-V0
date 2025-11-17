import useSWR from 'swr';
import { useState } from 'react';

// Types
export interface Invoice {
  id: string;
  number: string;
  status: 'BROUILLON' | 'ENVOYEE' | 'PAYEE' | 'EN_ATTENTE' | 'EN_RETARD' | 'ANNULEE';
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
  issuedAt: Date | string;
  dueAt: Date | string;
  paidAt: Date | string | null;
  paymentMethod: string | null;
  paymentTerms: string | null;
  notes: string | null;
  ownerId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  stats: {
    total: number;
    brouillon: number;
    envoye: number;
    paye: number;
    enRetard: number;
    totalValue: number;
    totalPaid: number;
    totalUnpaid: number;
  };
}

export interface CreateInvoiceData {
  contactId?: string | null;
  clientName: string;
  clientEmail: string;
  clientAddress?: string | null;
  subtotal: number;
  taxRate?: number;
  paymentTerms?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  dueDate?: string;
}

// Fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Hook principal
export function useInvoices(params?: {
  search?: string;
  status?: string;
  contactId?: string;
  limit?: number;
}) {
  // Construire l'URL avec les paramètres
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.contactId) queryParams.append('contactId', params.contactId);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `/api/invoices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<InvoicesResponse>(url, fetcher);

  return {
    invoices: data?.invoices || [],
    stats: data?.stats || {
      total: 0,
      brouillon: 0,
      envoye: 0,
      paye: 0,
      enRetard: 0,
      totalValue: 0,
      totalPaid: 0,
      totalUnpaid: 0,
    },
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour une facture spécifique
export function useInvoice(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Invoice>(
    id ? `/api/invoices/${id}` : null,
    fetcher
  );

  return {
    invoice: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour les mutations (create, update, delete)
export function useInvoiceMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInvoice = async (data: CreateInvoiceData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const invoice = await response.json();
      return invoice;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateInvoice = async (id: string, data: Partial<CreateInvoiceData>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      const invoice = await response.json();
      return invoice;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/invoices/${id}`, {
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
    createInvoice,
    updateInvoice,
    deleteInvoice,
    loading,
    error,
  };
}
