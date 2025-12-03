'use client';

import { useState } from 'react';
import { Bell, CheckCheck, Trash2, Loader2, Clock, AlertCircle, Filter } from 'lucide-react';
import { useNotifications, useNotificationMutations, Notification } from '@/hooks/useNotifications';
import { useReminders } from '@/hooks/useReminders';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

type FilterType = 'all' | 'unread' | 'notifications' | 'reminders';

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');

  const { notifications, unreadCount, isLoading, mutate } = useNotifications();
  const { markAsRead, markAllAsRead, deleteNotification } = useNotificationMutations();
  const { reminders, markAsRead: markReminderAsRead, deleteReminder } = useReminders({ upcoming: true });

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
      mutate();
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleReminderClick = async (reminder: any) => {
    if (!reminder.isRead) {
      await markReminderAsRead(reminder.id);
    }
    if (reminder.dealId) {
      router.push(`/dashboard/crm?dealId=${reminder.dealId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    mutate();
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'ACTIVITY':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DEAL':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'QUOTE':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'INVOICE':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'TICKET':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'MENTION':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'SYSTEM':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Due reminders (past due date and not read)
  const dueReminders = reminders.filter(r => {
    const remindAt = new Date(r.remindAt);
    return remindAt <= new Date() && !r.isRead;
  });

  // Filter logic
  const filteredNotifications = (() => {
    if (filter === 'reminders') return [];
    if (filter === 'unread') return notifications.filter(n => !n.read);
    return notifications;
  })();

  const filteredReminders = (() => {
    if (filter === 'notifications') return [];
    if (filter === 'unread') return dueReminders;
    return reminders;
  })();

  // Combine and sort all items
  const allItems = [
    ...filteredNotifications.map(n => ({ type: 'notification' as const, data: n, date: new Date(n.createdAt) })),
    ...filteredReminders.map(r => ({ type: 'reminder' as const, data: r, date: new Date(r.remindAt) })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const totalUnread = unreadCount + dueReminders.length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="h-6 w-6 text-violet-600" />
            Centre de notifications
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-sm px-2.5 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">Toutes vos notifications et rappels au meme endroit</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
          >
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-gray-400" />
        {(['all', 'unread', 'notifications', 'reminders'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f
                ? 'bg-violet-100 text-violet-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Tout' : f === 'unread' ? 'Non lues' : f === 'notifications' ? 'Notifications' : 'Rappels'}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Bell className="h-4 w-4" />
            Notifications
          </div>
          <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
          <p className="text-xs text-gray-500">{unreadCount} non lues</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Clock className="h-4 w-4" />
            Rappels
          </div>
          <p className="text-2xl font-bold text-gray-900">{reminders.length}</p>
          <p className="text-xs text-orange-600">{dueReminders.length} en retard</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <AlertCircle className="h-4 w-4" />
            Attention requise
          </div>
          <p className="text-2xl font-bold text-red-600">{totalUnread}</p>
          <p className="text-xs text-gray-500">a traiter</p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : allItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune notification</p>
            <p className="text-sm text-gray-400 mt-1">Vous etes a jour !</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {allItems.map((item) => (
              item.type === 'notification' ? (
                <div
                  key={`notif-${item.data.id}`}
                  onClick={() => handleNotificationClick(item.data as Notification)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                    !(item.data as Notification).read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      !(item.data as Notification).read ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-gray-900">{(item.data as Notification).title}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification((item.data as Notification).id);
                            mutate();
                          }}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{(item.data as Notification).message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded border ${getTypeColor((item.data as Notification).type)}`}>
                          {(item.data as Notification).type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date((item.data as Notification).createdAt), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={`reminder-${item.data.id}`}
                  onClick={() => handleReminderClick(item.data)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                    new Date(item.data.remindAt) <= new Date() && !item.data.isRead
                      ? 'bg-red-50/50'
                      : !item.data.isRead
                        ? 'bg-orange-50/50'
                        : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 flex-shrink-0 ${
                      new Date(item.data.remindAt) <= new Date() && !item.data.isRead
                        ? 'text-red-500'
                        : 'text-orange-500'
                    }`}>
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-gray-900">{item.data.title}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteReminder(item.data.id);
                          }}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {item.data.deal && (
                        <p className="text-sm text-gray-600 mt-1">
                          Deal: {item.data.deal.companies?.name || item.data.deal.title}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded border ${
                          new Date(item.data.remindAt) <= new Date() && !item.data.isRead
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-orange-100 text-orange-700 border-orange-200'
                        }`}>
                          Rappel
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(item.data.remindAt), "d MMM 'a' HH:mm", { locale: fr })}
                        </span>
                        {new Date(item.data.remindAt) <= new Date() && !item.data.isRead && (
                          <span className="text-xs text-red-600 font-medium">En retard</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
