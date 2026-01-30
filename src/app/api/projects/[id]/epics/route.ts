import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createEpicSchema, updateEpicSchema } from '@/lib/projects/validators';
import { generateEpicCode } from '@/lib/projects/utils';
import { z } from 'zod';

// GET /api/projects/[id]/epics - List project epics
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

    const project = await prisma.projects.findUnique({
      where: { id },
      select: { statuses: { where: { isDone: true }, select: { id: true } } },
    });

    const doneStatusIds = project?.statuses.map(s => s.id) || [];

    const epics = await prisma.epics.findMany({
      where: { projectId: id },
      include: {
        _count: { select: { tasks: true } },
        tasks: {
          select: { id: true, statusId: true, storyPoints: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate progress for each epic
    const epicsWithProgress = epics.map(epic => {
      const totalTasks = epic.tasks.length;
      const completedTasks = epic.tasks.filter(t => doneStatusIds.includes(t.statusId)).length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const { tasks, ...epicWithoutTasks } = epic;
      return {
        ...epicWithoutTasks,
        progress,
        totalPoints: tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0),
        completedPoints: tasks
          .filter(t => doneStatusIds.includes(t.statusId))
          .reduce((sum, t) => sum + (t.storyPoints || 0), 0),
      };
    });

    return NextResponse.json(epicsWithProgress);
  } catch (error) {
    console.error('Error fetching epics:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/projects/[id]/epics - Create an epic
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
    const data = createEpicSchema.parse(body);

    // Get project code and existing epic codes
    const project = await prisma.projects.findUnique({
      where: { id },
      select: { code: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    const existingCodes = await prisma.epics.findMany({
      where: { projectId: id },
      select: { code: true },
    });

    const code = generateEpicCode(project.code, existingCodes.map(e => e.code));

    const epic = await prisma.epics.create({
      data: {
        projectId: id,
        code,
        title: data.title,
        description: data.description,
        color: data.color,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    return NextResponse.json(epic, { status: 201 });
  } catch (error) {
    console.error('Error creating epic:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/projects/[id]/epics - Update an epic
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
    const { epicId, ...data } = body;
    const validated = updateEpicSchema.parse(data);

    if (!epicId) {
      return NextResponse.json({ error: 'ID de l\'epic requis' }, { status: 400 });
    }

    const epic = await prisma.epics.update({
      where: { id: epicId },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.color && { color: validated.color }),
        ...(validated.status && { status: validated.status }),
        ...(validated.startDate !== undefined && { startDate: validated.startDate ? new Date(validated.startDate) : null }),
        ...(validated.endDate !== undefined && { endDate: validated.endDate ? new Date(validated.endDate) : null }),
      },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    return NextResponse.json(epic);
  } catch (error) {
    console.error('Error updating epic:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/epics - Delete an epic
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
    const epicId = searchParams.get('epicId');

    if (!epicId) {
      return NextResponse.json({ error: 'ID de l\'epic requis' }, { status: 400 });
    }

    // Check if epic has tasks
    const taskCount = await prisma.tasks.count({
      where: { epicId },
    });

    if (taskCount > 0) {
      // Unlink tasks from epic instead of blocking deletion
      await prisma.tasks.updateMany({
        where: { epicId },
        data: { epicId: null },
      });
    }

    await prisma.epics.delete({ where: { id: epicId } });

    return NextResponse.json({ message: 'Epic supprimé' });
  } catch (error) {
    console.error('Error deleting epic:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
