import useSWR from 'swr';
import { useState } from 'react';

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeStats {
  total: number;
  totalViews: number;
  categories: number;
  avgViews: number;
}

interface UseKnowledgeOptions {
  search?: string;
  category?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useKnowledge(options: UseKnowledgeOptions = {}) {
  const params = new URLSearchParams();
  if (options.search) params.append('search', options.search);
  if (options.category) params.append('category', options.category);

  const url = `/api/knowledge${params.toString() ? `?${params.toString()}` : ''}`;
  const { data, error, mutate } = useSWR(url, fetcher);

  return {
    articles: (data?.articles || []) as KnowledgeArticle[],
    stats: data?.stats || { total: 0, totalViews: 0, categories: 0, avgViews: 0 },
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useKnowledgeMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createArticle = async (data: { title: string; category: string; content: string }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateArticle = async (id: string, data: { title?: string; category?: string; content?: string }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteArticle = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createArticle,
    updateArticle,
    deleteArticle,
    loading,
    error,
  };
}
