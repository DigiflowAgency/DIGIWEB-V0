'use client';

import { useState, useEffect } from 'react';
import type { TaskHistoryEntry } from '@/types/projects';
import { getInitials, getAvatarColor } from '@/lib/projects/utils';
import { History, ArrowRight, Loader2 } from 'lucide-react';

interface TaskHistoryProps {
  taskId: string;
}

const formatRelativeTime = (date: string): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return then.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

const getFieldLabel = (field: string): string => {
  const labels: Record<string, string> = {
    title: 'Titre',
    description: 'Description',
    status: 'Statut',
    priority: 'Priorité',
    type: 'Type',
    assignee: 'Assigné à',
    storyPoints: 'Story Points',
    dueDate: 'Échéance',
    startDate: 'Date de début',
    epic: 'Epic',
    sprint: 'Sprint',
  };
  return labels[field] || field;
};

export default function TaskHistory({ taskId }: TaskHistoryProps) {
  const [history, setHistory] = useState<TaskHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/projects/tasks/${taskId}/history`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [taskId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">Aucune modification enregistrée</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((entry) => (
        <div key={entry.id} className="flex gap-3">
          {entry.user && (
            <div
              className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(entry.user.id)}`}
            >
              {getInitials(entry.user.firstName, entry.user.lastName)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-900">
                {entry.user?.firstName} {entry.user?.lastName}
              </span>
              <span className="text-gray-400">a modifié</span>
              <span className="font-medium text-violet-600">
                {getFieldLabel(entry.field)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
              {entry.oldValue && (
                <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded line-through truncate max-w-[150px]">
                  {entry.oldValue}
                </span>
              )}
              <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded truncate max-w-[150px]">
                {entry.newValue || 'Vide'}
              </span>
            </div>
            <span className="text-xs text-gray-400 mt-1 block">
              {formatRelativeTime(entry.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
