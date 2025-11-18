import useSWR from 'swr';
import { useState } from 'react';

export interface EmailCampaign {
  id: string;
  subject: string;
  sent: number;
  opened: number;
  clicked: number;
  status: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useEmailCampaigns() {
  const { data, error, mutate } = useSWR('/api/email-campaigns', fetcher);

  return {
    campaigns: (data?.campaigns || []) as EmailCampaign[],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useEmailCampaignMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEmailCampaign = async (data: { subject: string; content: string; status?: string }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEmailCampaign = async (id: string, data: Partial<{ subject: string; content: string; status: string }>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/email-campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const duplicateEmailCampaign = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/email-campaigns/${id}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la duplication');
      }

      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendEmailCampaign = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/email-campaigns/${id}/send`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi');
      }

      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createEmailCampaign,
    updateEmailCampaign,
    duplicateEmailCampaign,
    sendEmailCampaign,
    loading,
    error,
  };
}
