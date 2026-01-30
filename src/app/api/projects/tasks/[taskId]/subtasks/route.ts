import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createTaskSchema } from '@/lib/projects/validators';
import { generateTaskCode } from '@/lib/projects/utils';
import { z } from 'zod';

// GET /api/projects/tasks/[taskId]/subtasks - Get subtasks
export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { taskId } = await params;

    const subtasks = await prisma.tasks.findMany({
      where: { parentId: taskId },
      include: {
        status: true,
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json(subtasks);
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/projects/tasks/[taskId]/subtasks - Create subtask
export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await request.json();
    const data = createTaskSchema.parse(body);

    // Get parent task
    const parent = await prisma.tasks.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            statuses: { where: { isDefault: true }, take: 1 },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Tâche parente non trouvée' }, { status: 404 });
    }

    // Generate task code
    const existingCodes = await prisma.tasks.findMany({
      where: { projectId: parent.projectId },
      select: { code: true },
    });
    const code = generateTaskCode(parent.project.code, existingCodes.map(t => t.code));

    // Get default status
    const defaultStatus = parent.project.statuses[0];
    if (!defaultStatus) {
      return NextResponse.json({ error: 'Aucun statut par défaut configuré' }, { status: 400 });
    }

    // Get max position
    const maxPosition = await prisma.tasks.findFirst({
      where: { parentId: taskId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const subtask = await prisma.tasks.create({
      data: {
        projectId: parent.projectId,
        parentId: taskId,
        epicId: parent.epicId,
        sprintId: parent.sprintId,
        code,
        title: data.title,
        type: 'SUBTASK',
        description: data.description,
        priority: data.priority || parent.priority,
        storyPoints: data.storyPoints,
        estimatedHours: data.estimatedHours,
        dueDate: data.dueDate ? new Date(data.dueDate) : parent.dueDate,
        statusId: defaultStatus.id,
        assigneeId: data.assigneeId,
        reporterId: session.user.id,
        position: (maxPosition?.position ?? -1) + 1,
      },
      include: {
        status: true,
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json(subtask, { status: 201 });
  } catch (error) {
    console.error('Error creating subtask:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
