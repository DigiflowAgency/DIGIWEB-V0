'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useReleases } from '@/hooks/projects';
import ReleaseCard from '@/components/projects/releases/ReleaseCard';
import { Tag, Plus, Loader2, Filter } from 'lucide-react';

export default function ReleasesPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [filter, setFilter] = useState<'all' | 'DRAFT' | 'PUBLISHED'>('all');

  const { releases, isLoading } = useReleases(
    projectId,
    filter === 'all' ? undefined : filter
  );

  const publishedCount = releases.filter((r) => r.status === 'PUBLISHED').length;
  const draftCount = releases.filter((r) => r.status === 'DRAFT').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Tag className="h-7 w-7 text-violet-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notes de mise à jour</h1>
            <p className="text-sm text-gray-500">
              Documentez les changements et nouveautés du projet
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/projects/${projectId}/releases/new`}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" />
          Nouvelle release
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Toutes ({releases.length})
          </button>
          <button
            onClick={() => setFilter('PUBLISHED')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === 'PUBLISHED'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Publiées ({publishedCount})
          </button>
          <button
            onClick={() => setFilter('DRAFT')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === 'DRAFT'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Brouillons ({draftCount})
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : releases.length === 0 ? (
        <div className="text-center py-12">
          <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune note de mise à jour
          </h3>
          <p className="text-gray-500 mb-6">
            Créez votre première release pour documenter les changements du projet.
          </p>
          <Link
            href={`/dashboard/projects/${projectId}/releases/new`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            Créer une release
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {releases.map((release) => (
            <ReleaseCard key={release.id} release={release} projectId={projectId} />
          ))}
        </div>
      )}
    </div>
  );
}
