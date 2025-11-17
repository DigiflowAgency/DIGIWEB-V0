import useSWR from 'swr';

interface Sequence {
  id: string;
  name: string;
  description?: string;
  emailsCount: number;
  config: string;
  enrolled: number;
  completed: number;
  openRate?: number;
  replyRate?: number;
  status: 'ACTIVE' | 'PAUSE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
}

interface SequenceStats {
  total: number;
  active: number;
  pause: number;
  archived: number;
  totalEnrolled: number;
  totalCompleted: number;
  avgOpenRate: number;
  avgReplyRate: number;
}

interface UseSequencesOptions {
  search?: string;
  status?: string;
}

interface UseSequencesReturn {
  sequences: Sequence[];
  stats: SequenceStats;
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useSequences(options: UseSequencesOptions = {}): UseSequencesReturn {
  const params = new URLSearchParams();
  if (options.search) params.append('search', options.search);
  if (options.status) params.append('status', options.status);

  const url = `/api/sequences${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, mutate } = useSWR(url, fetcher, {
    refreshInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  return {
    sequences: data?.sequences || [],
    stats: data?.stats || {
      total: 0,
      active: 0,
      pause: 0,
      archived: 0,
      totalEnrolled: 0,
      totalCompleted: 0,
      avgOpenRate: 0,
      avgReplyRate: 0,
    },
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
