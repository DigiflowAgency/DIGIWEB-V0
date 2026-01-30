'use client';

import { useState } from 'react';
import { useRepositoryPulls } from '@/hooks/projects';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GitPullRequest, ExternalLink, Loader2, AlertCircle, GitMerge, X } from 'lucide-react';

interface PullRequestListProps {
  projectId: string;
  limit?: number;
}

export default function PullRequestList({ projectId, limit = 20 }: PullRequestListProps) {
  const [state, setState] = useState<'all' | 'open' | 'closed'>('all');
  const { pulls, isLoading, isError } = useRepositoryPulls(projectId, state, limit);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
        <AlertCircle className="w-4 h-4" />
        Erreur de chargement des pull requests
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['all', 'open', 'closed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setState(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              state === s
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {s === 'all' ? 'Toutes' : s === 'open' ? 'Ouvertes' : 'Fermées'}
          </button>
        ))}
      </div>

      {/* Pull requests list */}
      {pulls.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <GitPullRequest className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Aucune pull request trouvée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pulls.map((pr) => (
            <div
              key={pr.number}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0">
                {pr.merged_at ? (
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                    <GitMerge className="w-4 h-4 text-violet-600" />
                  </div>
                ) : pr.state === 'open' ? (
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <GitPullRequest className="w-4 h-4 text-green-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  <span className="text-gray-500">#{pr.number}</span> {pr.title}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <img
                    src={pr.user.avatar_url}
                    alt={pr.user.login}
                    className="w-4 h-4 rounded-full"
                  />
                  <span>{pr.user.login}</span>
                  <span>•</span>
                  <span>
                    {pr.merged_at
                      ? `Fusionnée ${formatDistanceToNow(new Date(pr.merged_at), {
                          addSuffix: true,
                          locale: fr,
                        })}`
                      : `Ouverte ${formatDistanceToNow(new Date(pr.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}`}
                  </span>
                </div>
              </div>
              <a
                href={pr.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
