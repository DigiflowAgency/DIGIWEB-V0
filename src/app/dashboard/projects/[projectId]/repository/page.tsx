'use client';

import { useParams } from 'next/navigation';
import { useRepository } from '@/hooks/projects';
import ConnectGitHub from '@/components/projects/repository/ConnectGitHub';
import CommitList from '@/components/projects/repository/CommitList';
import PullRequestList from '@/components/projects/repository/PullRequestList';
import { Github, GitCommit, GitPullRequest, Loader2, ExternalLink, Settings } from 'lucide-react';
import Link from 'next/link';

export default function RepositoryPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const { repository, isLoading } = useRepository(projectId);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </div>
    );
  }

  // Not connected - show connect form
  if (!repository) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <Github className="h-7 w-7 text-gray-900" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Repository</h1>
            <p className="text-sm text-gray-500">
              Connectez votre repository GitHub pour suivre les commits et PRs
            </p>
          </div>
        </div>

        <div className="max-w-xl">
          <ConnectGitHub projectId={projectId} />
        </div>
      </div>
    );
  }

  // Connected - show repository info
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Github className="h-7 w-7 text-gray-900" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {repository.githubOwner}/{repository.githubRepo}
              </h1>
              <a
                href={repository.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-sm text-gray-500">
              Branche par défaut: {repository.defaultBranch}
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/projects/${projectId}/settings`}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Settings className="w-4 h-4" />
          Paramètres
        </Link>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commits */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <GitCommit className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Derniers commits</h2>
          </div>
          <CommitList projectId={projectId} limit={10} />
        </div>

        {/* Pull Requests */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <GitPullRequest className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Pull Requests</h2>
          </div>
          <PullRequestList projectId={projectId} limit={10} />
        </div>
      </div>
    </div>
  );
}
