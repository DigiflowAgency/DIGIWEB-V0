import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/projects/[projectId]/releases - List all releases
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Check access
    const project = await prisma.projects.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    const releases = await prisma.project_releases.findMany({
      where: {
        projectId,
        ...(status ? { status: status as 'DRAFT' | 'PUBLISHED' } : {}),
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
      orderBy: [
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(releases);
  } catch (error) {
    console.error('List releases error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/releases - Create a new release
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await request.json();
    const { version, title, content, commitSha } = body;

    if (!version || !title || !content) {
      return NextResponse.json(
        { error: 'version, title et content sont requis' },
        { status: 400 }
      );
    }

    // Check access - only owner, lead, or member can create releases
    const project = await prisma.projects.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id, role: { in: ['OWNER', 'LEAD', 'MEMBER'] } } } },
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Check if version already exists
    const existing = await prisma.project_releases.findFirst({
      where: { projectId, version },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Cette version existe déjà' },
        { status: 400 }
      );
    }

    const release = await prisma.project_releases.create({
      data: {
        projectId,
        version,
        title,
        content,
        commitSha,
        authorId: session.user.id,
        status: 'DRAFT',
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

    return NextResponse.json(release);
  } catch (error) {
    console.error('Create release error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
