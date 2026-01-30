'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useImprovements } from '@/hooks/projects';
import ProposalCard from '@/components/projects/improvements/ProposalCard';
import type { ImprovementStatus } from '@/types/projects';
import { Lightbulb, Plus, Loader2 } from 'lucide-react';

export default function ImprovementsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [filter, setFilter] = useState<ImprovementStatus | 'all'>('all');

  const { improvements, isLoading } = useImprovements(
    projectId,
    filter === 'all' ? undefined : filter
  );

  // Count by status
  const statusCounts = improvements.reduce(
    (acc, imp) => {
      acc[imp.status] = (acc[imp.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const filters: { value: ImprovementStatus | 'all'; label: string }[] = [
    { value: 'all', label: `Toutes (${improvements.length})` },
    { value: 'DRAFT', label: `Brouillons (${statusCounts.DRAFT || 0})` },
    { value: 'SUBMITTED', label: `Soumises (${statusCounts.SUBMITTED || 0})` },
    { value: 'UNDER_REVIEW', label: `En examen (${statusCounts.UNDER_REVIEW || 0})` },
    { value: 'APPROVED', label: `Approuvées (${statusCounts.APPROVED || 0})` },
    { value: 'IMPLEMENTED', label: `Implémentées (${statusCounts.IMPLEMENTED || 0})` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-7 w-7 text-violet-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Propositions d&apos;amélioration</h1>
            <p className="text-sm text-gray-500">
              Proposez et votez pour les améliorations du projet
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/projects/${projectId}/improvements/new`}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" />
          Nouvelle proposition
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === f.value
                ? 'bg-violet-100 text-violet-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : improvements.length === 0 ? (
        <div className="text-center py-12">
          <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune proposition d&apos;amélioration
          </h3>
          <p className="text-gray-500 mb-6">
            Proposez des améliorations pour le projet. Elles seront examinées par
            l&apos;équipe.
          </p>
          <Link
            href={`/dashboard/projects/${projectId}/improvements/new`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            Créer une proposition
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {improvements.map((improvement) => (
            <ProposalCard
              key={improvement.id}
              proposal={improvement}
              projectId={projectId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
