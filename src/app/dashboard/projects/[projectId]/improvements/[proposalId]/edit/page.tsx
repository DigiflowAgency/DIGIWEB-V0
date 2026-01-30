'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useImprovement } from '@/hooks/projects';
import ProposalForm from '@/components/projects/improvements/ProposalForm';
import { ChevronRight, Loader2 } from 'lucide-react';

export default function EditProposalPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const proposalId = params.proposalId as string;

  const { improvement, isLoading, mutate } = useImprovement(proposalId);

  const handleSave = () => {
    mutate();
    router.push(`/dashboard/projects/${projectId}/improvements/${proposalId}`);
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

  if (!improvement) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Proposition non trouvée</p>
          <Link
            href={`/dashboard/projects/${projectId}/improvements`}
            className="text-violet-600 hover:underline"
          >
            Retour aux améliorations
          </Link>
        </div>
      </div>
    );
  }

  // Check if editable
  if (!['DRAFT', 'INFO_REQUESTED'].includes(improvement.status)) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-orange-600 mb-4">
            Cette proposition ne peut plus être modifiée
          </p>
          <Link
            href={`/dashboard/projects/${projectId}/improvements/${proposalId}`}
            className="text-violet-600 hover:underline"
          >
            Retour à la proposition
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link
          href={`/dashboard/projects/${projectId}/improvements`}
          className="hover:text-gray-700"
        >
          Améliorations
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/dashboard/projects/${projectId}/improvements/${proposalId}`}
          className="hover:text-gray-700"
        >
          {improvement.code}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">Modifier</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Modifier la proposition</h1>
        <p className="text-sm text-gray-500 mt-1">
          {improvement.code} - {improvement.title}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ProposalForm
          projectId={projectId}
          proposal={improvement}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
