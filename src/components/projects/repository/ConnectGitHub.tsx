'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRepository, useRepositoryMutations } from '@/hooks/projects';
import { Github, Link2, Unlink, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

interface ConnectGitHubProps {
  projectId: string;
}

export default function ConnectGitHub({ projectId }: ConnectGitHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { repository, isLoading, mutate } = useRepository(projectId);
  const { connectRepository, disconnectRepository, loading, error } = useRepositoryMutations();

  const [githubUrl, setGithubUrl] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Check if we just connected via OAuth
  useEffect(() => {
    if (searchParams.get('github_connected') === 'true') {
      // Show the form to enter the repo URL
      setShowForm(true);
      // Clean up URL
      router.replace(`/dashboard/projects/${projectId}/settings`);
    }
  }, [searchParams, projectId, router]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectionError(null);

    try {
      await connectRepository(projectId, githubUrl);
      mutate();
      setShowForm(false);
      setGithubUrl('');
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : 'Erreur de connexion');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Déconnecter ce repository ?')) return;

    try {
      await disconnectRepository(projectId);
      mutate();
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  const initiateOAuth = () => {
    window.location.href = `/api/auth/github?projectId=${projectId}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Chargement...
        </div>
      </div>
    );
  }

  // Connected state
  if (repository) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Github className="w-6 h-6 text-gray-900" />
            <h3 className="text-lg font-semibold text-gray-900">Repository GitHub</h3>
          </div>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            Connecté
          </span>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-4">
          <Github className="w-8 h-8 text-gray-700" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">
              {repository.githubOwner}/{repository.githubRepo}
            </p>
            <p className="text-sm text-gray-500">
              Branche par défaut: {repository.defaultBranch}
            </p>
          </div>
          <a
            href={repository.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        <button
          onClick={handleDisconnect}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 disabled:opacity-50"
        >
          <Unlink className="w-4 h-4" />
          Déconnecter
        </button>
      </div>
    );
  }

  // Not connected state
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Github className="w-6 h-6 text-gray-900" />
        <h3 className="text-lg font-semibold text-gray-900">Repository GitHub</h3>
      </div>

      {!showForm ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Connectez un repository GitHub pour suivre les commits, les PRs et synchroniser les releases.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              <Link2 className="w-4 h-4" />
              Connecter par URL
            </button>
            <button
              onClick={initiateOAuth}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Github className="w-4 h-4" />
              Se connecter avec GitHub
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL du repository GitHub
            </label>
            <input
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/owner/repo ou owner/repo"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Pour les repositories privés, connectez-vous d'abord avec GitHub OAuth
            </p>
          </div>

          {(connectionError || error) && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {connectionError || error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !githubUrl}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              Connecter
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setGithubUrl('');
                setConnectionError(null);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
