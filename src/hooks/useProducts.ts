import useSWR from 'swr';

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  monthlyPrice: number | null;
  features: string[]; // JSON parsed as array
  popular: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useProducts(params?: { category?: string }) {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);

  const url = `/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const { data, error, mutate } = useSWR(url, fetcher);

  return {
    products: (data?.products || []) as Product[],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
