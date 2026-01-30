import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/projects/releases/[releaseId] - Get a specific release
export async function GET(
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
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            ownerId: true,
            members: { select: { userId: true } },
          },
        },
      },
    });

    if (!release) {
      return NextResponse.json({ error: 'Release non trouvée' }, { status: 404 });
    }

    // Check access
    const hasAccess =
      release.project.ownerId === session.user.id ||
      release.project.members.some((m) => m.userId === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json(release);
  } catch (error) {
    console.error('Get release error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/projects/releases/[releaseId] - Update a release
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ releaseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { releaseId } = await params;
    const body = await request.json();
    const { version, title, content, commitSha } = body;

    const release = await prisma.project_releases.findUnique({
      where: { id: releaseId },
      include: {
        project: {
          select: {
            id: true,
            ownerId: true,
            members: { select: { userId: true, role: true } },
          },
        },
      },
    });

    if (!release) {
      return NextResponse.json({ error: 'Release non trouvée' }, { status: 404 });
    }

    // Check access - only author, owner, or lead can update
    const member = release.project.members.find((m) => m.userId === session.user.id);
    const canEdit =
      release.authorId === session.user.id ||
      release.project.ownerId === session.user.id ||
      (member && ['OWNER', 'LEAD'].includes(member.role));

    if (!canEdit) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Can't edit published releases (except by owner)
    if (release.status === 'PUBLISHED' && release.project.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Impossible de modifier une release publiée' },
        { status: 400 }
      );
    }

    const updated = await prisma.project_releases.update({
      where: { id: releaseId },
      data: {
        ...(version && { version }),
        ...(title && { title }),
        ...(content && { content }),
        ...(commitSha !== undefined && { commitSha }),
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
    console.error('Update release error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/projects/releases/[releaseId] - Delete a release
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

    // Check access - only author, owner, or lead can delete
    const member = release.project.members.find((m) => m.userId === session.user.id);
    const canDelete =
      release.authorId === session.user.id ||
      release.project.ownerId === session.user.id ||
      (member && ['OWNER', 'LEAD'].includes(member.role));

    if (!canDelete) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await prisma.project_releases.delete({
      where: { id: releaseId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete release error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
