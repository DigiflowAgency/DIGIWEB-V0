import { prisma } from '@/lib/prisma';
import type { ImprovementStatus } from '@/types/projects';

// Generate unique improvement code for a project
export async function generateImprovementCode(projectId: string): Promise<string> {
  const count = await prisma.improvement_proposals.count({
    where: { projectId },
  });

  return `IMP-${String(count + 1).padStart(3, '0')}`;
}

// Generate unique epic code for a project
export async function generateEpicCode(projectId: string): Promise<string> {
  const count = await prisma.epics.count({
    where: { projectId },
  });

  return `EPIC-${String(count + 1).padStart(3, '0')}`;
}

// Create an epic from an approved improvement proposal
export async function createEpicFromProposal(proposalId: string): Promise<{ epicId: string }> {
  const proposal = await prisma.improvement_proposals.findUnique({
    where: { id: proposalId },
    include: {
      project: { select: { id: true } },
    },
  });

  if (!proposal) {
    throw new Error('Proposition non trouvée');
  }

  if (proposal.status !== 'APPROVED') {
    throw new Error('La proposition doit être approuvée pour créer un Epic');
  }

  const epicCode = await generateEpicCode(proposal.projectId);

  const epic = await prisma.epics.create({
    data: {
      projectId: proposal.projectId,
      code: epicCode,
      title: proposal.title,
      description: buildEpicDescription(proposal),
      color: getCategoryColor(proposal.category),
      status: 'TODO',
    },
  });

  // Link epic to proposal and update status
  await prisma.improvement_proposals.update({
    where: { id: proposalId },
    data: {
      epicId: epic.id,
      status: 'IMPLEMENTED',
    },
  });

  return { epicId: epic.id };
}

function buildEpicDescription(proposal: {
  code: string;
  description: string;
  context?: string | null;
  benefits?: string | null;
}): string {
  let description = `## Origine\nProposition d'amélioration ${proposal.code}\n\n`;
  description += `## Description\n${proposal.description}\n\n`;

  if (proposal.context) {
    description += `## Contexte\n${proposal.context}\n\n`;
  }

  if (proposal.benefits) {
    description += `## Bénéfices attendus\n${proposal.benefits}\n\n`;
  }

  return description;
}

function getCategoryColor(category?: string | null): string {
  const colors: Record<string, string> = {
    UX: '#10B981', // green
    PERFORMANCE: '#F59E0B', // amber
    FEATURE: '#8B5CF6', // violet
    BUG_FIX: '#EF4444', // red
    SECURITY: '#DC2626', // red-600
    DOCUMENTATION: '#6B7280', // gray
    OTHER: '#3B82F6', // blue
  };

  return colors[category || 'OTHER'] || '#8B5CF6';
}

// Validate status transition
export function isValidStatusTransition(
  currentStatus: ImprovementStatus,
  newStatus: ImprovementStatus
): boolean {
  const validTransitions: Record<ImprovementStatus, ImprovementStatus[]> = {
    DRAFT: ['SUBMITTED'],
    SUBMITTED: ['UNDER_REVIEW'],
    UNDER_REVIEW: ['APPROVED', 'REJECTED', 'INFO_REQUESTED'],
    INFO_REQUESTED: ['UNDER_REVIEW', 'SUBMITTED'],
    APPROVED: ['IMPLEMENTED'],
    REJECTED: [], // Terminal state
    IMPLEMENTED: [], // Terminal state
  };

  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
}

// Get status label in French
export function getStatusLabel(status: ImprovementStatus): string {
  const labels: Record<ImprovementStatus, string> = {
    DRAFT: 'Brouillon',
    SUBMITTED: 'Soumise',
    UNDER_REVIEW: 'En examen',
    INFO_REQUESTED: 'Info demandée',
    APPROVED: 'Approuvée',
    REJECTED: 'Refusée',
    IMPLEMENTED: 'Implémentée',
  };

  return labels[status] || status;
}

// Get category label in French
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    UX: 'Expérience utilisateur',
    PERFORMANCE: 'Performance',
    FEATURE: 'Nouvelle fonctionnalité',
    BUG_FIX: 'Correction de bug',
    SECURITY: 'Sécurité',
    DOCUMENTATION: 'Documentation',
    OTHER: 'Autre',
  };

  return labels[category] || category;
}
