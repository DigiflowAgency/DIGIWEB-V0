import useSWR from 'swr';
import { useState } from 'react';

// Types
export interface Review {
  id: string;
  source: 'GOOGLE' | 'PAGES_JAUNES' | 'TRIPADVISOR' | 'TRUSTPILOT';
  company: 'DIGIFLOW_AGENCY' | 'BE_HYPE';
  rating: number;
  author: string;
  content: string | null;
  reviewDate: Date | string;
  response: string | null;
  respondedAt: Date | string | null;
  externalId: string | null;
  importedAt: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  stats: {
    total: number;
    avgRating: number;
    rating5: number;
    rating4: number;
    rating3: number;
    rating2: number;
    rating1: number;
    withResponse: number;
    satisfactionRate: number;
    bySource: {
      google: number;
      pagesJaunes: number;
      tripadvisor: number;
      trustpilot: number;
    };
  };
}

export interface CreateReviewData {
  source: 'GOOGLE' | 'PAGES_JAUNES' | 'TRIPADVISOR' | 'TRUSTPILOT';
  company: 'DIGIFLOW_AGENCY' | 'BE_HYPE';
  rating: number;
  author: string;
  content?: string | null;
  reviewDate: string;
  response?: string | null;
  respondedAt?: string | null;
  externalId?: string | null;
}

// Fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Hook principal
export function useReviews(params?: {
  search?: string;
  source?: string;
  company?: string;
  rating?: number;
  limit?: number;
}) {
  // Construire l'URL avec les paramètres
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.source) queryParams.append('source', params.source);
  if (params?.company) queryParams.append('company', params.company);
  if (params?.rating) queryParams.append('rating', params.rating.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `/api/reviews${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<ReviewsResponse>(url, fetcher);

  return {
    reviews: data?.reviews || [],
    stats: data?.stats || {
      total: 0,
      avgRating: 0,
      rating5: 0,
      rating4: 0,
      rating3: 0,
      rating2: 0,
      rating1: 0,
      withResponse: 0,
      satisfactionRate: 0,
      bySource: {
        google: 0,
        pagesJaunes: 0,
        tripadvisor: 0,
        trustpilot: 0,
      },
    },
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour un avis spécifique
export function useReview(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Review>(
    id ? `/api/reviews/${id}` : null,
    fetcher
  );

  return {
    review: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour les mutations (create, update, delete)
export function useReviewMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReview = async (data: CreateReviewData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const review = await response.json();
      return review;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateReview = async (id: string, data: Partial<CreateReviewData>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      const review = await response.json();
      return review;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reviews/${id}`, {
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
    createReview,
    updateReview,
    deleteReview,
    loading,
    error,
  };
}
