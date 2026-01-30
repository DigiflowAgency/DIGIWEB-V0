'use client';

import Link from 'next/link';
import type { ImprovementProposal } from '@/types/projects';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import ProposalStatusBadge from './ProposalStatusBadge';
import { MessageSquare, ThumbsUp, ThumbsDown, ExternalLink, Tag, Zap } from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/projects/utils';

interface ProposalCardProps {
  proposal: ImprovementProposal;
  projectId: string;
}

const categoryLabels: Record<string, string> = {
  UX: 'Expérience utilisateur',
  PERFORMANCE: 'Performance',
  FEATURE: 'Nouvelle fonctionnalité',
  BUG_FIX: 'Correction',
  SECURITY: 'Sécurité',
  DOCUMENTATION: 'Documentation',
  OTHER: 'Autre',
};

const priorityColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-green-100 text-green-700',
};

export default function ProposalCard({ proposal, projectId }: ProposalCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            {proposal.code}
          </span>
          <ProposalStatusBadge status={proposal.status} size="sm" />
          {proposal.category && (
            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {categoryLabels[proposal.category] || proposal.category}
            </span>
          )}
          {proposal.priority && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                priorityColors[proposal.priority] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {proposal.priority}
            </span>
          )}
        </div>
        <Link
          href={`/dashboard/projects/${projectId}/improvements/${proposal.id}`}
          className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      <Link href={`/dashboard/projects/${projectId}/improvements/${proposal.id}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-violet-600 transition-colors">
          {proposal.title}
        </h3>
      </Link>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{proposal.description}</p>

      {/* Epic link */}
      {proposal.epic && (
        <div className="mb-4">
          <Link
            href={`/dashboard/projects/${projectId}/epics`}
            className="inline-flex items-center gap-2 px-2 py-1 bg-violet-50 text-violet-700 rounded text-sm hover:bg-violet-100"
          >
            <Zap className="w-3.5 h-3.5" />
            Epic: {proposal.epic.code} - {proposal.epic.title}
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4">
          {proposal.author && (
            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(proposal.author.id)}`}
              >
                {getInitials(proposal.author.firstName, proposal.author.lastName)}
              </div>
              <span>
                {proposal.author.firstName} {proposal.author.lastName}
              </span>
            </div>
          )}
          <span>
            {formatDistanceToNow(new Date(proposal.createdAt), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Vote score */}
          <div className="flex items-center gap-1">
            {(proposal.voteScore || 0) >= 0 ? (
              <ThumbsUp className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <ThumbsDown className="w-3.5 h-3.5 text-red-500" />
            )}
            <span
              className={
                (proposal.voteScore || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }
            >
              {proposal.voteScore || 0}
            </span>
          </div>

          {/* Comments count */}
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{proposal._count?.comments || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
