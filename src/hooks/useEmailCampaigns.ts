import useSWR from 'swr';

export interface EmailCampaign {
  id: string;
  subject: string;
  sent: number;
  opened: number;
  clicked: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useEmailCampaigns() {
  const { data, error, mutate } = useSWR('/api/email-campaigns', fetcher);

  return {
    campaigns: (data?.campaigns || []) as EmailCampaign[],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
