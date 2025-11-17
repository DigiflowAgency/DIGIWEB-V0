import useSWR from 'swr';
import { useState } from 'react';

// Types
export interface SocialPost {
  id: string;
  content: string;
  platform: 'FACEBOOK' | 'LINKEDIN' | 'INSTAGRAM' | 'TWITTER';
  status: 'BROUILLON' | 'PLANIFIE' | 'PUBLIE';
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  scheduledAt: Date | string | null;
  publishedAt: Date | string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPostsResponse {
  posts: SocialPost[];
  stats: {
    total: number;
    publie: number;
    planifie: number;
    brouillon: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalReach: number;
  };
}

export interface CreateSocialPostData {
  content: string;
  platform: 'FACEBOOK' | 'LINKEDIN' | 'INSTAGRAM' | 'TWITTER';
  status?: 'BROUILLON' | 'PLANIFIE' | 'PUBLIE';
  likes?: number;
  comments?: number;
  shares?: number;
  reach?: number;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
}

// Fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Hook principal
export function useSocialPosts(params?: {
  search?: string;
  status?: string;
  platform?: string;
  limit?: number;
}) {
  // Construire l'URL avec les paramètres
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.platform) queryParams.append('platform', params.platform);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `/api/social-posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<SocialPostsResponse>(url, fetcher);

  return {
    posts: data?.posts || [],
    stats: data?.stats || {
      total: 0,
      publie: 0,
      planifie: 0,
      brouillon: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalReach: 0,
    },
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour un post spécifique
export function useSocialPost(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<SocialPost>(
    id ? `/api/social-posts/${id}` : null,
    fetcher
  );

  return {
    post: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour les mutations (create, update, delete)
export function useSocialPostMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = async (data: CreateSocialPostData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/social-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const post = await response.json();
      return post;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePost = async (id: string, data: Partial<CreateSocialPostData>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/social-posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      const post = await response.json();
      return post;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/social-posts/${id}`, {
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
    createPost,
    updatePost,
    deletePost,
    loading,
    error,
  };
}
