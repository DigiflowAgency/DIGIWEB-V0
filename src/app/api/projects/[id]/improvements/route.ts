import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateImprovementCode } from '@/lib/projects/improvements';

// GET /api/projects/[projectId]/improvements - List all improvements
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

    const improvements = await prisma.improvement_proposals.findMany({
      where: {
        projectId,
        ...(status ? { status: status as any } : {}),
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
        epic: {
          select: {
            id: true,
            code: true,
            title: true,
            color: true,
          },
        },
        _count: {
          select: {
            comments: true,
            votes: true,
          },
        },
        votes: {
          select: { value: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Calculate vote score
    const improvementsWithScore = improvements.map((imp) => ({
      ...imp,
      voteScore: imp.votes.reduce((sum, v) => sum + v.value, 0),
      votes: undefined, // Remove raw votes from response
    }));

    return NextResponse.json(improvementsWithScore);
  } catch (error) {
    console.error('List improvements error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/improvements - Create a new improvement
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
    const { title, description, context, benefits, priority, category } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'title et description sont requis' },
        { status: 400 }
      );
    }

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
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const code = await generateImprovementCode(projectId);

    const improvement = await prisma.improvement_proposals.create({
      data: {
        code,
        projectId,
        authorId: session.user.id,
        title,
        description,
        context,
        benefits,
        priority,
        category,
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

    return NextResponse.json(improvement);
  } catch (error) {
    console.error('Create improvement error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
