'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import type { TimeEntry } from '@/types/projects';
import { getInitials, getAvatarColor } from '@/lib/projects/utils';
import { Clock, Plus, Trash2, Calendar } from 'lucide-react';

interface TimeTrackerProps {
  taskId: string;
  timeEntries: TimeEntry[];
  estimatedHours?: number | null;
  loggedHours: number;
  onUpdate: () => void;
}

const formatRelativeTime = (date: string): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return then.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

export default function TimeTracker({
  taskId,
  timeEntries,
  estimatedHours,
  loggedHours,
  onUpdate,
}: TimeTrackerProps) {
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    hours: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hours) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/tasks/${taskId}/time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: parseFloat(formData.hours),
          description: formData.description || undefined,
          date: formData.date,
        }),
      });

      if (!res.ok) throw new Error('Erreur');
      setFormData({ hours: '', description: '', date: new Date().toISOString().split('T')[0] });
      setShowForm(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to log time:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Supprimer cette entrée de temps ?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/tasks/${taskId}/time?entryId=${entryId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erreur');
      onUpdate();
    } catch (error) {
      console.error('Failed to delete time entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = estimatedHours ? Math.min((loggedHours / estimatedHours) * 100, 100) : 0;
  const isOvertime = estimatedHours && loggedHours > estimatedHours;

  return (
    <div>
      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Temps passé</span>
          <span className={`text-lg font-bold ${isOvertime ? 'text-red-600' : 'text-gray-900'}`}>
            {loggedHours}h
            {estimatedHours && (
              <span className="text-sm font-normal text-gray-500"> / {estimatedHours}h estimées</span>
            )}
          </span>
        </div>
        {estimatedHours && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                isOvertime ? 'bg-red-500' : 'bg-violet-600'
              }`}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Add Time Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-violet-400 hover:text-violet-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Logger du temps
        </button>
      )}

      {/* Add Time Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-violet-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Heures *
              </label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500"
                placeholder="2.5"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description (optionnel)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500"
              placeholder="Développement de la fonctionnalité X..."
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !formData.hours}
              className="flex-1 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              Enregistrer
            </button>
          </div>
        </form>
      )}

      {/* Time Entries List */}
      <div className="mt-6 space-y-3">
        <h4 className="text-sm font-medium text-gray-700">
          Entrées de temps ({timeEntries.length})
        </h4>
        {timeEntries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group"
          >
            {entry.user && (
              <div
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(entry.user.id)}`}
              >
                {getInitials(entry.user.firstName, entry.user.lastName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-gray-900">
                  {entry.user?.firstName} {entry.user?.lastName}
                </span>
                <span className="text-violet-600 font-bold">{entry.hours}h</span>
              </div>
              {entry.description && (
                <p className="text-sm text-gray-600 mt-0.5">{entry.description}</p>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <Calendar className="w-3 h-3" />
                <span>{formatRelativeTime(entry.date)}</span>
              </div>
            </div>
            {session?.user?.id === entry.userId && (
              <button
                onClick={() => handleDelete(entry.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                disabled={loading}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {timeEntries.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Aucun temps enregistré
          </p>
        )}
      </div>
    </div>
  );
}
