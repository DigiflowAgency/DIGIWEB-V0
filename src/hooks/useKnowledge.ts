import useSWR from 'swr';

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
