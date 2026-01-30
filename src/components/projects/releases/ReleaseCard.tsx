'use client';

import Link from 'next/link';
import type { ProjectRelease } from '@/types/projects';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tag, Calendar, User, FileText, ExternalLink } from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/projects/utils';

interface ReleaseCardProps {
  release: ProjectRelease;
  projectId: string;
}

export default function ReleaseCard({ release, projectId }: ReleaseCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-violet-600" />
          <span className="font-mono text-sm font-semibold text-violet-600">
            {release.version}
          </span>
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              release.status === 'PUBLISHED'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {release.status === 'PUBLISHED' ? 'Publiée' : 'Brouillon'}
          </span>
        </div>
        <Link
          href={`/dashboard/projects/${projectId}/releases/${release.id}`}
          className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      <Link href={`/dashboard/projects/${projectId}/releases/${release.id}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-violet-600 transition-colors">
          {release.title}
        </h3>
      </Link>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {release.content.replace(/[#*`]/g, '').slice(0, 150)}
        {release.content.length > 150 && '...'}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3">
          {release.author && (
            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(release.author.id)}`}
              >
                {getInitials(release.author.firstName, release.author.lastName)}
              </div>
              <span>
                {release.author.firstName} {release.author.lastName}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {release.publishedAt
              ? `Publiée ${formatDistanceToNow(new Date(release.publishedAt), { addSuffix: true, locale: fr })}`
              : `Modifiée ${formatDistanceToNow(new Date(release.updatedAt), { addSuffix: true, locale: fr })}`}
          </span>
        </div>
      </div>

      {release.commitSha && (
        <div className="mt-2 text-xs text-gray-400">
          Commit: <code className="bg-gray-100 px-1 rounded">{release.commitSha.slice(0, 7)}</code>
        </div>
      )}
    </div>
  );
}
