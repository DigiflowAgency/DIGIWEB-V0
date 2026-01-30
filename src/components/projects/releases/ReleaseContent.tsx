'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProjectRelease } from '@/types/projects';
import { useReleaseMutations } from '@/hooks/projects';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import {
  Tag,
  Calendar,
  Edit2,
  Trash2,
  Send,
  ArrowDownToLine,
  Loader2,
  GitCommit,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/projects/utils';
import Link from 'next/link';

interface ReleaseContentProps {
  release: ProjectRelease;
  projectId: string;
  canEdit?: boolean;
  onUpdate?: () => void;
}

export default function ReleaseContent({
  release,
  projectId,
  canEdit = false,
  onUpdate,
}: ReleaseContentProps) {
  const router = useRouter();
  const { publishRelease, unpublishRelease, deleteRelease, loading } = useReleaseMutations();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handlePublish = async () => {
    try {
      await publishRelease(release.id);
      onUpdate?.();
    } catch (err) {
      console.error('Publish error:', err);
    }
  };

  const handleUnpublish = async () => {
    try {
      await unpublishRelease(release.id);
      onUpdate?.();
    } catch (err) {
      console.error('Unpublish error:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRelease(release.id);
      router.push(`/dashboard/projects/${projectId}/releases`);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Tag className="w-8 h-8 text-violet-600" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-bold text-violet-600">
                  {release.version}
                </span>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    release.status === 'PUBLISHED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {release.status === 'PUBLISHED' ? 'Publiée' : 'Brouillon'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{release.title}</h1>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              {release.status === 'DRAFT' ? (
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Publier
                </button>
              ) : (
                <button
                  onClick={handleUnpublish}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="w-4 h-4" />
                  )}
                  Dépublier
                </button>
              )}
              <Link
                href={`/dashboard/projects/${projectId}/releases/${release.id}/edit`}
                className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
              >
                <Edit2 className="w-5 h-5" />
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          {release.author && (
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(release.author.id)}`}
              >
                {getInitials(release.author.firstName, release.author.lastName)}
              </div>
              <span>
                {release.author.firstName} {release.author.lastName}
              </span>
            </div>
          )}

          {release.publishedAt && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>
                Publiée le {format(new Date(release.publishedAt), 'dd MMMM yyyy', { locale: fr })}
              </span>
            </div>
          )}

          {release.commitSha && (
            <div className="flex items-center gap-1.5">
              <GitCommit className="w-4 h-4" />
              <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                {release.commitSha.slice(0, 7)}
              </code>
            </div>
          )}

          {release.githubReleaseUrl && (
            <a
              href={release.githubReleaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-violet-600 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Voir sur GitHub
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="prose prose-violet max-w-none">
          <ReactMarkdown>{release.content}</ReactMarkdown>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Supprimer cette release ?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Cette action est irréversible. La release "{release.version} - {release.title}" sera
              définitivement supprimée.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
