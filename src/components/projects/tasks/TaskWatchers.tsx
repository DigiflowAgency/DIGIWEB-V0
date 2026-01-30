'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Eye, EyeOff, UserPlus, X } from 'lucide-react';
import type { TaskWatcher, ProjectMember } from '@/types/projects';
import { getInitials, getAvatarColor } from '@/lib/projects/utils';

interface TaskWatchersProps {
  taskId: string;
  watchers: TaskWatcher[];
  projectMembers: ProjectMember[];
  onUpdate: () => void;
}

export default function TaskWatchers({ taskId, watchers, projectMembers, onUpdate }: TaskWatchersProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const isWatching = watchers.some(w => w.userId === session?.user?.id);

  const handleToggleWatch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/tasks/${taskId}/watchers`, {
        method: isWatching ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Erreur');
      onUpdate();
    } catch (error) {
      console.error('Failed to toggle watch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWatcher = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/tasks/${taskId}/watchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error('Erreur');
      onUpdate();
      setShowAddMenu(false);
    } catch (error) {
      console.error('Failed to add watcher:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWatcher = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/tasks/${taskId}/watchers?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erreur');
      onUpdate();
    } catch (error) {
      console.error('Failed to remove watcher:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableMembers = projectMembers.filter(
    m => !watchers.some(w => w.userId === m.userId)
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
          <Eye className="w-3 h-3" /> Observateurs
        </label>
        <button
          onClick={handleToggleWatch}
          disabled={loading}
          className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${
            isWatching
              ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } disabled:opacity-50`}
        >
          {isWatching ? (
            <>
              <EyeOff className="w-3 h-3" /> Ne plus suivre
            </>
          ) : (
            <>
              <Eye className="w-3 h-3" /> Suivre
            </>
          )}
        </button>
      </div>

      {/* Watchers List */}
      <div className="space-y-2">
        {watchers.map(watcher => (
          <div key={watcher.id} className="flex items-center gap-2 group">
            {watcher.user && (
              <>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(watcher.user.id)}`}
                >
                  {getInitials(watcher.user.firstName, watcher.user.lastName)}
                </div>
                <span className="text-sm flex-1">
                  {watcher.user.firstName} {watcher.user.lastName}
                </span>
                <button
                  onClick={() => handleRemoveWatcher(watcher.userId)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                  disabled={loading}
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        ))}
        {watchers.length === 0 && (
          <p className="text-xs text-gray-400">Aucun observateur</p>
        )}
      </div>

      {/* Add Watcher */}
      <div className="mt-3 pt-3 border-t border-gray-100 relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="text-xs text-gray-500 hover:text-violet-600 flex items-center gap-1"
        >
          <UserPlus className="w-3 h-3" /> Ajouter un observateur
        </button>

        {showAddMenu && availableMembers.length > 0 && (
          <div className="absolute z-10 bottom-full left-0 mb-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-48 overflow-y-auto">
            {availableMembers.map(member => (
              <button
                key={member.userId}
                onClick={() => handleAddWatcher(member.userId)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                disabled={loading}
              >
                {member.user && (
                  <>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(member.user.id)}`}
                    >
                      {getInitials(member.user.firstName, member.user.lastName)}
                    </div>
                    <span>{member.user.firstName} {member.user.lastName}</span>
                  </>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
