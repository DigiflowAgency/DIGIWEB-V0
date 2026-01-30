'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRelease } from '@/hooks/projects';
import ReleaseForm from '@/components/projects/releases/ReleaseForm';
import { ChevronRight, Loader2 } from 'lucide-react';

export default function EditReleasePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const releaseId = params.releaseId as string;

  const { release, isLoading, mutate } = useRelease(releaseId);

  const handleSave = () => {
    mutate();
    router.push(`/dashboard/projects/${projectId}/releases/${releaseId}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </div>
    );
  }

  if (!release) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Release non trouvée</p>
          <Link
            href={`/dashboard/projects/${projectId}/releases`}
            className="text-violet-600 hover:underline"
          >
            Retour aux releases
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href={`/dashboard/projects/${projectId}/releases`} className="hover:text-gray-700">
          Releases
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/dashboard/projects/${projectId}/releases/${releaseId}`}
          className="hover:text-gray-700"
        >
          {release.version}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">Modifier</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Modifier la release</h1>
        <p className="text-sm text-gray-500 mt-1">
          {release.version} - {release.title}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ReleaseForm projectId={projectId} release={release} onSave={handleSave} />
      </div>
    </div>
  );
}
