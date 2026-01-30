import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/projects/improvements/[proposalId] - Get a specific improvement
export async function GET(
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
        epic: {
          select: {
            id: true,
            code: true,
            title: true,
            color: true,
          },
        },
        comments: {
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
          orderBy: { createdAt: 'asc' },
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            ownerId: true,
            members: { select: { userId: true, role: true } },
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

    // Calculate vote score
    const voteScore = improvement.votes.reduce((sum, v) => sum + v.value, 0);

    return NextResponse.json({
      ...improvement,
      voteScore,
    });
  } catch (error) {
    console.error('Get improvement error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/projects/improvements/[proposalId] - Update an improvement
export async function PUT(
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
    const { title, description, context, benefits, priority, category } = body;

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

    // Only author can edit in DRAFT or INFO_REQUESTED status
    const canEdit =
      improvement.authorId === session.user.id &&
      ['DRAFT', 'INFO_REQUESTED'].includes(improvement.status);

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Vous ne pouvez modifier cette proposition que si elle est en brouillon ou en attente d\'info' },
        { status: 403 }
      );
    }

    const updated = await prisma.improvement_proposals.update({
      where: { id: proposalId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(context !== undefined && { context }),
        ...(benefits !== undefined && { benefits }),
        ...(priority !== undefined && { priority }),
        ...(category !== undefined && { category }),
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update improvement error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/projects/improvements/[proposalId] - Delete an improvement
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

    // Only author (in DRAFT status) or owner/lead can delete
    const member = improvement.project.members.find((m) => m.userId === session.user.id);
    const canDelete =
      (improvement.authorId === session.user.id && improvement.status === 'DRAFT') ||
      improvement.project.ownerId === session.user.id ||
      (member && ['OWNER', 'LEAD'].includes(member.role));

    if (!canDelete) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await prisma.improvement_proposals.delete({
      where: { id: proposalId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete improvement error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
