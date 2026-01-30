import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { moveTaskSchema } from '@/lib/projects/validators';
import { z } from 'zod';

// PUT /api/projects/tasks/[taskId]/move - Move task (status, sprint, position)
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
    const data = moveTaskSchema.parse(body);

    const currentTask = await prisma.tasks.findUnique({
      where: { id: taskId },
      include: { status: true },
    });

    if (!currentTask) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const historyEntries: { field: string; oldValue: string | null; newValue: string | null }[] = [];

    // Handle status change
    if (data.statusId && data.statusId !== currentTask.statusId) {
      const newStatus = await prisma.project_statuses.findUnique({
        where: { id: data.statusId },
      });

      if (!newStatus) {
        return NextResponse.json({ error: 'Statut non trouvé' }, { status: 404 });
      }

      updateData.statusId = data.statusId;
      historyEntries.push({
        field: 'status',
        oldValue: currentTask.status.name,
        newValue: newStatus.name,
      });

      // Handle completedAt
      if (newStatus.isDone && !currentTask.completedAt) {
        updateData.completedAt = new Date();
      } else if (!newStatus.isDone && currentTask.completedAt) {
        updateData.completedAt = null;
      }
    }

    // Handle sprint change
    if (data.sprintId !== undefined && data.sprintId !== currentTask.sprintId) {
      updateData.sprintId = data.sprintId;
      historyEntries.push({
        field: 'sprint',
        oldValue: currentTask.sprintId,
        newValue: data.sprintId,
      });
    }

    // Handle position change
    if (data.position !== undefined) {
      const targetStatusId = data.statusId || currentTask.statusId;

      // Get all tasks in the target column
      const tasksInColumn = await prisma.tasks.findMany({
        where: {
          projectId: currentTask.projectId,
          statusId: targetStatusId,
          id: { not: taskId },
          parentId: null,
        },
        orderBy: { position: 'asc' },
        select: { id: true, position: true },
      });

      // Reorder tasks
      const reorderedTasks = [...tasksInColumn];
      reorderedTasks.splice(data.position, 0, { id: taskId, position: data.position });

      // Update positions
      await prisma.$transaction(
        reorderedTasks.map((task, index) =>
          prisma.tasks.update({
            where: { id: task.id },
            data: { position: index },
          })
        )
      );

      updateData.position = data.position;
    }

    // Update the task
    if (Object.keys(updateData).length > 0) {
      await prisma.tasks.update({
        where: { id: taskId },
        data: updateData,
      });
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

    // Return updated task
    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
      include: {
        status: true,
        epic: { select: { id: true, code: true, title: true, color: true } },
        sprint: { select: { id: true, name: true } },
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        labels: { include: { label: true } },
        _count: { select: { subtasks: true, comments: true } },
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error moving task:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
