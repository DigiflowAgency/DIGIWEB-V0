import useSWR from 'swr';

export interface WhatsAppMessage {
  id: string;
  text: string;
  sender: string;
  sentAt: string;
}

export interface WhatsAppConversation {
  id: string;
  name: string;
  phone?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unread: number;
  score?: number;
  messages: WhatsAppMessage[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useWhatsApp() {
  const { data, error, mutate } = useSWR('/api/whatsapp/conversations', fetcher);

  return {
    conversations: (data?.conversations || []) as WhatsAppConversation[],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
