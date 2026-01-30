'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useImprovement, useProject } from '@/hooks/projects';
import { useSession } from 'next-auth/react';
import ProposalStatusBadge from '@/components/projects/improvements/ProposalStatusBadge';
import ProposalActions from '@/components/projects/improvements/ProposalActions';
import ProposalVoting from '@/components/projects/improvements/ProposalVoting';
import ProposalComments from '@/components/projects/improvements/ProposalComments';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronRight,
  Loader2,
  Edit2,
  Trash2,
  Zap,
  Calendar,
  User,
  Tag,
  MessageSquare,
} from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/projects/utils';
import { useRouter } from 'next/navigation';
import { useImprovementMutations } from '@/hooks/projects';
import { useState } from 'react';

const categoryLabels: Record<string, string> = {
  UX: 'Expérience utilisateur',
  PERFORMANCE: 'Performance',
  FEATURE: 'Nouvelle fonctionnalité',
  BUG_FIX: 'Correction de bug',
  SECURITY: 'Sécurité',
  DOCUMENTATION: 'Documentation',
  OTHER: 'Autre',
};

const priorityLabels: Record<string, { label: string; color: string }> = {
  CRITICAL: { label: 'Critique', color: 'text-red-600 bg-red-50' },
  HIGH: { label: 'Haute', color: 'text-orange-600 bg-orange-50' },
  MEDIUM: { label: 'Moyenne', color: 'text-yellow-600 bg-yellow-50' },
  LOW: { label: 'Basse', color: 'text-green-600 bg-green-50' },
};

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const proposalId = params.proposalId as string;
  const { data: session } = useSession();

  const { improvement, isLoading, mutate } = useImprovement(proposalId);
  const { project } = useProject(projectId);
  const { deleteImprovement, loading: deleteLoading } = useImprovementMutations();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Check permissions
  const isAuthor = improvement?.authorId === session?.user?.id;
  const member = project?.members?.find((m) => m.userId === session?.user?.id);
  const canReview =
    project?.ownerId === session?.user?.id ||
    (member && ['OWNER', 'LEAD'].includes(member.role));
  const canPostInternal =
    project?.ownerId === session?.user?.id ||
    (member && ['OWNER', 'LEAD', 'MEMBER'].includes(member.role));
  const canEdit =
    isAuthor && ['DRAFT', 'INFO_REQUESTED'].includes(improvement?.status || '');
  const canDelete =
    (isAuthor && improvement?.status === 'DRAFT') || canReview;

  const handleDelete = async () => {
    try {
      await deleteImprovement(proposalId);
      router.push(`/dashboard/projects/${projectId}/improvements`);
    } catch (err) {
      console.error('Delete error:', err);
    }
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
        <span className="text-gray-900 font-medium">{improvement.code}</span>
      </nav>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {improvement.code}
              </span>
              <ProposalStatusBadge status={improvement.status} />
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <Link
                  href={`/dashboard/projects/${projectId}/improvements/${proposalId}/edit`}
                  className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                >
                  <Edit2 className="w-5 h-5" />
                </Link>
              )}
              {canDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">{improvement.title}</h1>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
            {improvement.author && (
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(improvement.author.id)}`}
                >
                  {getInitials(improvement.author.firstName, improvement.author.lastName)}
                </div>
                <span>
                  {improvement.author.firstName} {improvement.author.lastName}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(improvement.createdAt), 'dd MMMM yyyy', { locale: fr })}
              </span>
            </div>
            {improvement.category && (
              <div className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                <span>{categoryLabels[improvement.category] || improvement.category}</span>
              </div>
            )}
            {improvement.priority && (
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  priorityLabels[improvement.priority]?.color || ''
                }`}
              >
                {priorityLabels[improvement.priority]?.label || improvement.priority}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
              {improvement.description}
            </p>
          </div>

          {/* Context */}
          {improvement.context && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Contexte / Problème actuel
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap bg-blue-50 rounded-lg p-4">
                {improvement.context}
              </p>
            </div>
          )}

          {/* Benefits */}
          {improvement.benefits && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Bénéfices attendus
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap bg-green-50 rounded-lg p-4">
                {improvement.benefits}
              </p>
            </div>
          )}

          {/* Epic link */}
          {improvement.epic && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Epic créé</h3>
              <Link
                href={`/dashboard/projects/${projectId}/epics`}
                className="inline-flex items-center gap-2 px-3 py-2 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100"
              >
                <Zap className="w-4 h-4" />
                <span className="font-medium">
                  {improvement.epic.code} - {improvement.epic.title}
                </span>
              </Link>
            </div>
          )}

          {/* Review info */}
          {improvement.reviewer && improvement.reviewedAt && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <User className="w-4 h-4" />
                <span>
                  Examiné par {improvement.reviewer.firstName} {improvement.reviewer.lastName} le{' '}
                  {format(new Date(improvement.reviewedAt), 'dd/MM/yyyy', { locale: fr })}
                </span>
              </div>
              {improvement.reviewNote && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                  <strong>Note :</strong> {improvement.reviewNote}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <ProposalActions
          proposal={improvement}
          canReview={canReview || false}
          onUpdate={mutate}
        />

        {/* Voting */}
        {!['DRAFT', 'REJECTED', 'IMPLEMENTED'].includes(improvement.status) && (
          <ProposalVoting
            proposalId={proposalId}
            votes={improvement.votes || []}
            voteScore={improvement.voteScore || 0}
            onUpdate={mutate}
          />
        )}

        {/* Comments */}
        <ProposalComments
          proposalId={proposalId}
          comments={improvement.comments || []}
          canPostInternal={canPostInternal || false}
          onUpdate={mutate}
        />
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Supprimer cette proposition ?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Cette action est irréversible. La proposition "{improvement.code} -{' '}
              {improvement.title}" sera définitivement supprimée.
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
                disabled={deleteLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
