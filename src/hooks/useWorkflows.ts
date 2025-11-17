import useSWR from 'swr';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  config: string;
  actionsCount: number;
  executions: number;
  successRate?: number;
  status: 'ACTIVE' | 'PAUSE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
}

interface WorkflowStats {
  total: number;
  active: number;
  pause: number;
  archived: number;
  totalExecutions: number;
  avgSuccessRate: number;
}

interface UseWorkflowsOptions {
  search?: string;
  status?: string;
}

interface UseWorkflowsReturn {
  workflows: Workflow[];
  stats: WorkflowStats;
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useWorkflows(options: UseWorkflowsOptions = {}): UseWorkflowsReturn {
  const params = new URLSearchParams();
  if (options.search) params.append('search', options.search);
  if (options.status) params.append('status', options.status);

  const url = `/api/workflows${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, mutate } = useSWR(url, fetcher, {
    refreshInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  return {
    workflows: data?.workflows || [],
    stats: data?.stats || {
      total: 0,
      active: 0,
      pause: 0,
      archived: 0,
      totalExecutions: 0,
      avgSuccessRate: 0,
    },
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
