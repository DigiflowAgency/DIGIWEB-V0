import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createEpicFromProposal } from '@/lib/projects/improvements';

// POST /api/projects/improvements/[proposalId]/review - Review a proposal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ proposalId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { proposalId } = await params;
    const body = await request.json();
    const { action, reviewNote } = body;

    if (!action || !['approve', 'reject', 'request_info', 'start_review'].includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide. Utilisez: approve, reject, request_info, ou start_review' },
        { status: 400 }
      );
    }

    const improvement = await prisma.improvement_proposals.findUnique({
      where: { id: proposalId },
      include: {
        project: {
          select: {
            ownerId: true,
            members: { select: { userId: true, role: true } },
          },
        },
      },
    });

    if (!improvement) {
      return NextResponse.json({ error: 'Proposition non trouvée' }, { status: 404 });
    }

    // Only owner or lead can review
    const member = improvement.project.members.find((m) => m.userId === session.user.id);
    const canReview =
      improvement.project.ownerId === session.user.id ||
      (member && ['OWNER', 'LEAD'].includes(member.role));

    if (!canReview) {
      return NextResponse.json({ error: 'Seuls les leads peuvent examiner les propositions' }, { status: 403 });
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      start_review: ['SUBMITTED'],
      approve: ['UNDER_REVIEW'],
      reject: ['UNDER_REVIEW'],
      request_info: ['UNDER_REVIEW'],
    };

    if (!validTransitions[action]?.includes(improvement.status)) {
      return NextResponse.json(
        { error: `Action ${action} non valide pour le statut ${improvement.status}` },
        { status: 400 }
      );
    }

    // Get new status based on action
    const statusMap: Record<string, string> = {
      start_review: 'UNDER_REVIEW',
      approve: 'APPROVED',
      reject: 'REJECTED',
      request_info: 'INFO_REQUESTED',
    };

    const updated = await prisma.improvement_proposals.update({
      where: { id: proposalId },
      data: {
        status: statusMap[action] as any,
        reviewerId: session.user.id,
        reviewNote: reviewNote || null,
        reviewedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // If approved, create an Epic automatically
    let epicId: string | null = null;
    if (action === 'approve') {
      try {
        const result = await createEpicFromProposal(proposalId);
        epicId = result.epicId;
      } catch (epicError) {
        console.error('Failed to create epic:', epicError);
        // Don't fail the review if epic creation fails
      }
    }

    // TODO: Send notification to proposal author

    return NextResponse.json({
      ...updated,
      epicId,
    });
  } catch (error) {
    console.error('Review improvement error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
