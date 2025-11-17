import useSWR from 'swr';

export interface Prospect {
  id: string;
  name: string;
  activity: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
  employees?: string;
  rating?: number;
  imported: boolean;
  importedAt?: string;
  contactId?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProspectStats {
  total: number;
  imported: number;
  notImported: number;
  avgRating: number;
}

interface UseProspectsOptions {
  activity?: string;
  city?: string;
  imported?: boolean;
}

interface UseProspectsReturn {
  prospects: Prospect[];
  stats: ProspectStats;
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useProspects(options: UseProspectsOptions = {}): UseProspectsReturn {
  const params = new URLSearchParams();
  if (options.activity) params.append('activity', options.activity);
  if (options.city) params.append('city', options.city);
  if (options.imported !== undefined) params.append('imported', String(options.imported));

  const url = `/api/prospects${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, mutate } = useSWR(url, fetcher);

  return {
    prospects: data?.prospects || [],
    stats: data?.stats || {
      total: 0,
      imported: 0,
      notImported: 0,
      avgRating: 0,
    },
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
