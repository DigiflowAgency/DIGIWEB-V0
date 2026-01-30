import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createRetrospectiveSchema } from '@/lib/projects/validators';
import { z } from 'zod';

// GET /api/projects/[id]/sprints/[sprintId] - Get sprint details with tasks
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { sprintId } = await params;

    const sprint = await prisma.sprints.findUnique({
      where: { id: sprintId },
      include: {
        tasks: {
          include: {
            assignee: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
            status: true,
            labels: { include: { label: true } },
            _count: { select: { subtasks: true, comments: true } },
          },
          orderBy: [{ status: { position: 'asc' } }, { position: 'asc' }],
        },
        retrospective: true,
        _count: { select: { tasks: true } },
      },
    });

    if (!sprint) {
      return NextResponse.json({ error: 'Sprint non trouvé' }, { status: 404 });
    }

    return NextResponse.json(sprint);
  } catch (error) {
    console.error('Error fetching sprint:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/projects/[id]/sprints/[sprintId] - Add retrospective
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { sprintId } = await params;
    const body = await request.json();
    const data = createRetrospectiveSchema.parse(body);

    // Check if retrospective already exists
    const existing = await prisma.sprint_retrospectives.findUnique({
      where: { sprintId },
    });

    let retrospective;
    if (existing) {
      retrospective = await prisma.sprint_retrospectives.update({
        where: { sprintId },
        data,
      });
    } else {
      retrospective = await prisma.sprint_retrospectives.create({
        data: {
          sprintId,
          ...data,
        },
      });
    }

    return NextResponse.json(retrospective);
  } catch (error) {
    console.error('Error saving retrospective:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
