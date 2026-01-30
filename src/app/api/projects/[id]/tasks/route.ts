import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createTaskSchema, tasksQuerySchema } from '@/lib/projects/validators';
import { generateTaskCode } from '@/lib/projects/utils';
import { z } from 'zod';

// GET /api/projects/[id]/tasks - List project tasks
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
    const { searchParams } = new URL(request.url);

    const query = tasksQuerySchema.parse({
      search: searchParams.get('search') || undefined,
      statusId: searchParams.get('statusId') || undefined,
      epicId: searchParams.get('epicId') || undefined,
      sprintId: searchParams.get('sprintId') || undefined,
      assigneeId: searchParams.get('assigneeId') || undefined,
      priority: searchParams.get('priority') || undefined,
      type: searchParams.get('type') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    });

    const where: Record<string, unknown> = {
      projectId: id,
      parentId: null, // Only top-level tasks
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { code: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    if (query.statusId) where.statusId = query.statusId;
    if (query.epicId) where.epicId = query.epicId;
    if (query.sprintId) where.sprintId = query.sprintId;
    if (query.assigneeId) where.assigneeId = query.assigneeId;
    if (query.priority) where.priority = query.priority;
    if (query.type) where.type = query.type;

    const tasks = await prisma.tasks.findMany({
      where,
      include: {
        status: true,
        epic: { select: { id: true, code: true, title: true, color: true } },
        sprint: { select: { id: true, name: true } },
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        reporter: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        labels: { include: { label: true } },
        _count: { select: { subtasks: true, comments: true, attachments: true } },
      },
      orderBy: [{ status: { position: 'asc' } }, { position: 'asc' }],
      take: query.limit,
      skip: query.offset,
    });

    const total = await prisma.tasks.count({ where });

    return NextResponse.json({ tasks, total });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Paramètres invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/projects/[id]/tasks - Create a task
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
    const data = createTaskSchema.parse(body);

    // Get project
    const project = await prisma.projects.findUnique({
      where: { id },
      include: {
        statuses: { where: { isDefault: true }, take: 1 },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    // Generate task code
    const existingCodes = await prisma.tasks.findMany({
      where: { projectId: id },
      select: { code: true },
    });
    const code = generateTaskCode(project.code, existingCodes.map(t => t.code));

    // Get default status
    const defaultStatus = project.statuses[0];
    if (!defaultStatus) {
      return NextResponse.json({ error: 'Aucun statut par défaut configuré' }, { status: 400 });
    }

    // Get max position for the status
    const maxPosition = await prisma.tasks.findFirst({
      where: { projectId: id, statusId: defaultStatus.id },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const task = await prisma.tasks.create({
      data: {
        projectId: id,
        code,
        title: data.title,
        type: data.type,
        description: data.description,
        acceptanceCriteria: data.acceptanceCriteria,
        priority: data.priority,
        storyPoints: data.storyPoints,
        estimatedHours: data.estimatedHours,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        epicId: data.epicId,
        sprintId: data.sprintId,
        parentId: data.parentId,
        statusId: defaultStatus.id,
        assigneeId: data.assigneeId,
        reporterId: session.user.id,
        position: (maxPosition?.position ?? -1) + 1,
        // Create labels
        ...(data.labelIds && data.labelIds.length > 0 && {
          labels: {
            create: data.labelIds.map(labelId => ({ labelId })),
          },
        }),
      },
      include: {
        status: true,
        epic: { select: { id: true, code: true, title: true, color: true } },
        sprint: { select: { id: true, name: true } },
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        reporter: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        labels: { include: { label: true } },
        _count: { select: { subtasks: true, comments: true, attachments: true } },
      },
    });

    // Record history
    await prisma.task_history.create({
      data: {
        taskId: task.id,
        userId: session.user.id,
        field: 'created',
        newValue: task.title,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
