'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Reminder {
  id: string;
  dealId?: string | null;
  contactId?: string | null;
  userId: string;
  title: string;
  description?: string | null;
  remindAt: string;
  isRead: boolean;
  createdAt: string;
  deal?: {
    id: string;
    title: string;
    companies?: {
      name: string;
    };
  } | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface UseRemindersOptions {
  dealId?: string;
  unreadOnly?: boolean;
  upcoming?: boolean;
}

interface CreateReminderData {
  dealId?: string | null;
  contactId?: string | null;
  title: string;
  description?: string | null;
  remindAt: string;
}

export function useReminders(options: UseRemindersOptions = {}) {
  const params = new URLSearchParams();

  if (options.dealId) {
    params.append('dealId', options.dealId);
  }
  if (options.unreadOnly) {
    params.append('unreadOnly', 'true');
  }
  if (options.upcoming) {
    params.append('upcoming', 'true');
  }

  const queryString = params.toString();
  const url = `/api/reminders${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<{ reminders: Reminder[]; unreadCount: number }>(
    url,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute to check for due reminders
    }
  );

  const createReminder = async (reminderData: CreateReminderData): Promise<Reminder> => {
    const response = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reminderData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la création');
    }

    const newReminder = await response.json();
    mutate();
    return newReminder;
  };

  const updateReminder = async (
    id: string,
    updates: Partial<Pick<Reminder, 'title' | 'description' | 'remindAt' | 'isRead'>>
  ): Promise<Reminder> => {
    const response = await fetch(`/api/reminders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la mise à jour');
    }

    const updatedReminder = await response.json();
    mutate();
    return updatedReminder;
  };

  const markAsRead = async (id: string): Promise<Reminder> => {
    return updateReminder(id, { isRead: true });
  };

  const deleteReminder = async (id: string): Promise<void> => {
    const response = await fetch(`/api/reminders/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la suppression');
    }

    mutate();
  };

  return {
    reminders: data?.reminders || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    isError: error,
    createReminder,
    updateReminder,
    markAsRead,
    deleteReminder,
    mutate,
  };
}
