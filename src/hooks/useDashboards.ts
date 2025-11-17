import useSWR from 'swr';

export interface CustomDashboard {
  id: string;
  name: string;
  description?: string;
  widgets: number;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useDashboards() {
  const { data, error, mutate } = useSWR('/api/dashboards', fetcher);

  return {
    dashboards: (data?.dashboards || []) as CustomDashboard[],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
