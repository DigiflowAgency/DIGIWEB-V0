import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/projects/improvements/[proposalId]/votes - Vote on a proposal
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
    const { value } = body;

    if (value !== 1 && value !== -1) {
      return NextResponse.json(
        { error: 'La valeur du vote doit être 1 ou -1' },
        { status: 400 }
      );
    }

    const improvement = await prisma.improvement_proposals.findUnique({
      where: { id: proposalId },
      include: {
        project: {
          select: {
            ownerId: true,
            members: { select: { userId: true } },
          },
        },
      },
    });

    if (!improvement) {
      return NextResponse.json({ error: 'Proposition non trouvée' }, { status: 404 });
    }

    // Check access
    const hasAccess =
      improvement.project.ownerId === session.user.id ||
      improvement.project.members.some((m) => m.userId === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Upsert vote
    const vote = await prisma.improvement_votes.upsert({
      where: {
        proposalId_userId: {
          proposalId,
          userId: session.user.id,
        },
      },
      create: {
        proposalId,
        userId: session.user.id,
        value,
      },
      update: {
        value,
      },
    });

    // Get updated vote count
    const votes = await prisma.improvement_votes.findMany({
      where: { proposalId },
      select: { value: true },
    });
    const voteScore = votes.reduce((sum, v) => sum + v.value, 0);

    return NextResponse.json({ vote, voteScore });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/projects/improvements/[proposalId]/votes - Remove vote
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ proposalId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { proposalId } = await params;

    await prisma.improvement_votes.deleteMany({
      where: {
        proposalId,
        userId: session.user.id,
      },
    });

    // Get updated vote count
    const votes = await prisma.improvement_votes.findMany({
      where: { proposalId },
      select: { value: true },
    });
    const voteScore = votes.reduce((sum, v) => sum + v.value, 0);

    return NextResponse.json({ voteScore });
  } catch (error) {
    console.error('Remove vote error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
