import useSWR from 'swr';

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: 'ADMIN' | 'USER' | 'MANAGER';
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUsers() {
  const { data, error, mutate } = useSWR('/api/users', fetcher);

  return {
    users: (data?.users || []) as User[],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
