import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/projects/[id]/backlog - Get backlog tasks (not in any sprint)
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
    const groupByEpic = searchParams.get('groupByEpic') !== 'false';

    // Get tasks not in any sprint
    const tasks = await prisma.tasks.findMany({
      where: {
        projectId: id,
        sprintId: null,
        parentId: null, // Only top-level tasks
      },
      include: {
        status: true,
        epic: { select: { id: true, code: true, title: true, color: true } },
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        labels: { include: { label: true } },
        _count: { select: { subtasks: true, comments: true } },
      },
      orderBy: [
        { epic: { code: 'asc' } },
        { priority: 'asc' },
        { position: 'asc' },
      ],
    });

    if (!groupByEpic) {
      return NextResponse.json({ tasks, totalTasks: tasks.length });
    }

    // Group by epic
    const epics = await prisma.epics.findMany({
      where: { projectId: id },
      orderBy: { code: 'asc' },
    });

    const groups = epics.map(epic => ({
      epic,
      tasks: tasks.filter(t => t.epicId === epic.id),
    }));

    const unassignedTasks = tasks.filter(t => !t.epicId);

    return NextResponse.json({
      groups,
      unassignedTasks,
      totalTasks: tasks.length,
    });
  } catch (error) {
    console.error('Error fetching backlog:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
