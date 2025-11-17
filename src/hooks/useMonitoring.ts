import useSWR from 'swr';

export interface MonitoringData {
  id: string;
  clientId: string;
  client: {
    id: string;
    name: string;
    email: string | null;
  };
  domain: string;
  uptime: number;
  cpu: number;
  memory: number;
  ssl: boolean;
  lastBackup: string | null;
  nps: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useMonitoring() {
  const { data, error, mutate } = useSWR('/api/monitoring', fetcher);

  return {
    monitoring: (data?.monitoring || []) as MonitoringData[],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
