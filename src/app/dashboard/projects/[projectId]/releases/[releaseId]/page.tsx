'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRelease, useProject } from '@/hooks/projects';
import ReleaseContent from '@/components/projects/releases/ReleaseContent';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function ReleaseDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const releaseId = params.releaseId as string;
  const { data: session } = useSession();

  const { release, isLoading, mutate } = useRelease(releaseId);
  const { project } = useProject(projectId);

  // Check if user can edit
  const canEdit =
    project?.ownerId === session?.user?.id ||
    project?.members?.some(
      (m) =>
        m.userId === session?.user?.id && ['OWNER', 'LEAD'].includes(m.role)
    ) ||
    release?.authorId === session?.user?.id;

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
        <span className="text-gray-900 font-medium">{release.version}</span>
      </nav>

      {/* Content */}
      <ReleaseContent
        release={release}
        projectId={projectId}
        canEdit={canEdit}
        onUpdate={mutate}
      />
    </div>
  );
}
