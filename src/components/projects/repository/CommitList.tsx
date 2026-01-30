'use client';

import { useRepositoryCommits } from '@/hooks/projects';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GitCommit, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

interface CommitListProps {
  projectId: string;
  limit?: number;
}

export default function CommitList({ projectId, limit = 20 }: CommitListProps) {
  const { commits, isLoading, isError } = useRepositoryCommits(projectId, undefined, limit);

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
        Erreur de chargement des commits
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <GitCommit className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Aucun commit trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {commits.map((commit) => (
        <div
          key={commit.sha}
          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            {commit.author?.avatar_url ? (
              <img
                src={commit.author.avatar_url}
                alt={commit.author.login}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <GitCommit className="w-4 h-4 text-gray-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {commit.commit.message.split('\n')[0]}
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span>{commit.author?.login || commit.commit.author.name}</span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(commit.commit.author.date), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
              <span>•</span>
              <code className="font-mono bg-gray-200 px-1 rounded">
                {commit.sha.slice(0, 7)}
              </code>
            </div>
          </div>
          <a
            href={commit.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      ))}
    </div>
  );
}
