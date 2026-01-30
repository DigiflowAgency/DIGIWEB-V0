import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/projects/releases/[releaseId]/publish - Publish a release
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ releaseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { releaseId } = await params;

    const release = await prisma.project_releases.findUnique({
      where: { id: releaseId },
      include: {
        project: {
          select: {
            ownerId: true,
            members: { select: { userId: true, role: true } },
          },
        },
      },
    });

    if (!release) {
      return NextResponse.json({ error: 'Release non trouvée' }, { status: 404 });
    }

    // Check access - only owner or lead can publish
    const member = release.project.members.find((m) => m.userId === session.user.id);
    const canPublish =
      release.project.ownerId === session.user.id ||
      (member && ['OWNER', 'LEAD'].includes(member.role));

    if (!canPublish) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    if (release.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Cette release est déjà publiée' },
        { status: 400 }
      );
    }

    const updated = await prisma.project_releases.update({
      where: { id: releaseId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
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
    console.error('Publish release error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/projects/releases/[releaseId]/publish - Unpublish a release
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ releaseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { releaseId } = await params;

    const release = await prisma.project_releases.findUnique({
      where: { id: releaseId },
      include: {
        project: {
          select: {
            ownerId: true,
            members: { select: { userId: true, role: true } },
          },
        },
      },
    });

    if (!release) {
      return NextResponse.json({ error: 'Release non trouvée' }, { status: 404 });
    }

    // Only owner can unpublish
    if (release.project.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const updated = await prisma.project_releases.update({
      where: { id: releaseId },
      data: {
        status: 'DRAFT',
        publishedAt: null,
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
    console.error('Unpublish release error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
