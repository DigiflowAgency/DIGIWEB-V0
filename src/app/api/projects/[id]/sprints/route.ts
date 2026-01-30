import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSprintSchema, updateSprintSchema } from '@/lib/projects/validators';
import { z } from 'zod';

// GET /api/projects/[id]/sprints - List project sprints
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const sprints = await prisma.sprints.findMany({
      where: { projectId: id },
      include: {
        _count: { select: { tasks: true } },
        retrospective: true,
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json(sprints);
  } catch (error) {
    console.error('Error fetching sprints:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/projects/[id]/sprints - Create a sprint
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = createSprintSchema.parse(body);

    // Check project exists
    const project = await prisma.projects.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    // Check for overlapping active sprints
    const overlapping = await prisma.sprints.findFirst({
      where: {
        projectId: id,
        status: 'ACTIVE',
        OR: [
          {
            startDate: { lte: new Date(data.endDate) },
            endDate: { gte: new Date(data.startDate) },
          },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json({ error: 'Un sprint actif existe déjà sur cette période' }, { status: 400 });
    }

    const sprint = await prisma.sprints.create({
      data: {
        projectId: id,
        name: data.name,
        goal: data.goal,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    return NextResponse.json(sprint, { status: 201 });
  } catch (error) {
    console.error('Error creating sprint:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/projects/[id]/sprints - Update a sprint
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { sprintId, ...data } = body;
    const validated = updateSprintSchema.parse(data);

    if (!sprintId) {
      return NextResponse.json({ error: 'ID du sprint requis' }, { status: 400 });
    }

    const sprint = await prisma.sprints.update({
      where: { id: sprintId },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.goal !== undefined && { goal: validated.goal }),
        ...(validated.startDate && { startDate: new Date(validated.startDate) }),
        ...(validated.endDate && { endDate: new Date(validated.endDate) }),
        ...(validated.status && { status: validated.status }),
        ...(validated.plannedPoints !== undefined && { plannedPoints: validated.plannedPoints }),
      },
      include: {
        _count: { select: { tasks: true } },
        retrospective: true,
      },
    });

    return NextResponse.json(sprint);
  } catch (error) {
    console.error('Error updating sprint:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/sprints - Delete a sprint
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sprintId = searchParams.get('sprintId');

    if (!sprintId) {
      return NextResponse.json({ error: 'ID du sprint requis' }, { status: 400 });
    }

    // Check if sprint has tasks - move them to backlog
    await prisma.tasks.updateMany({
      where: { sprintId },
      data: { sprintId: null },
    });

    await prisma.sprints.delete({ where: { id: sprintId } });

    return NextResponse.json({ message: 'Sprint supprimé' });
  } catch (error) {
    console.error('Error deleting sprint:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
