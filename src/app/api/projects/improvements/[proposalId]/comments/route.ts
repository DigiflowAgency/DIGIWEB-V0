import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/projects/improvements/[proposalId]/comments - Get comments
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

    // Check if user can see internal comments
    const member = improvement.project.members.find((m) => m.userId === session.user.id);
    const canSeeInternal =
      improvement.project.ownerId === session.user.id ||
      (member && ['OWNER', 'LEAD', 'MEMBER'].includes(member.role));

    const comments = await prisma.improvement_comments.findMany({
      where: {
        proposalId,
        ...(canSeeInternal ? {} : { isInternal: false }),
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
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/projects/improvements/[proposalId]/comments - Add comment
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
    const { content, isInternal } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Le contenu est requis' }, { status: 400 });
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

    // Check access
    const hasAccess =
      improvement.project.ownerId === session.user.id ||
      improvement.project.members.some((m) => m.userId === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Only team members can post internal comments
    const member = improvement.project.members.find((m) => m.userId === session.user.id);
    const canPostInternal =
      improvement.project.ownerId === session.user.id ||
      (member && ['OWNER', 'LEAD', 'MEMBER'].includes(member.role));

    const comment = await prisma.improvement_comments.create({
      data: {
        proposalId,
        authorId: session.user.id,
        content,
        isInternal: canPostInternal ? !!isInternal : false,
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

    // TODO: Notify proposal author and participants

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
