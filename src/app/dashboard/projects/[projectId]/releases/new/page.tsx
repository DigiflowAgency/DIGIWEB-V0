'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReleaseForm from '@/components/projects/releases/ReleaseForm';
import { ChevronRight } from 'lucide-react';

export default function NewReleasePage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href={`/dashboard/projects/${projectId}/releases`} className="hover:text-gray-700">
          Releases
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">Nouvelle release</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Créer une release</h1>
        <p className="text-sm text-gray-500 mt-1">
          Documentez les changements et nouveautés de cette version
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ReleaseForm projectId={projectId} />
      </div>
    </div>
  );
}
