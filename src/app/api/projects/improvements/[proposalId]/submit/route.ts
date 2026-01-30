import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/projects/improvements/[proposalId]/submit - Submit a proposal
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

    const improvement = await prisma.improvement_proposals.findUnique({
      where: { id: proposalId },
    });

    if (!improvement) {
      return NextResponse.json({ error: 'Proposition non trouvée' }, { status: 404 });
    }

    // Only author can submit
    if (improvement.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Seul l\'auteur peut soumettre' }, { status: 403 });
    }

    // Can only submit from DRAFT or INFO_REQUESTED
    if (!['DRAFT', 'INFO_REQUESTED'].includes(improvement.status)) {
      return NextResponse.json(
        { error: 'La proposition ne peut être soumise que depuis le statut brouillon ou info demandée' },
        { status: 400 }
      );
    }

    const updated = await prisma.improvement_proposals.update({
      where: { id: proposalId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
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
      },
    });

    // TODO: Send notification to project admins/leads

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Submit improvement error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
