import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/projects/[id]/board - Get kanban board data
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
    const sprintId = searchParams.get('sprintId');
    const epicId = searchParams.get('epicId');
    const assigneeId = searchParams.get('assigneeId');

    // Build task filter
    const taskWhere: Record<string, unknown> = {
      projectId: id,
      parentId: null, // Only top-level tasks
    };

    if (sprintId) taskWhere.sprintId = sprintId;
    if (epicId) taskWhere.epicId = epicId;
    if (assigneeId) taskWhere.assigneeId = assigneeId;

    // Get statuses with their tasks
    const statuses = await prisma.project_statuses.findMany({
      where: { projectId: id },
      orderBy: { position: 'asc' },
      include: {
        tasks: {
          where: taskWhere,
          include: {
            epic: { select: { id: true, code: true, title: true, color: true } },
            assignee: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
            labels: { include: { label: true } },
            _count: { select: { subtasks: true, comments: true } },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    // Transform to kanban format
    const columns = statuses.map(status => ({
      id: status.id,
      name: status.name,
      color: status.color,
      position: status.position,
      isDefault: status.isDefault,
      isDone: status.isDone,
      tasks: status.tasks,
    }));

    const taskCount = columns.reduce((sum, col) => sum + col.tasks.length, 0);

    return NextResponse.json({
      columns,
      taskCount,
    });
  } catch (error) {
    console.error('Error fetching board:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
