import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateTaskSchema } from '@/lib/projects/validators';
import { z } from 'zod';

// GET /api/projects/tasks/[taskId] - Get task details
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

    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: { id: true, code: true, name: true },
        },
        status: true,
        epic: { select: { id: true, code: true, title: true, color: true } },
        sprint: { select: { id: true, name: true, status: true } },
        parent: { select: { id: true, code: true, title: true } },
        subtasks: {
          include: {
            status: true,
            assignee: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
          },
          orderBy: { position: 'asc' },
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        reporter: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        labels: { include: { label: true } },
        comments: {
          where: { parentId: null },
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
            replies: {
              include: {
                author: {
                  select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          include: {
            uploader: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
          },
          orderBy: { uploadedAt: 'desc' },
        },
        timeEntries: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
          },
          orderBy: { date: 'desc' },
        },
        watchers: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
          },
        },
        dependencies: {
          include: {
            toTask: { select: { id: true, code: true, title: true, status: true } },
          },
        },
        dependents: {
          include: {
            fromTask: { select: { id: true, code: true, title: true, status: true } },
          },
        },
        _count: { select: { subtasks: true, comments: true, attachments: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/projects/tasks/[taskId] - Update task
export async function PUT(
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
    const data = updateTaskSchema.parse(body);

    // Get current task for history
    const currentTask = await prisma.tasks.findUnique({
      where: { id: taskId },
      include: { status: true, labels: true },
    });

    if (!currentTask) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    const historyEntries: { field: string; oldValue: string | null; newValue: string | null }[] = [];

    if (data.title && data.title !== currentTask.title) {
      updateData.title = data.title;
      historyEntries.push({ field: 'title', oldValue: currentTask.title, newValue: data.title });
    }

    if (data.description !== undefined && data.description !== currentTask.description) {
      updateData.description = data.description;
      historyEntries.push({ field: 'description', oldValue: currentTask.description, newValue: data.description });
    }

    if (data.type && data.type !== currentTask.type) {
      updateData.type = data.type;
      historyEntries.push({ field: 'type', oldValue: currentTask.type, newValue: data.type });
    }

    if (data.priority && data.priority !== currentTask.priority) {
      updateData.priority = data.priority;
      historyEntries.push({ field: 'priority', oldValue: currentTask.priority, newValue: data.priority });
    }

    if (data.statusId && data.statusId !== currentTask.statusId) {
      updateData.statusId = data.statusId;
      const newStatus = await prisma.project_statuses.findUnique({ where: { id: data.statusId } });
      historyEntries.push({
        field: 'status',
        oldValue: currentTask.status.name,
        newValue: newStatus?.name || data.statusId,
      });

      // If moving to done status, set completedAt
      if (newStatus?.isDone && !currentTask.completedAt) {
        updateData.completedAt = new Date();
      } else if (!newStatus?.isDone && currentTask.completedAt) {
        updateData.completedAt = null;
      }
    }

    if (data.storyPoints !== undefined && data.storyPoints !== currentTask.storyPoints) {
      updateData.storyPoints = data.storyPoints;
      historyEntries.push({
        field: 'storyPoints',
        oldValue: currentTask.storyPoints?.toString() || null,
        newValue: data.storyPoints?.toString() || null,
      });
    }

    if (data.estimatedHours !== undefined && data.estimatedHours !== currentTask.estimatedHours) {
      updateData.estimatedHours = data.estimatedHours;
    }

    if (data.assigneeId !== undefined && data.assigneeId !== currentTask.assigneeId) {
      updateData.assigneeId = data.assigneeId;
      historyEntries.push({
        field: 'assignee',
        oldValue: currentTask.assigneeId,
        newValue: data.assigneeId,
      });
    }

    if (data.epicId !== undefined && data.epicId !== currentTask.epicId) {
      updateData.epicId = data.epicId;
    }

    if (data.sprintId !== undefined && data.sprintId !== currentTask.sprintId) {
      updateData.sprintId = data.sprintId;
    }

    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }

    if (data.acceptanceCriteria !== undefined) {
      updateData.acceptanceCriteria = data.acceptanceCriteria;
    }

    if (data.position !== undefined) {
      updateData.position = data.position;
    }

    // Update task
    const task = await prisma.tasks.update({
      where: { id: taskId },
      data: updateData,
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

    // Update labels if provided
    if (data.labelIds) {
      // Remove existing labels
      await prisma.task_labels.deleteMany({ where: { taskId } });
      // Add new labels
      if (data.labelIds.length > 0) {
        await prisma.task_labels.createMany({
          data: data.labelIds.map(labelId => ({ taskId, labelId })),
        });
      }
    }

    // Create history entries
    if (historyEntries.length > 0) {
      await prisma.task_history.createMany({
        data: historyEntries.map(entry => ({
          taskId,
          userId: session.user.id,
          ...entry,
        })),
      });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/projects/tasks/[taskId] - Delete task
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { taskId } = await params;

    await prisma.tasks.delete({ where: { id: taskId } });

    return NextResponse.json({ message: 'Tâche supprimée' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
